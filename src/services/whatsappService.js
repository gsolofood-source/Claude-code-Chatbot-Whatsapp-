import FormData from 'form-data';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { httpClients } from '../utils/httpClient.js';

class WhatsAppService {
  constructor() {
    this.apiUrl = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;
    this.accessToken = config.whatsapp.accessToken;
    this.httpClient = httpClients.whatsapp; // Client con timeout 8s e retry
  }

  /**
   * Invia un messaggio testuale
   */
  async sendTextMessage(to, text) {
    try {
      const response = await this.httpClient.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Text message sent to ${to}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending text message to ${to}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Invia un messaggio audio
   */
  async sendAudioMessage(to, audioBuffer, mimeType = 'audio/mpeg') {
    try {
      // Step 1: Upload dell'audio al server WhatsApp
      const mediaId = await this.uploadMedia(audioBuffer, mimeType);

      // Step 2: Invia il messaggio audio usando il media ID
      const response = await this.httpClient.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'audio',
          audio: {
            id: mediaId
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Audio message sent to ${to}`);
      return response.data;
    } catch (error) {
      logger.error(`Error sending audio message to ${to}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload di un file media al server WhatsApp
   */
  async uploadMedia(buffer, mimeType) {
    try {
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', buffer, {
        filename: 'audio.mp3',
        contentType: mimeType
      });

      const response = await this.httpClient.post(
        `${this.apiUrl}/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            ...formData.getHeaders()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      logger.info(`Media uploaded, ID: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      logger.error('Error uploading media:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Download di un file media da WhatsApp
   */
  async downloadMedia(mediaId) {
    try {
      // Step 1: Ottieni l'URL del media
      const mediaUrlResponse = await this.httpClient.get(
        `${config.whatsapp.apiBaseUrl}/${config.whatsapp.apiVersion}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const mediaUrl = mediaUrlResponse.data.url;

      // Step 2: Scarica il file
      const mediaResponse = await this.httpClient.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'arraybuffer'
      });

      logger.info(`Media downloaded, ID: ${mediaId}`);
      return Buffer.from(mediaResponse.data);
    } catch (error) {
      logger.error(`Error downloading media ${mediaId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Marca un messaggio come letto
   */
  async markAsRead(messageId) {
    try {
      await this.httpClient.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.debug(`Message ${messageId} marked as read`);
    } catch (error) {
      logger.error(`Error marking message ${messageId} as read:`, error.response?.data || error.message);
    }
  }

  /**
   * Invia un messaggio di reazione
   */
  async sendReaction(to, messageId, emoji) {
    try {
      await this.httpClient.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'reaction',
          reaction: {
            message_id: messageId,
            emoji
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.debug(`Reaction ${emoji} sent to message ${messageId}`);
    } catch (error) {
      logger.error(`Error sending reaction:`, error.response?.data || error.message);
    }
  }

  /**
   * Mostra il typing indicator (sta scrivendo...)
   * Nota: L'API di WhatsApp Business non supporta nativamente il typing indicator.
   * Come workaround, inviamo un messaggio di stato testuale che verrà poi sostituito.
   */
  async showTypingIndicator(to, action = 'typing') {
    // WhatsApp Business API non supporta typing indicator nativamente
    // Possiamo usare mark_as_read come segnale di "ho ricevuto e sto processando"
    // oppure inviare un messaggio temporaneo
    logger.debug(`Typing indicator requested for ${to}, action: ${action}`);
    // Implementazione placeholder - per ora solo log
    // In futuro: considerare invio di messaggio temporaneo che viene poi cancellato
  }

  /**
   * Invia un messaggio di stato temporaneo per dare feedback all'utente
   */
  async sendStatusMessage(to, statusText) {
    try {
      const response = await this.httpClient.post(
        `${this.apiUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: statusText }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.debug(`Status message sent to ${to}: "${statusText}"`);
      return response.data.messages[0].id; // Ritorna il message ID per eventuale cancellazione
    } catch (error) {
      logger.error(`Error sending status message:`, error.response?.data || error.message);
      throw error;
    }
  }
}

export default new WhatsAppService();
