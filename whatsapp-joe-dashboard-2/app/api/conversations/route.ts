import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Se userId è specificato, ottieni la conversazione specifica
    if (userId) {
      const response = await fetch(`${BOT_API_URL}/conversations/${userId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch conversation from bot");
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Altrimenti ottieni tutte le conversazioni
    const response = await fetch(`${BOT_API_URL}/conversations`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch conversations from bot");
    }

    const data = await response.json();

    // Transform conversations to frontend format
    const conversations = (data.conversations || []).map((conv: any) => ({
      id: conv.userId,
      userId: conv.userId,
      userName: conv.userId.substring(0, 10) + "...",
      lastMessage: conv.lastMessage || "No messages",
      timestamp: conv.lastActivity,
      status: "active",
      unread: false,
      messageCount: conv.messageCount || 0,
      type: conv.lastMessageType === "assistant" ? "bot" : conv.lastMessageType || "text",
    }));

    return NextResponse.json({
      conversations,
      total: conversations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);

    return NextResponse.json({
      conversations: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: "Bot API unreachable",
    });
  }
}
