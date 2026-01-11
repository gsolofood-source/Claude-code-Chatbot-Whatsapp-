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
      is_active: boolean;
      summary: string | null;
    }>(`
      SELECT 
        c.id as conversation_id,
        u.id as user_id,
        COALESCE(u.name, 'Utente Anonimo') as user_name,
        u.phone_number,
        c.started_at,
        c.is_active,
        c.summary
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
      role: string;
      message_type: string;
      content: string;
      audio_transcript: string | null;
      audio_duration_seconds: string | null;
      created_at: string;
      processing_time_ms: string | null;
    }>(`
      SELECT 
        id,
        role,
        message_type,
        content,
        audio_transcript,
        audio_duration_seconds,
        created_at,
        processing_time_ms
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [id]);

    // Mask phone number
    const maskedPhone = conversation.phone_number.replace(
      /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
      '$1 $2****$4'
    );

    // Get call transcripts for this conversation
    const callTranscripts = await query<{
      id: string;
      direction: string;
      duration_seconds: string;
      transcript_json: string;
      summary: string | null;
      started_at: string;
      ended_at: string | null;
    }>(`
      SELECT 
        id,
        direction,
        duration_seconds,
        transcript_json::text,
        summary,
        started_at,
        ended_at
      FROM call_transcripts
      WHERE conversation_id = $1
      ORDER BY started_at DESC
    `, [id]);

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      sender: msg.role === 'assistant' ? 'bot' : 'user',
      type: msg.message_type,
      content: msg.content,
      audioTranscript: msg.audio_transcript,
      audioDuration: msg.audio_duration_seconds ? parseInt(msg.audio_duration_seconds) : null,
      timestamp: msg.created_at,
      processingTimeMs: msg.processing_time_ms ? parseInt(msg.processing_time_ms) : null,
    }));

    // Format call transcripts
    const formattedCalls = callTranscripts.map(call => {
      const durationSeconds = parseInt(call.duration_seconds);
      
      // Parse transcript JSON
      let transcriptText = 'Nessuna trascrizione';
      try {
        if (call.transcript_json) {
          const parsed = JSON.parse(call.transcript_json);
          if (Array.isArray(parsed)) {
            transcriptText = parsed.map((item: { role?: string; text?: string; content?: string }) => 
              `${item.role || 'unknown'}: ${item.text || item.content || ''}`
            ).join('\n');
          } else if (typeof parsed === 'string') {
            transcriptText = parsed;
          }
        }
      } catch {
        transcriptText = call.summary || 'Nessuna trascrizione';
      }

      return {
        id: call.id,
        direction: call.direction,
        transcript: transcriptText,
        summary: call.summary,
        durationSeconds,
        durationFormatted: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        startedAt: call.started_at,
        endedAt: call.ended_at,
      };
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.conversation_id,
        userId: conversation.user_id,
        userName: conversation.user_name,
        phone: maskedPhone,
        startedAt: conversation.started_at,
        status: conversation.is_active ? 'active' : 'ended',
        summary: conversation.summary,
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
