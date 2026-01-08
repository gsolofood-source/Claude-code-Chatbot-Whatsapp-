import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const hours = searchParams.get("hours") || "15";

    // Fetch user chat logs from the bot API
    const response = await fetch(
      `${BOT_API_URL}/conversations/logs/user/${userId}?hours=${hours}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user chat logs from bot");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      userId: data.userId || userId,
      hours: parseInt(hours),
      totalMessages: data.totalMessages || 0,
      logs: data.logs || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user chat logs:", error);

    return NextResponse.json({
      success: false,
      userId: "",
      hours: 15,
      totalMessages: 0,
      logs: [],
      timestamp: new Date().toISOString(),
      error: "Bot API unreachable",
    });
  }
}
