import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { httpClients } from '../utils/httpClient.js';

/**
 * ElevenLabs Conversational AI Service
 * Gestisce chiamate vocali conversazionali complete con un solo servizio
 * Include: STT + AI + TTS tutto integrato
 */
class ElevenLabsConversationalService {
  constructor() {
    this.apiKey = config.elevenlabs.apiKey;
    this.agentId = config.elevenlabs.agentId;
    this.baseUrl = config.elevenlabs.apiBaseUrl;
    this.httpClient = httpClients.elevenlabs;

    logger.info('ElevenLabs Conversational AI service initialized', {
      agent_id: this.agentId
    });
  }

  /**
   * Inizia una conversazione vocale con l'agente ElevenLabs
   * @param {string} phoneNumber - Numero telefono utente
   * @returns {Promise<object>} - Dati conversazione
   */
  async startConversation(phoneNumber) {
    try {
      logger.info(`Starting ElevenLabs conversation for ${this.maskPhone(phoneNumber)}`);

      const response = await this.httpClient.post(
        `${this.baseUrl}/convai/conversations`,
        {
          agent_id: this.agentId,
          phone_number: phoneNumber
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('ElevenLabs conversation started', {
        conversation_id: response.data.conversation_id,
        phone: this.maskPhone(phoneNumber)
      });

      return {
        success: true,
        conversationId: response.data.conversation_id,
        status: response.data.status
      };

    } catch (error) {
      logger.error('Failed to start ElevenLabs conversation', {
        phone: this.maskPhone(phoneNumber),
        error: error.message,
        response: error.response?.data
      });

      throw new Error(`Conversational AI failed: ${error.message}`);
    }
  }

  /**
   * Ottieni stato di una conversazione
   * @param {string} conversationId - ID conversazione ElevenLabs
   * @returns {Promise<object>}
   */
  async getConversationStatus(conversationId) {
    try {
      const response = await this.httpClient.get(
        `${this.baseUrl}/convai/conversations/${conversationId}`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );

      return {
        conversationId: response.data.conversation_id,
        status: response.data.status,
        duration: response.data.duration,
        startTime: response.data.start_time,
        endTime: response.data.end_time,
        metadata: response.data.metadata
      };

    } catch (error) {
      logger.error(`Failed to get conversation status for ${conversationId}`, {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Termina una conversazione attiva
   * @param {string} conversationId - ID conversazione
   * @returns {Promise<object>}
   */
  async endConversation(conversationId) {
    try {
      logger.info(`Ending ElevenLabs conversation: ${conversationId}`);

      const response = await this.httpClient.post(
        `${this.baseUrl}/convai/conversations/${conversationId}/end`,
        {},
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Conversation ended successfully: ${conversationId}`);

      return {
        success: true,
        conversationId: conversationId,
        status: 'ended',
        duration: response.data.duration
      };

    } catch (error) {
      logger.error(`Failed to end conversation ${conversationId}`, {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Invia un messaggio testuale alla conversazione (opzionale)
   * Utile per debug o per iniziare la conversazione con un contesto
   * @param {string} conversationId - ID conversazione
   * @param {string} message - Messaggio da inviare
   * @returns {Promise<object>}
   */
  async sendTextMessage(conversationId, message) {
    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}/convai/conversations/${conversationId}/messages`,
        {
          text: message
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.debug('Text message sent to conversation', {
        conversation_id: conversationId,
        message_length: message.length
      });

      return {
        success: true,
        messageId: response.data.message_id
      };

    } catch (error) {
      logger.error('Failed to send text message', {
        conversation_id: conversationId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Ottieni trascrizione completa della conversazione
   * @param {string} conversationId - ID conversazione
   * @returns {Promise<object>}
   */
  async getConversationTranscript(conversationId) {
    try {
      const response = await this.httpClient.get(
        `${this.baseUrl}/convai/conversations/${conversationId}/transcript`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );

      logger.info('Conversation transcript retrieved', {
        conversation_id: conversationId,
        messages_count: response.data.messages?.length || 0
      });

      return {
        conversationId: conversationId,
        messages: response.data.messages,
        duration: response.data.duration,
        startTime: response.data.start_time,
        endTime: response.data.end_time
      };

    } catch (error) {
      logger.error(`Failed to get transcript for ${conversationId}`, {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Maschera numero di telefono nei log (privacy)
   */
  maskPhone(phone) {
    if (!phone || phone.length < 6) return '***';
    return phone.substring(0, 3) + '******' + phone.substring(phone.length - 3);
  }
}

export default new ElevenLabsConversationalService();
