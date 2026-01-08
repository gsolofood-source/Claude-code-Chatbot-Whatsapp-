import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = searchParams.get("hours") || "15";

    // Fetch chat logs stats from the bot API
    const response = await fetch(`${BOT_API_URL}/conversations/logs/stats?hours=${hours}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chat logs stats from bot");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      stats: data.stats || {
        totalMessages: 0,
        uniqueUsers: 0,
        timeRange: parseInt(hours),
        users: [],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching chat logs stats:", error);

    return NextResponse.json({
      success: false,
      stats: {
        totalMessages: 0,
        uniqueUsers: 0,
        timeRange: parseInt(hours || "15"),
        users: [],
      },
      timestamp: new Date().toISOString(),
      error: "Bot API unreachable",
    });
  }
}
