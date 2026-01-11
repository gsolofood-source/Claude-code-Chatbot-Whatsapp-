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
      audio_count: string;
      total_audio_seconds: string;
    }>(`
      SELECT 
        u.id as user_id,
        COALESCE(u.name, 'Utente Anonimo') as name,
        u.phone_number,
        COUNT(m.id) as message_count,
        MIN(m.created_at) as first_interaction,
        MAX(m.created_at) as last_interaction,
        COUNT(CASE WHEN m.message_type = 'audio' THEN 1 END) as audio_count,
        COALESCE(SUM(m.audio_duration_seconds), 0) as total_audio_seconds
      FROM users u
      LEFT JOIN messages m ON m.user_id = u.id AND m.role = 'user' ${dateFilter}
      GROUP BY u.id, u.name, u.phone_number
      HAVING COUNT(m.id) > 0
      ORDER BY message_count DESC
      LIMIT $1
    `, [limit]);

    // Calculate engagement scores
    const usersWithScores = topUsers.map((user, index) => {
      const messageCount = parseInt(user.message_count);
      const audioCount = parseInt(user.audio_count);
      const audioMinutes = parseFloat(user.total_audio_seconds) / 60;
      
      // Simple engagement score: messages + (audio_messages * 10) + (audio_minutes * 2)
      const engagementScore = messageCount + (audioCount * 10) + (audioMinutes * 2);

      // Mask phone number for privacy
      const maskedPhone = user.phone_number.replace(/(\+\d{2})(\d{3})(\d+)(\d{3})/, '$1 $2****$4');

      return {
        rank: index + 1,
        userId: user.user_id,
        name: user.name,
        phone: maskedPhone,
        stats: {
          messages: messageCount,
          audioMessages: parseInt(user.audio_count),
          audioMinutes: Math.round(audioMinutes * 10) / 10,
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
