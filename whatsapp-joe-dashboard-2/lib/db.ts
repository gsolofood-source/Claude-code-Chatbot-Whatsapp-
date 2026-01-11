import { Pool } from "pg";

// Singleton pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Railway PostgreSQL
      },
      max: 10, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Log connection errors
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  return pool;
}

// Helper function for queries
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Helper for single row queries
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Safely validate and constrain a number for SQL queries
 * Prevents SQL injection by ensuring the value is a valid integer within bounds
 */
export function safeInt(value: unknown, min: number, max: number, defaultValue: number): number {
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, Math.floor(num)));
}

// Types for database tables - matching actual Railway database structure

export interface DBUser {
  id: number;
  phone_number: string;
  name: string | null;
  first_seen: Date;
  last_seen: Date;
  total_messages: number;
  total_conversations: number;
  preferences: unknown;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface DBConversation {
  id: number;
  user_id: number;
  openai_thread_id: string | null;
  elevenlabs_session_id: string | null;
  started_at: Date;
  ended_at: Date | null;
  is_active: boolean;
  message_count: number;
  summary: string | null;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface DBMessage {
  id: number;
  conversation_id: number;
  user_id: number;
  role: "user" | "assistant";
  content: string;
  message_type: "text" | "audio" | "image";
  audio_duration_seconds: number | null;
  audio_transcript: string | null;
  image_analysis: string | null;
  whatsapp_message_id: string | null;
  processing_time_ms: number | null;
  metadata: unknown;
  created_at: Date;
}

export interface DBInfluencer {
  id: number;
  name: string;
  slug: string;
  whatsapp_phone_number: string;
  whatsapp_phone_id: string;
  openai_assistant_id: string;
  elevenlabs_voice_id: string;
  elevenlabs_agent_id: string;
  system_prompt: string;
  persona_description: string | null;
  is_active: boolean;
  subscription_tier: string | null;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface DBCallTranscript {
  id: number;
  user_id: number;
  conversation_id: number;
  elevenlabs_conversation_id: string | null;
  whatsapp_call_id: string | null;
  direction: "inbound" | "outbound";
  duration_seconds: number;
  transcript_json: unknown;
  summary: string | null;
  started_at: Date;
  ended_at: Date | null;
  created_at: Date;
}

export interface DBUserMemory {
  id: number;
  user_id: number;
  fact: string;
  category: string;
  confidence: number;
  source_message_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
