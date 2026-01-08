import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = searchParams.get("hours") || "15";

    // Fetch chat logs from the bot API
    const response = await fetch(`${BOT_API_URL}/conversations/logs/recent?hours=${hours}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chat logs from bot");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      hours: parseInt(hours),
      totalMessages: data.totalMessages || 0,
      logs: data.logs || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching chat logs:", error);

    return NextResponse.json({
      success: false,
      hours: 15,
      totalMessages: 0,
      logs: [],
      timestamp: new Date().toISOString(),
      error: "Bot API unreachable",
    });
  }
}
