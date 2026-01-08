import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3001";

export async function GET() {
  try {
    // Fetch active calls from the bot API
    const response = await fetch(`${BOT_API_URL}/calls/active`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch calls from bot");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      active_calls: data.active_calls || 0,
      calls: data.calls || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching calls:", error);

    return NextResponse.json({
      success: false,
      active_calls: 0,
      calls: [],
      timestamp: new Date().toISOString(),
      error: "Bot API unreachable",
    });
  }
}
