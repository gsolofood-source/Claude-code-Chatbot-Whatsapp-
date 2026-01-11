import { NextResponse } from "next/server";
import { query, queryOne, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const hours = safeInt(searchParams.get("hours"), 1, 168, 24); // Max 7 days
    const limit = safeInt(searchParams.get("limit"), 1, 500, 100);

    // Get user info
    const user = await queryOne<{
      id: string;
      name: string;
      phone_number: string;
      created_at: string;
      last_seen: string;
    }>(`
      SELECT id, COALESCE(name, 'Utente Anonimo') as name, phone_number, created_at, last_seen
      FROM users
      WHERE id = $1
    `, [userId]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user messages with parameterized interval
    const logs = await query<{
      id: string;
      conversation_id: string;
      role: string;
      message_type: string;
      content: string;
      created_at: string;
      processing_time_ms: string | null;
    }>(`
      SELECT 
        m.id,
        m.conversation_id,
        m.role,
        m.message_type,
        m.content,
        m.created_at,
        m.processing_time_ms
      FROM messages m
      WHERE m.user_id = $1
        AND m.created_at >= NOW() - ($2 || ' hours')::interval
      ORDER BY m.created_at DESC
      LIMIT $3
    `, [userId, hours.toString(), limit]);

    // Get total count
    const countResult = await queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE user_id = $1
        AND created_at >= NOW() - ($2 || ' hours')::interval
    `, [userId, hours.toString()]);
    const totalMessages = parseInt(countResult?.count || "0");

    // Mask phone
    const maskedPhone = user.phone_number.replace(
      /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
      '$1 $2****$4'
    );

    // Format logs
    const formattedLogs = logs.map(log => ({
      id: log.id,
      conversationId: log.conversation_id,
      role: log.role,
      type: log.message_type,
      content: log.content,
      timestamp: log.created_at,
      processingTimeMs: log.processing_time_ms ? parseInt(log.processing_time_ms) : null,
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: maskedPhone,
        createdAt: user.created_at,
        lastSeen: user.last_seen,
      },
      hours,
      totalMessages,
      logs: formattedLogs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user chat logs:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user chat logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
