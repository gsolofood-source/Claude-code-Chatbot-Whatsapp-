import NodeCache from 'node-cache';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class ConversationManager {
  constructor() {
    // Cache per le conversazioni attive
    // TTL: tempo in secondi dopo cui la conversazione viene eliminata
    this.cache = new NodeCache({
      stdTTL: config.conversation.timeoutMinutes * 60,
      checkperiod: 120, // Controlla ogni 2 minuti
      useClones: false
    });

    this.cache.on('expired', (key, value) => {
      logger.info(`Conversation expired for user ${key}`);
    });
  }

  /**
   * Ottieni la conversazione per un utente
   */
  getConversation(userId) {
    const conversation = this.cache.get(userId);

    if (!conversation) {
      logger.info(`Starting new conversation for user ${userId}`);
      return this.createConversation(userId);
    }

    logger.debug(`Retrieved existing conversation for user ${userId}`);
    return conversation;
  }

  /**
   * Crea una nuova conversazione
   */
  createConversation(userId) {
    const conversation = {
      userId,
      messages: [],
      sessionId: null, // Session ID di ElevenLabs
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.cache.set(userId, conversation);
    return conversation;
  }

  /**
   * Aggiungi un messaggio alla conversazione
   */
  addMessage(userId, message) {
    const conversation = this.getConversation(userId);

    conversation.messages.push({
      ...message,
      timestamp: new Date()
    });

    // Mantieni solo gli ultimi N messaggi
    if (conversation.messages.length > config.conversation.maxMessagesInContext) {
      conversation.messages = conversation.messages.slice(-config.conversation.maxMessagesInContext);
    }

    conversation.lastActivity = new Date();
    this.cache.set(userId, conversation);

    return conversation;
  }

  /**
   * Aggiorna la session ID di ElevenLabs
   */
  updateSessionId(userId, sessionId) {
    const conversation = this.getConversation(userId);
    conversation.sessionId = sessionId;
    this.cache.set(userId, conversation);
    logger.debug(`Updated ElevenLabs session ID for user ${userId}: ${sessionId}`);
  }

  /**
   * Resetta una conversazione
   */
  resetConversation(userId) {
    this.cache.del(userId);
    logger.info(`Reset conversation for user ${userId}`);
  }

  /**
   * Ottieni statistiche sulle conversazioni attive
   */
  getStats() {
    const keys = this.cache.keys();
    return {
      activeConversations: keys.length,
      users: keys
    };
  }

  /**
   * Ottieni tutte le conversazioni attive con dettagli
   */
  getAllConversations() {
    const keys = this.cache.keys();
    return keys.map(userId => {
      const conv = this.cache.get(userId);
      const lastMessage = conv.messages[conv.messages.length - 1];

      return {
        userId: userId,
        messageCount: conv.messages.length,
        lastMessage: lastMessage ? lastMessage.content : 'No messages',
        lastMessageType: lastMessage ? lastMessage.role : 'unknown',
        lastActivity: conv.lastActivity,
        createdAt: conv.createdAt,
        sessionId: conv.sessionId
      };
    }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }

  /**
   * Ottieni i messaggi di una conversazione specifica
   */
  getConversationMessages(userId) {
    const conversation = this.cache.get(userId);
    if (!conversation) {
      return null;
    }

    return {
      userId: userId,
      messages: conversation.messages,
      messageCount: conversation.messages.length,
      createdAt: conversation.createdAt,
      lastActivity: conversation.lastActivity,
      sessionId: conversation.sessionId
    };
  }
}

export default new ConversationManager();
