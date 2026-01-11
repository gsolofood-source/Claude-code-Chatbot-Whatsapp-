import { NextResponse } from "next/server";
import { query, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = safeInt(searchParams.get("limit"), 1, 100, 10);
  const period = searchParams.get("period") || "all"; // all, week, month

  try {
    // Build date filter safely (only predefined values)
    let dateFilter = "";
    if (period === "week") {
      dateFilter = "AND m.created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === "month") {
      dateFilter = "AND m.created_at >= NOW() - INTERVAL '30 days'";
    }

    // Top users by message count with parameterized limit
    const topUsers = await query<{
      user_id: string;
      name: string;
      phone_number: string;
      message_count: string;
      first_interaction: string;
      last_interaction: string;
      call_count: string;
      total_call_minutes: string;
    }>(`
      SELECT 
        u.id as user_id,
        COALESCE(u.name, 'Utente Anonimo') as name,
        u.phone_number,
        COUNT(m.id) as message_count,
        MIN(m.created_at) as first_interaction,
        MAX(m.created_at) as last_interaction,
        COALESCE(ct.call_count, 0) as call_count,
        COALESCE(ct.total_minutes, 0) as total_call_minutes
      FROM users u
      LEFT JOIN conversations c ON c.user_id = u.id
      LEFT JOIN messages m ON m.conversation_id = c.id AND m.sender = 'user' ${dateFilter}
      LEFT JOIN (
        SELECT 
          user_id, 
          COUNT(*) as call_count,
          ROUND(SUM(call_duration_seconds) / 60.0, 1) as total_minutes
        FROM call_transcripts
        GROUP BY user_id
      ) ct ON ct.user_id = u.id
      GROUP BY u.id, u.name, u.phone_number, ct.call_count, ct.total_minutes
      HAVING COUNT(m.id) > 0
      ORDER BY message_count DESC
      LIMIT $1
    `, [limit]);

    // Calculate engagement scores
    const usersWithScores = topUsers.map((user, index) => {
      const messageCount = parseInt(user.message_count);
      const callCount = parseInt(user.call_count);
      const callMinutes = parseFloat(user.total_call_minutes);
      
      // Simple engagement score: messages + (calls * 10) + (call_minutes * 2)
      const engagementScore = messageCount + (callCount * 10) + (callMinutes * 2);

      // Mask phone number for privacy
      const maskedPhone = user.phone_number.replace(/(\+\d{2})(\d{3})(\d+)(\d{3})/, '$1 $2****$4');

      return {
        rank: index + 1,
        userId: user.user_id,
        name: user.name,
        phone: maskedPhone,
        stats: {
          messages: messageCount,
          calls: parseInt(user.call_count),
          callMinutes: parseFloat(user.total_call_minutes),
        },
        engagementScore: Math.round(engagementScore),
        firstInteraction: user.first_interaction,
        lastInteraction: user.last_interaction,
      };
    });

    // User activity summary
    const totalEngagement = usersWithScores.reduce((sum, u) => sum + u.engagementScore, 0);
    const topUserShare = usersWithScores.length > 0 
      ? Math.round((usersWithScores[0]?.engagementScore / totalEngagement) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      topUsers: usersWithScores,
      summary: {
        totalTopUsers: usersWithScores.length,
        totalEngagement,
        topUserShare: `${topUserShare}%`,
        mostActiveUser: usersWithScores[0]?.name || "N/A",
        insight: usersWithScores.length > 0 
          ? `I tuoi top ${limit} utenti rappresentano i fan più coinvolti. ${usersWithScores[0]?.name} è il tuo utente più attivo con ${usersWithScores[0]?.stats.messages} messaggi.`
          : "Nessun dato disponibile per questo periodo.",
      },
      period,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching top users:", error);
    return NextResponse.json(
      { error: "Failed to fetch top users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
