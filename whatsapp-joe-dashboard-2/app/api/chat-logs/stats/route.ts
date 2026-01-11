import { NextResponse } from "next/server";
import { query, queryOne, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = safeInt(searchParams.get("hours"), 1, 168, 24); // Max 7 days

  try {
    // Total messages in time range
    const totalResult = await queryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - ($1 || ' hours')::interval
    `, [hours.toString()]);
    const totalMessages = parseInt(totalResult?.count || "0");

    // Unique users in time range
    const uniqueUsersResult = await queryOne<{ count: string }>(`
      SELECT COUNT(DISTINCT c.user_id) as count
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.created_at >= NOW() - ($1 || ' hours')::interval
    `, [hours.toString()]);
    const uniqueUsers = parseInt(uniqueUsersResult?.count || "0");

    // Messages by user
    const userStats = await query<{
      user_id: string;
      user_name: string;
      phone_number: string;
      message_count: string;
      last_message: string;
    }>(`
      SELECT 
        c.user_id,
        COALESCE(u.name, 'Utente Anonimo') as user_name,
        u.phone_number,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      JOIN users u ON u.id = c.user_id
      WHERE m.created_at >= NOW() - ($1 || ' hours')::interval
      GROUP BY c.user_id, u.name, u.phone_number
      ORDER BY message_count DESC
      LIMIT 20
    `, [hours.toString()]);

    // Format user stats
    const users = userStats.map(u => {
      const maskedPhone = u.phone_number.replace(
        /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
        '$1 $2****$4'
      );

      return {
        userId: u.user_id,
        userName: u.user_name,
        phone: maskedPhone,
        messageCount: parseInt(u.message_count),
        lastMessage: u.last_message,
      };
    });

    // Messages by type
    const typeStats = await query<{ message_type: string; count: string }>(`
      SELECT message_type, COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - ($1 || ' hours')::interval
      GROUP BY message_type
    `, [hours.toString()]);

    const messagesByType = {
      text: parseInt(typeStats.find(t => t.message_type === 'text')?.count || "0"),
      audio: parseInt(typeStats.find(t => t.message_type === 'audio')?.count || "0"),
      image: parseInt(typeStats.find(t => t.message_type === 'image')?.count || "0"),
    };

    // Messages by sender
    const senderStats = await query<{ sender: string; count: string }>(`
      SELECT sender, COUNT(*) as count
      FROM messages
      WHERE created_at >= NOW() - ($1 || ' hours')::interval
      GROUP BY sender
    `, [hours.toString()]);

    const messagesBySender = {
      user: parseInt(senderStats.find(s => s.sender === 'user')?.count || "0"),
      bot: parseInt(senderStats.find(s => s.sender === 'bot')?.count || "0"),
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalMessages,
        uniqueUsers,
        timeRange: hours,
        messagesByType,
        messagesBySender,
        users,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching chat logs stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chat logs stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
