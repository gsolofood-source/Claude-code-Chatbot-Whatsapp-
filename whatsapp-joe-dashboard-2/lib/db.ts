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

// Types for database tables
export interface DBUser {
  id: number;
  phone_number: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
  last_interaction: Date;
  openai_thread_id: string | null;
}

export interface DBConversation {
  id: number;
  user_id: number;
  influencer_id: number;
  started_at: Date;
  ended_at: Date | null;
  status: string;
}

export interface DBMessage {
  id: number;
  conversation_id: number;
  sender: "user" | "bot";
  message_type: "text" | "audio" | "image";
  content: string;
  audio_url: string | null;
  created_at: Date;
  response_time_ms: number | null;
}

export interface DBInfluencer {
  id: number;
  name: string;
  phone_number_id: string;
  voice_id: string;
  agent_id: string;
  system_prompt: string;
  created_at: Date;
}

export interface DBCallTranscript {
  id: number;
  user_id: number;
  conversation_id: string;
  transcript: string;
  call_duration_seconds: number;
  call_started_at: Date;
  call_ended_at: Date;
  created_at: Date;
}

export interface DBUserMemory {
  id: number;
  user_id: number;
  memory_type: string;
  content: string;
  extracted_at: Date;
}
