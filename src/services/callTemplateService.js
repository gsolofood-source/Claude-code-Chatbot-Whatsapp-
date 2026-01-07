import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import { httpClients } from '../utils/httpClient.js';

/**
 * Call Template Service
 * Invia messaggi template con bottone di chiamata
 * L'utente riceve un messaggio con bottone "Chiama" che apre la chiamata WhatsApp
 */
class CallTemplateService {
  constructor() {
    this.apiUrl = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;
    this.accessToken = config.whatsapp.accessToken;
    this.httpClient = httpClients.whatsapp;

    logger.info('Call template service initialized');
  }

  /**
   * Invia messaggio template con bottone di chiamata
   * @param {string} to - Numero destinatario (es: "+393331234567")
   * @param {string} templateName - Nome del template approvato
   * @param {string} languageCode - Codice lingua (default: "it")
   * @param {object} parameters - Parametri del template (opzionale)
   * @returns {Promise<object>}
   */
  async sendCallRequestTemplate(to, templateName, languageCode = 'it', parameters = {}) {
    try {
      logger.info(`Sending call request template to ${this.maskPhone(to)}`, {
        template: templateName,
        language: languageCode
      });

      // Costruisci il payload del template
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      // Aggiungi parametri se presenti
      if (parameters.body && parameters.body.length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: parameters.body.map(param => ({
              type: 'text',
              text: param
            }))
          }
        ];
      }

      const response = await this.httpClient.post(
        `${this.apiUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Call request template sent successfully', {
        message_id: response.data.messages[0].id,
        to: this.maskPhone(to)
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        to: to,
        template: templateName
      };

    } catch (error) {
      logger.error('Failed to send call request template', {
        to: this.maskPhone(to),
        template: templateName,
        error: error.message,
        response: error.response?.data
      });

      throw new Error(`Template send failed: ${error.message}`);
    }
  }

  /**
   * Invia template di chiamata semplice (senza parametri)
   * Esempio per template base tipo "call_request"
   * @param {string} to - Numero destinatario
   * @param {string} templateName - Nome template (default: "call_request")
   * @returns {Promise<object>}
   */
  async sendSimpleCallRequest(to, templateName = 'call_request') {
    return this.sendCallRequestTemplate(to, templateName, 'it');
  }

  /**
   * Maschera numero di telefono nei log (privacy)
   */
  maskPhone(phone) {
    if (!phone || phone.length < 6) return '***';
    return phone.substring(0, 3) + '******' + phone.substring(phone.length - 3);
  }
}

export default new CallTemplateService();
