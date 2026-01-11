import { NextResponse } from "next/server";
import { query, queryOne, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = safeInt(searchParams.get("hours"), 1, 168, 24); // Max 7 days
    const limit = safeInt(searchParams.get("limit"), 1, 500, 100);

    // Get recent messages using parameterized interval
    const logs = await query<{
      id: string;
      conversation_id: string;
      user_id: string;
      user_name: string;
      phone_number: string;
      sender: string;
      message_type: string;
      content: string;
      created_at: string;
      response_time_ms: string | null;
    }>(`
      SELECT 
        m.id,
        m.conversation_id,
        c.user_id,
        COALESCE(u.name, 'Utente Anonimo') as user_name,
        u.phone_number,
        m.sender,
        m.message_type,
        m.content,
        m.created_at,
        m.response_time_ms
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      JOIN users u ON u.id = c.user_id
      WHERE m.created_at >= NOW() - ($1 || ' hours')::interval
      ORDER BY m.created_at DESC
      LIMIT $2
    `, [hours.toString(), limit]);

    // Get total count for this period
    const countResult = await queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - ($1 || ' hours')::interval
    `, [hours.toString()]);
    const totalMessages = parseInt(countResult?.count || "0");

    // Format logs
    const formattedLogs = logs.map(log => {
      const maskedPhone = log.phone_number.replace(
        /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
        '$1 $2****$4'
      );

      return {
        id: log.id,
        conversationId: log.conversation_id,
        userId: log.user_id,
        userName: log.user_name,
        phone: maskedPhone,
        sender: log.sender,
        type: log.message_type,
        content: log.content,
        timestamp: log.created_at,
        responseTimeMs: log.response_time_ms ? parseInt(log.response_time_ms) : null,
      };
    });

    return NextResponse.json({
      success: true,
      hours,
      totalMessages,
      logs: formattedLogs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching chat logs:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chat logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
