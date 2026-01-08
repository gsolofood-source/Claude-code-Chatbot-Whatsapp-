import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3001";

export async function GET() {
  try {
    // Fetch real stats from the bot API
    const response = await fetch(`${BOT_API_URL}/stats`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stats from bot");
    }

    const data = await response.json();

    return NextResponse.json({
      stats: {
        totalMessages: data.total_messages || 0,
        activeUsers: data.active_conversations || 0,
        avgResponseTime: data.avg_response_time || "0s",
        apiCosts: `$${(data.api_costs || 0).toFixed(2)}`,
        trends: {
          messages: { value: 0, isPositive: true },
          users: { value: 0, isPositive: true },
          responseTime: { value: 0, isPositive: true },
          costs: { value: 0, isPositive: false },
        },
      },
      timeline: data.timeline || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);

    // Return empty stats if bot is unreachable
    return NextResponse.json({
      stats: {
        totalMessages: 0,
        activeUsers: 0,
        avgResponseTime: "0s",
        apiCosts: "$0.00",
        trends: {
          messages: { value: 0, isPositive: true },
          users: { value: 0, isPositive: true },
          responseTime: { value: 0, isPositive: true },
          costs: { value: 0, isPositive: false },
        },
      },
      timeline: [],
      timestamp: new Date().toISOString(),
      error: "Bot API unreachable",
    });
  }
}
