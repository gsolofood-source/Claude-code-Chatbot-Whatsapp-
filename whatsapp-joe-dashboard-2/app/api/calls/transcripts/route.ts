import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3001";

export async function GET() {
  try {
    // Fetch call transcripts from the bot API
    const response = await fetch(`${BOT_API_URL}/calls/transcripts`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch call transcripts from bot");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      total: data.total || 0,
      transcripts: data.transcripts || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching call transcripts:", error);

    return NextResponse.json({
      success: false,
      total: 0,
      transcripts: [],
      timestamp: new Date().toISOString(),
      error: "Bot API unreachable",
    });
  }
}
