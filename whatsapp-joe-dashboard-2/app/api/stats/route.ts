import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Total messages
    const totalMessagesResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM messages"
    );
    const totalMessages = parseInt(totalMessagesResult?.count || "0");

    // Messages this week
    const messagesThisWeekResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM messages WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const messagesThisWeek = parseInt(messagesThisWeekResult?.count || "0");

    // Messages last week (for trend)
    const messagesLastWeekResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM messages WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'"
    );
    const messagesLastWeek = parseInt(messagesLastWeekResult?.count || "0");

    // Calculate message trend
    const messageTrend = messagesLastWeek > 0 
      ? Math.round(((messagesThisWeek - messagesLastWeek) / messagesLastWeek) * 100) 
      : 0;

    // Active users (with activity in last 7 days)
    const activeUsersResult = await queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) as count FROM conversations 
       WHERE started_at >= NOW() - INTERVAL '7 days'`
    );
    const activeUsers = parseInt(activeUsersResult?.count || "0");

    // Total users
    const totalUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users"
    );
    const totalUsers = parseInt(totalUsersResult?.count || "0");

    // New users this week
    const newUsersThisWeekResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const newUsersThisWeek = parseInt(newUsersThisWeekResult?.count || "0");

    // Average response time
    const avgResponseResult = await queryOne<{ avg: string }>(
      `SELECT ROUND(AVG(response_time_ms)) as avg FROM messages 
       WHERE sender = 'bot' AND response_time_ms IS NOT NULL`
    );
    const avgResponseMs = parseInt(avgResponseResult?.avg || "0");
    const avgResponseTime = avgResponseMs > 1000 
      ? `${(avgResponseMs / 1000).toFixed(1)}s` 
      : `${avgResponseMs}ms`;

    // Total calls
    const totalCallsResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM call_transcripts"
    );
    const totalCalls = parseInt(totalCallsResult?.count || "0");

    // Total call duration
    const totalCallDurationResult = await queryOne<{ total: string }>(
      "SELECT COALESCE(SUM(call_duration_seconds), 0) as total FROM call_transcripts"
    );
    const totalCallMinutes = Math.round(parseInt(totalCallDurationResult?.total || "0") / 60);

    // Message timeline (last 24 hours, grouped by hour)
    const timelineData = await query<{ hour: string; messages: string }>(
      `SELECT 
        TO_CHAR(created_at, 'HH24:00') as hour,
        COUNT(*) as messages
       FROM messages 
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY TO_CHAR(created_at, 'HH24:00')
       ORDER BY hour`
    );

    // Fill in missing hours
    const timeline = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0") + ":00";
      const found = timelineData.find((t) => t.hour === hour);
      timeline.push({
        time: hour,
        messages: found ? parseInt(found.messages) : 0,
      });
    }

    // Messages by type
    const messagesByType = await query<{ message_type: string; count: string }>(
      `SELECT message_type, COUNT(*) as count FROM messages GROUP BY message_type`
    );

    const textMessages = parseInt(
      messagesByType.find((m) => m.message_type === "text")?.count || "0"
    );
    const audioMessages = parseInt(
      messagesByType.find((m) => m.message_type === "audio")?.count || "0"
    );

    return NextResponse.json({
      stats: {
        totalMessages,
        activeUsers,
        totalUsers,
        newUsersThisWeek,
        avgResponseTime,
        totalCalls,
        totalCallMinutes,
        textMessages,
        audioMessages,
        apiCosts: "$0.00", // TODO: implement cost tracking
        trends: {
          messages: { 
            value: Math.abs(messageTrend), 
            isPositive: messageTrend >= 0 
          },
          users: { 
            value: newUsersThisWeek, 
            isPositive: true 
          },
          responseTime: { value: 0, isPositive: true },
          costs: { value: 0, isPositive: false },
        },
      },
      timeline,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch stats from database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
