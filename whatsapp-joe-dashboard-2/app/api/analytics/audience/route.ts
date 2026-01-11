import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Total users
    const totalUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users"
    );
    const totalUsers = parseInt(totalUsersResult?.count || "0");

    // Active users (last 7 days)
    const activeUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE last_seen >= NOW() - INTERVAL '7 days'"
    );
    const activeUsers = parseInt(activeUsersResult?.count || "0");

    // New users this week
    const newUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const newUsers = parseInt(newUsersResult?.count || "0");

    // New users last week (for trend)
    const lastWeekUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'"
    );
    const lastWeekUsers = parseInt(lastWeekUsersResult?.count || "0");
    const userGrowth = lastWeekUsers > 0 
      ? Math.round(((newUsers - lastWeekUsers) / lastWeekUsers) * 100) 
      : 0;

    // Users by activity level (using total_messages from users table)
    // Must repeat CASE in GROUP BY - PostgreSQL doesn't allow alias in GROUP BY
    const usersByActivity = await query<{ 
      activity_level: string; 
      count: string 
    }>(`
      SELECT 
        CASE 
          WHEN total_messages >= 50 THEN 'super_active'
          WHEN total_messages >= 20 THEN 'active'
          WHEN total_messages >= 5 THEN 'moderate'
          ELSE 'casual'
        END as activity_level,
        COUNT(*) as count
      FROM users
      GROUP BY 
        CASE 
          WHEN total_messages >= 50 THEN 'super_active'
          WHEN total_messages >= 20 THEN 'active'
          WHEN total_messages >= 5 THEN 'moderate'
          ELSE 'casual'
        END
    `);

    // Average messages per user
    const avgMessagesResult = await queryOne<{ avg: string }>(`
      SELECT ROUND(AVG(total_messages)::numeric, 1) as avg FROM users
    `);
    const avgMessagesPerUser = parseFloat(avgMessagesResult?.avg || "0");

    // Returning users rate (users with more than 1 conversation)
    const returningUsersResult = await queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM users
      WHERE total_conversations > 1
    `);
    const returningUsers = parseInt(returningUsersResult?.count || "0");
    const returnRate = totalUsers > 0 
      ? Math.round((returningUsers / totalUsers) * 100) 
      : 0;

    // Users who made calls
    const callingUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(DISTINCT user_id) as count FROM call_transcripts"
    );
    const callingUsers = parseInt(callingUsersResult?.count || "0");

    // User registration trend (last 30 days)
    const registrationTrend = await query<{ date: string; count: string }>(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date
    `);

    return NextResponse.json({
      success: true,
      audience: {
        totalUsers,
        activeUsers,
        newUsers,
        userGrowth,
        avgMessagesPerUser,
        returnRate,
        callingUsers,
        activityBreakdown: {
          superActive: parseInt(usersByActivity.find(u => u.activity_level === 'super_active')?.count || "0"),
          active: parseInt(usersByActivity.find(u => u.activity_level === 'active')?.count || "0"),
          moderate: parseInt(usersByActivity.find(u => u.activity_level === 'moderate')?.count || "0"),
          casual: parseInt(usersByActivity.find(u => u.activity_level === 'casual')?.count || "0"),
        },
        registrationTrend: registrationTrend.map(r => ({
          date: r.date,
          count: parseInt(r.count),
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching audience insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch audience insights", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
