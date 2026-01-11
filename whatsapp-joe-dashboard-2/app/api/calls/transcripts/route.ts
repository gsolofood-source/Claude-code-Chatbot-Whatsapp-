import { NextResponse } from "next/server";
import { query, queryOne, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = safeInt(searchParams.get("limit"), 1, 100, 20);
  const offset = safeInt(searchParams.get("offset"), 0, 10000, 0);

  try {
    // Get call transcripts with user info using parameterized query
    const transcripts = await query<{
      id: string;
      user_id: string;
      user_name: string;
      phone_number: string;
      conversation_id: string;
      transcript: string;
      call_duration_seconds: string;
      call_started_at: string;
      call_ended_at: string;
      created_at: string;
    }>(`
      SELECT 
        ct.id,
        ct.user_id,
        COALESCE(u.name, 'Utente Anonimo') as user_name,
        u.phone_number,
        ct.conversation_id,
        ct.transcript,
        ct.call_duration_seconds,
        ct.call_started_at,
        ct.call_ended_at,
        ct.created_at
      FROM call_transcripts ct
      JOIN users u ON u.id = ct.user_id
      ORDER BY ct.call_started_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM call_transcripts"
    );
    const total = parseInt(countResult?.count || "0");

    // Get total call duration
    const durationResult = await queryOne<{ total: string }>(
      "SELECT COALESCE(SUM(call_duration_seconds), 0) as total FROM call_transcripts"
    );
    const totalDurationSeconds = parseInt(durationResult?.total || "0");
    const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

    // Average call duration
    const avgDurationSeconds = total > 0 ? Math.round(totalDurationSeconds / total) : 0;

    // Format transcripts
    const formattedTranscripts = transcripts.map(t => {
      const durationSeconds = parseInt(t.call_duration_seconds);
      const maskedPhone = t.phone_number.replace(
        /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
        '$1 $2****$4'
      );

      return {
        id: t.id,
        userId: t.user_id,
        userName: t.user_name,
        phone: maskedPhone,
        conversationId: t.conversation_id,
        transcript: t.transcript,
        duration: {
          seconds: durationSeconds,
          formatted: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        },
        startedAt: t.call_started_at,
        endedAt: t.call_ended_at,
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
