import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { httpClients } from '../utils/httpClient.js';

/**
 * WhatsApp Voice Call Service
 * Gestisce chiamate vocali in entrata e uscita tramite WhatsApp Business API
 */
class VoiceCallService {
  constructor() {
    this.apiUrl = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;
    this.accessToken = config.whatsapp.accessToken;
    this.httpClient = httpClients.whatsapp;

    logger.info('Voice call service initialized');
  }

  /**
   * Inizia una chiamata vocale in uscita
   * @param {string} to - Numero di telefono del destinatario (formato: +39...)
   * @param {string} sessionId - ID sessione ElevenLabs per la conversazione AI
   * @returns {Promise<object>} - Risposta API con call_id
   */
  async initiateCall(to, sessionId) {
    try {
      logger.info(`Initiating voice call to ${this.maskPhone(to)}`, {
        session_id: sessionId
      });

      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'voice'
      };

      // Aggiungi session ID se fornito (per AI conversazionale)
      if (sessionId) {
        payload.session = {
          id: sessionId,
          provider: 'elevenlabs'
        };
      }

      const response = await this.httpClient.post(
        `${this.apiUrl}/calls`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Voice call initiated successfully`, {
        call_id: response.data.id,
        to: this.maskPhone(to)
      });

      return {
        success: true,
        callId: response.data.id,
        status: response.data.status
      };

    } catch (error) {
      logger.error(`Failed to initiate call to ${this.maskPhone(to)}`, {
        error: error.message,
        response: error.response?.data
      });

      throw new Error(`Voice call failed: ${error.message}`);
    }
  }

  /**
   * Recupera informazioni su una chiamata
   * @param {string} callId - ID della chiamata
   * @returns {Promise<object>} - Dettagli chiamata
   */
  async getCallStatus(callId) {
    try {
      const response = await this.httpClient.get(
        `${this.apiUrl}/calls/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return {
        callId: response.data.id,
        status: response.data.status,
        duration: response.data.duration,
        startTime: response.data.start_time,
        endTime: response.data.end_time
      };

    } catch (error) {
      logger.error(`Failed to get call status for ${callId}`, {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Termina una chiamata in corso
   * @param {string} callId - ID della chiamata
   * @returns {Promise<object>}
   */
  async endCall(callId) {
    try {
      logger.info(`Ending call: ${callId}`);

      const response = await this.httpClient.post(
        `${this.apiUrl}/calls/${callId}/end`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Call ended successfully: ${callId}`);

      return {
        success: true,
        callId: callId,
        status: 'ended'
      };

    } catch (error) {
      logger.error(`Failed to end call ${callId}`, {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Gestisce webhook di eventi chiamata
   * @param {object} callEvent - Evento chiamata da webhook
   */
  async handleCallEvent(callEvent) {
    const { id, status, from, to, duration } = callEvent;

    logger.info(`Call event received`, {
      call_id: id,
      status: status,
      from: this.maskPhone(from),
      to: this.maskPhone(to),
      duration: duration
    });

    switch (status) {
      case 'initiated':
        logger.info(`Call initiated: ${id}`);
        break;

      case 'ringing':
        logger.info(`Call ringing: ${id}`);
        break;

      case 'in_progress':
        logger.info(`Call in progress: ${id}`);
        break;

      case 'completed':
        logger.info(`Call completed: ${id}`, {
          duration: duration
        });
        break;

      case 'failed':
        logger.error(`Call failed: ${id}`);
        break;

      case 'no_answer':
        logger.warn(`Call not answered: ${id}`);
        break;

      case 'busy':
        logger.warn(`Call busy: ${id}`);
        break;

      default:
        logger.warn(`Unknown call status: ${status}`);
    }

    return {
      success: true,
      callId: id,
      status: status
    };
  }

  /**
   * Maschera numero di telefono nei log (privacy)
   * @param {string} phone - Numero di telefono
   * @returns {string} - Numero mascherato
   */
  maskPhone(phone) {
    if (!phone || phone.length < 6) return '***';
    return phone.substring(0, 3) + '******' + phone.substring(phone.length - 3);
  }
}

export default new VoiceCallService();
