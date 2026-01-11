import { NextResponse } from "next/server";
import { query, queryOne, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = safeInt(searchParams.get("limit"), 1, 100, 20);
  const offset = safeInt(searchParams.get("offset"), 0, 10000, 0);

  try {
    // Get call transcripts with user info
    const transcripts = await query<{
      id: string;
      user_id: string;
      user_name: string;
      phone_number: string;
      conversation_id: string;
      direction: string;
      duration_seconds: string;
      transcript_json: string;
      summary: string | null;
      started_at: string;
      ended_at: string | null;
      created_at: string;
    }>(`
      SELECT 
        ct.id,
        ct.user_id,
        COALESCE(u.name, 'Utente Anonimo') as user_name,
        u.phone_number,
        ct.conversation_id,
        ct.direction,
        ct.duration_seconds,
        ct.transcript_json::text,
        ct.summary,
        ct.started_at,
        ct.ended_at,
        ct.created_at
      FROM call_transcripts ct
      JOIN users u ON u.id = ct.user_id
      ORDER BY ct.started_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM call_transcripts"
    );
    const total = parseInt(countResult?.count || "0");

    // Get total call duration
    const durationResult = await queryOne<{ total: string }>(
      "SELECT COALESCE(SUM(duration_seconds), 0) as total FROM call_transcripts"
    );
    const totalDurationSeconds = parseInt(durationResult?.total || "0");
    const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

    // Average call duration
    const avgDurationSeconds = total > 0 ? Math.round(totalDurationSeconds / total) : 0;

    // Format transcripts
    const formattedTranscripts = transcripts.map(t => {
      const durationSeconds = parseInt(t.duration_seconds);
      const maskedPhone = t.phone_number.replace(
        /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
        '$1 $2****$4'
      );

      // Parse transcript JSON if available
      let transcriptText = 'Nessuna trascrizione disponibile';
      try {
        if (t.transcript_json) {
          const parsed = JSON.parse(t.transcript_json);
          if (Array.isArray(parsed)) {
            transcriptText = parsed.map((item: { role?: string; text?: string; content?: string }) => 
              `${item.role || 'unknown'}: ${item.text || item.content || ''}`
            ).join('\n');
          } else if (typeof parsed === 'string') {
            transcriptText = parsed;
          }
        }
      } catch {
        transcriptText = t.summary || 'Nessuna trascrizione disponibile';
      }

      return {
        id: t.id,
        userId: t.user_id,
        userName: t.user_name,
        phone: maskedPhone,
        conversationId: t.conversation_id,
        direction: t.direction,
        transcript: transcriptText,
        summary: t.summary,
        duration: {
          seconds: durationSeconds,
          formatted: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        },
        startedAt: t.started_at,
        endedAt: t.ended_at,
        createdAt: t.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      transcripts: formattedTranscripts,
      stats: {
        total,
        totalDurationMinutes,
        avgDurationSeconds,
        avgDurationFormatted: `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching call transcripts:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch call transcripts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
