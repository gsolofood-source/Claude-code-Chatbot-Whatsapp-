import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get conversation with user info
    const conversation = await queryOne<{
      conversation_id: string;
      user_id: string;
      user_name: string;
      phone_number: string;
      started_at: string;
      status: string;
    }>(`
      SELECT 
        c.id as conversation_id,
        u.id as user_id,
        COALESCE(u.name, 'Utente Anonimo') as user_name,
        u.phone_number,
        c.started_at,
        c.status
      FROM conversations c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = $1
    `, [id]);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get all messages for this conversation
    const messages = await query<{
      id: string;
      sender: string;
      message_type: string;
      content: string;
      audio_url: string | null;
      created_at: string;
      response_time_ms: string | null;
    }>(`
      SELECT 
        id,
        sender,
        message_type,
        content,
        audio_url,
        created_at,
        response_time_ms
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [id]);

    // Mask phone number
    const maskedPhone = conversation.phone_number.replace(
      /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
      '$1 $2****$4'
    );

    // Get call transcripts for this user
    const callTranscripts = await query<{
      id: string;
      transcript: string;
      call_duration_seconds: string;
      call_started_at: string;
      call_ended_at: string;
    }>(`
      SELECT 
        id,
        transcript,
        call_duration_seconds,
        call_started_at,
        call_ended_at
      FROM call_transcripts
      WHERE user_id = $1
      ORDER BY call_started_at DESC
    `, [conversation.user_id]);

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      sender: msg.sender,
      type: msg.message_type,
      content: msg.content,
      audioUrl: msg.audio_url,
      timestamp: msg.created_at,
      responseTimeMs: msg.response_time_ms ? parseInt(msg.response_time_ms) : null,
    }));

    // Format call transcripts
    const formattedCalls = callTranscripts.map(call => ({
      id: call.id,
      transcript: call.transcript,
      durationSeconds: parseInt(call.call_duration_seconds),
      durationFormatted: `${Math.floor(parseInt(call.call_duration_seconds) / 60)}m ${parseInt(call.call_duration_seconds) % 60}s`,
      startedAt: call.call_started_at,
      endedAt: call.call_ended_at,
    }));

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.conversation_id,
        userId: conversation.user_id,
        userName: conversation.user_name,
        phone: maskedPhone,
        startedAt: conversation.started_at,
        status: conversation.status || 'active',
        messageCount: messages.length,
      },
      messages: formattedMessages,
      calls: formattedCalls,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch conversation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
