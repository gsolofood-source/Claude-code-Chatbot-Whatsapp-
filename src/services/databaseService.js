import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Inizializza la connessione al database
   */
  async initialize() {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        logger.warn('DATABASE_URL not found - database features disabled');
        return false;
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10, // massimo 10 connessioni nel pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test della connessione
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      logger.info('✅ Database connected successfully');
      return true;
    } catch (error) {
      logger.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Esegue una query
   */
  async query(text, params) {
    if (!this.isConnected) {
      logger.warn('Database not connected, skipping query');
      return null;
    }

    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 50)}...`);
      return result;
    } catch (error) {
      logger.error('Database query error:', error.message);
      throw error;
    }
  }

  // ==========================================
  // USERS
  // ==========================================

  /**
   * Trova o crea un utente per numero di telefono
   */
  async findOrCreateUser(phoneNumber) {
    if (!this.isConnected) return null;

    try {
      // Prima prova a trovare l'utente
      const findResult = await this.query(
        'SELECT * FROM users WHERE phone_number = $1',
        [phoneNumber]
      );

      if (findResult.rows.length > 0) {
        // Aggiorna last_seen
        await this.query(
          'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE phone_number = $1',
          [phoneNumber]
        );
        logger.debug(`User found: ${phoneNumber}`);
        return findResult.rows[0];
      }

      // Crea nuovo utente
      const createResult = await this.query(
        `INSERT INTO users (phone_number) VALUES ($1) RETURNING *`,
        [phoneNumber]
      );

      logger.info(`New user created: ${phoneNumber}`);
      return createResult.rows[0];
    } catch (error) {
      logger.error('Error finding/creating user:', error.message);
      return null;
    }
  }

  /**
   * Aggiorna il nome dell'utente
   */
  async updateUserName(userId, name) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [name, userId]
      );
      logger.info(`User name updated: ${name}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user name:', error.message);
      return null;
    }
  }

  /**
   * Ottieni utente per ID
   */
  async getUserById(userId) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query('SELECT * FROM users WHERE id = $1', [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user:', error.message);
      return null;
    }
  }

  /**
   * Ottieni utente per numero di telefono
   */
  async getUserByPhone(phoneNumber) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user by phone:', error.message);
      return null;
    }
  }

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  /**
   * Trova o crea una conversazione attiva per l'utente
   */
  async findOrCreateConversation(userId, openaiThreadId = null) {
    if (!this.isConnected) return null;

    try {
      // Cerca conversazione attiva
      const findResult = await this.query(
        'SELECT * FROM conversations WHERE user_id = $1 AND is_active = true ORDER BY started_at DESC LIMIT 1',
        [userId]
      );

      if (findResult.rows.length > 0) {
        logger.debug(`Active conversation found for user ${userId}`);
        return findResult.rows[0];
      }

      // Crea nuova conversazione
      const createResult = await this.query(
        `INSERT INTO conversations (user_id, openai_thread_id) VALUES ($1, $2) RETURNING *`,
        [userId, openaiThreadId]
      );

      // Aggiorna contatore utente
      await this.query(
        'UPDATE users SET total_conversations = total_conversations + 1 WHERE id = $1',
        [userId]
      );

      logger.info(`New conversation created for user ${userId}`);
      return createResult.rows[0];
    } catch (error) {
      logger.error('Error finding/creating conversation:', error.message);
      return null;
    }
  }

  /**
   * Aggiorna il thread ID di OpenAI per una conversazione
   */
  async updateConversationThreadId(conversationId, threadId) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        'UPDATE conversations SET openai_thread_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [threadId, conversationId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating thread ID:', error.message);
      return null;
    }
  }

  /**
   * Chiudi una conversazione
   */
  async closeConversation(conversationId) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        'UPDATE conversations SET is_active = false, ended_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [conversationId]
      );
      logger.info(`Conversation ${conversationId} closed`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error closing conversation:', error.message);
      return null;
    }
  }

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Salva un messaggio
   */
  async saveMessage(conversationId, userId, role, content, messageType = 'text', metadata = {}) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        `INSERT INTO messages 
         (conversation_id, user_id, role, content, message_type, 
          audio_duration_seconds, audio_transcript, image_analysis, 
          whatsapp_message_id, processing_time_ms, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          conversationId,
          userId,
          role,
          content,
          messageType,
          metadata.audioDuration || null,
          metadata.audioTranscript || null,
          metadata.imageAnalysis || null,
          metadata.whatsappMessageId || null,
          metadata.processingTimeMs || null,
          JSON.stringify(metadata.extra || {})
        ]
      );

      // Aggiorna contatori
      await this.query(
        'UPDATE conversations SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );
      await this.query(
        'UPDATE users SET total_messages = total_messages + 1, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      logger.debug(`Message saved: ${role} - ${content.substring(0, 30)}...`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving message:', error.message);
      return null;
    }
  }

  /**
   * Ottieni gli ultimi N messaggi di una conversazione
   */
  async getConversationMessages(conversationId, limit = 20) {
    if (!this.isConnected) return [];

    try {
      const result = await this.query(
        `SELECT * FROM messages 
         WHERE conversation_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [conversationId, limit]
      );
      return result.rows.reverse(); // Ordine cronologico
    } catch (error) {
      logger.error('Error getting messages:', error.message);
      return [];
    }
  }

  /**
   * Ottieni la cronologia messaggi per il context di OpenAI
   */
  async getMessagesForContext(conversationId, limit = 10) {
    if (!this.isConnected) return [];

    try {
      const messages = await this.getConversationMessages(conversationId, limit);
      return messages.map(m => ({
        role: m.role,
        content: m.content
      }));
    } catch (error) {
      logger.error('Error getting messages for context:', error.message);
      return [];
    }
  }

  // ==========================================
  // USER MEMORIES
  // ==========================================

  /**
   * Salva un fatto/memoria sull'utente
   */
  async saveMemory(userId, fact, category = 'general', sourceMessageId = null, confidence = 1.0) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        `INSERT INTO user_memories (user_id, fact, category, source_message_id, confidence)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, fact, category, sourceMessageId, confidence]
      );
      logger.info(`Memory saved for user ${userId}: ${fact.substring(0, 50)}...`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving memory:', error.message);
      return null;
    }
  }

  /**
   * Ottieni tutte le memorie di un utente
   */
  async getUserMemories(userId, category = null) {
    if (!this.isConnected) return [];

    try {
      let queryText = 'SELECT * FROM user_memories WHERE user_id = $1 AND is_active = true';
      const params = [userId];

      if (category) {
        queryText += ' AND category = $2';
        params.push(category);
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await this.query(queryText, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting memories:', error.message);
      return [];
    }
  }

  /**
   * Ottieni memorie formattate per il prompt
   */
  async getMemoriesForPrompt(userId) {
    if (!this.isConnected) return '';

    try {
      const memories = await this.getUserMemories(userId);
      
      if (memories.length === 0) return '';

      const memoryText = memories.map(m => `- ${m.fact}`).join('\n');
      return `\n\nCose che sai di questo utente:\n${memoryText}`;
    } catch (error) {
      logger.error('Error getting memories for prompt:', error.message);
      return '';
    }
  }

  // ==========================================
  // INFLUENCERS
  // ==========================================

  /**
   * Ottieni influencer per slug
   */
  async getInfluencerBySlug(slug) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        'SELECT * FROM influencers WHERE slug = $1 AND is_active = true',
        [slug]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting influencer:', error.message);
      return null;
    }
  }

  /**
   * Ottieni influencer per phone ID di WhatsApp
   */
  async getInfluencerByPhoneId(phoneId) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        'SELECT * FROM influencers WHERE whatsapp_phone_id = $1 AND is_active = true',
        [phoneId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting influencer by phone:', error.message);
      return null;
    }
  }

  // ==========================================
  // CALL TRANSCRIPTS
  // ==========================================

  /**
   * Salva la trascrizione di una chiamata
   */
  async saveCallTranscript(userId, transcriptData) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        `INSERT INTO call_transcripts 
         (user_id, conversation_id, elevenlabs_conversation_id, whatsapp_call_id, 
          direction, duration_seconds, transcript_json, summary, started_at, ended_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          transcriptData.conversationId || null,
          transcriptData.elevenLabsConversationId || null,
          transcriptData.whatsappCallId || null,
          transcriptData.direction || 'inbound',
          transcriptData.durationSeconds || null,
          JSON.stringify(transcriptData.transcript || {}),
          transcriptData.summary || null,
          transcriptData.startedAt || null,
          transcriptData.endedAt || new Date()
        ]
      );

      logger.info(`Call transcript saved for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving call transcript:', error.message);
      return null;
    }
  }

  /**
   * Ottieni l'ultima trascrizione di un utente
   */
  async getLastCallTranscript(userId) {
    if (!this.isConnected) return null;

    try {
      const result = await this.query(
        `SELECT * FROM call_transcripts 
         WHERE user_id = $1 
         ORDER BY ended_at DESC 
         LIMIT 1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting last call transcript:', error.message);
      return null;
    }
  }

  /**
   * Ottieni tutte le trascrizioni di un utente
   */
  async getUserCallTranscripts(userId, limit = 10) {
    if (!this.isConnected) return [];

    try {
      const result = await this.query(
        `SELECT * FROM call_transcripts 
         WHERE user_id = $1 
         ORDER BY ended_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting user call transcripts:', error.message);
      return [];
    }
  }

  /**
   * Formatta la trascrizione per inviarla all'utente
   */
  formatTranscriptForUser(transcriptRecord) {
    if (!transcriptRecord || !transcriptRecord.transcript_json) {
      return null;
    }

    const transcript = transcriptRecord.transcript_json;
    const messages = transcript.messages || [];
    
    if (messages.length === 0) {
      return "Non ho trovato messaggi nella trascrizione della chiamata.";
    }

    // Formatta data
    const date = new Date(transcriptRecord.ended_at);
    const dateStr = date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Formatta durata
    const duration = transcriptRecord.duration_seconds;
    const durationStr = duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : 'N/A';

    // Costruisci la trascrizione formattata
    let formatted = `📞 *Trascrizione chiamata*\n`;
    formatted += `📅 ${dateStr}\n`;
    formatted += `⏱️ Durata: ${durationStr}\n\n`;
    formatted += `---\n\n`;

    for (const msg of messages) {
      const role = msg.role === 'user' ? '👤 Tu' : '🎙️ Joe';
      formatted += `${role}: ${msg.message || msg.content || msg.text}\n\n`;
    }

    return formatted;
  }

  // ==========================================
  // STATS & UTILITIES
  // ==========================================

  /**
   * Ottieni statistiche generali
   */
  async getStats() {
    if (!this.isConnected) return null;

    try {
      const users = await this.query('SELECT COUNT(*) as count FROM users');
      const conversations = await this.query('SELECT COUNT(*) as count FROM conversations');
      const messages = await this.query('SELECT COUNT(*) as count FROM messages');
      const activeConversations = await this.query(
        'SELECT COUNT(*) as count FROM conversations WHERE is_active = true'
      );

      return {
        totalUsers: parseInt(users.rows[0].count),
        totalConversations: parseInt(conversations.rows[0].count),
        totalMessages: parseInt(messages.rows[0].count),
        activeConversations: parseInt(activeConversations.rows[0].count)
      };
    } catch (error) {
      logger.error('Error getting stats:', error.message);
      return null;
    }
  }

  /**
   * Chiudi il pool di connessioni
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database pool closed');
    }
  }
}

// Esporta singleton
export default new DatabaseService();
