import { NextResponse } from "next/server";
import { query, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = safeInt(searchParams.get("days"), 1, 90, 30); // Max 90 days

  try {
    // Messages by hour of day (user messages only)
    const hourlyDistribution = await query<{ hour: string; count: string }>(`
      SELECT 
        TO_CHAR(created_at, 'HH24') as hour,
        COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - ($1 || ' days')::interval
        AND role = 'user'
      GROUP BY TO_CHAR(created_at, 'HH24')
      ORDER BY hour
    `, [days.toString()]);

    // Fill all 24 hours
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      const found = hourlyDistribution.find(h => h.hour === hour);
      hourlyData.push({
        hour: `${hour}:00`,
        messages: found ? parseInt(found.count) : 0,
      });
    }

    // Find peak hours (top 3)
    const sortedHours = [...hourlyData].sort((a, b) => b.messages - a.messages);
    const peakHours = sortedHours.slice(0, 3);

    // Messages by day of week
    const dailyDistribution = await query<{ day: string; day_name: string; count: string }>(`
      SELECT 
        EXTRACT(DOW FROM created_at)::text as day,
        TO_CHAR(created_at, 'Day') as day_name,
        COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - ($1 || ' days')::interval
        AND role = 'user'
      GROUP BY EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'Day')
      ORDER BY day
    `, [days.toString()]);

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const weeklyData = dayNames.map((name, i) => {
      const found = dailyDistribution.find(d => parseInt(d.day) === i);
      return {
        day: name,
        messages: found ? parseInt(found.count) : 0,
      };
    });

    // Peak day
    const peakDay = [...weeklyData].sort((a, b) => b.messages - a.messages)[0];

    // Heatmap data (hour x day)
    const heatmapData = await query<{ day: string; hour: string; count: string }>(`
      SELECT 
        EXTRACT(DOW FROM created_at)::text as day,
        TO_CHAR(created_at, 'HH24') as hour,
        COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - ($1 || ' days')::interval
        AND role = 'user'
      GROUP BY EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'HH24')
    `, [days.toString()]);

    // Format heatmap
    const heatmap: { day: string; hours: { hour: string; value: number }[] }[] = [];
    for (let d = 0; d < 7; d++) {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        const hourStr = h.toString().padStart(2, "0");
        const found = heatmapData.find(
          item => parseInt(item.day) === d && item.hour === hourStr
        );
        hours.push({
          hour: `${hourStr}:00`,
          value: found ? parseInt(found.count) : 0,
        });
      }
      heatmap.push({
        day: dayNames[d],
        hours,
      });
    }

    // Calculate best time to engage
    const bestTimeToEngage = peakHours[0]?.hour || "N/A";
    const bestDayToEngage = peakDay?.day || "N/A";

    return NextResponse.json({
      success: true,
      peakHours: {
        hourlyDistribution: hourlyData,
        weeklyDistribution: weeklyData,
        heatmap,
        insights: {
          peakHours: peakHours.map(h => h.hour),
          peakDay: bestDayToEngage,
          bestTimeToEngage,
          recommendation: `Il tuo pubblico è più attivo ${bestDayToEngage} alle ${bestTimeToEngage}. Considera di pubblicare contenuti o rispondere in questi orari.`,
        },
      },
      period: `${days} days`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching peak hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch peak hours", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
