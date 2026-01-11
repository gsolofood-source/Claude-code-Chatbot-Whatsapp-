import { NextResponse } from "next/server";
import { query, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = safeInt(searchParams.get("limit"), 1, 100, 50);
    const offset = safeInt(searchParams.get("offset"), 0, 10000, 0);
    const search = searchParams.get("search") || "";

    // Build search filter and params
    const params: unknown[] = [];
    let searchFilter = "";
    let paramIndex = 1;
    
    if (search) {
      searchFilter = `AND (u.name ILIKE $${paramIndex} OR u.phone_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add limit and offset as parameters
    params.push(limit);
    params.push(offset);

    // Get conversations with user info and last message
    const conversations = await query<{
      conversation_id: string;
      user_id: string;
      user_name: string;
      phone_number: string;
      started_at: string;
      last_activity: string;
      is_active: boolean;
      message_count: string;
      last_message: string;
      last_message_type: string;
      last_role: string;
    }>(`
      SELECT 
        c.id as conversation_id,
        u.id as user_id,
        COALESCE(u.name, 'Utente Anonimo') as user_name,
        u.phone_number,
        c.started_at,
        COALESCE(
          (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id),
          c.started_at
        ) as last_activity,
        c.is_active,
        c.message_count,
        (
          SELECT content 
          FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT message_type 
          FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_type,
        (
          SELECT role 
          FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_role
      FROM conversations c
      JOIN users u ON u.id = c.user_id
      WHERE 1=1 ${searchFilter}
      ORDER BY last_activity DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    // Get total count (only need search param if present)
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM conversations c
      JOIN users u ON u.id = c.user_id
      WHERE 1=1 ${searchFilter}
    `, countParams.length > 0 ? countParams : undefined);

    const total = parseInt(countResult[0]?.count || "0");

    // Format conversations
    const formattedConversations = conversations.map(conv => {
      // Mask phone number
      const maskedPhone = conv.phone_number.replace(
        /(\+\d{2})(\d{3})(\d+)(\d{3})/, 
        '$1 $2****$4'
      );

      // Truncate last message
      const lastMessage = conv.last_message
        ? conv.last_message.length > 50
          ? conv.last_message.substring(0, 50) + '...'
          : conv.last_message
        : 'Nessun messaggio';

      return {
        id: conv.conversation_id,
        userId: conv.user_id,
        userName: conv.user_name,
        phone: maskedPhone,
        lastMessage,
        timestamp: conv.last_activity,
        status: conv.is_active ? 'active' : 'ended',
        unread: false, // TODO: implement unread tracking
        messageCount: parseInt(conv.message_count),
        type: conv.last_message_type || 'text',
        lastSender: conv.last_role === 'assistant' ? 'bot' : 'user',
      };
    });

    return NextResponse.json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch conversations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
