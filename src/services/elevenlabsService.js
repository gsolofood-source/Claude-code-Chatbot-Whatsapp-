import axios from 'axios';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import openaiService from './openaiService.js';

class ElevenLabsService {
  constructor() {
    this.apiKey = config.elevenlabs.apiKey;
    this.agentId = config.elevenlabs.agentId;
    this.baseUrl = config.elevenlabs.apiBaseUrl;
    this.voiceId = null; // Sarà caricato al primo utilizzo
  }

  /**
   * Ottieni risposta testuale e audio in stile Joe Bastianich usando OpenAI
   * @param {string} userId - ID utente
   * @param {string} message - Messaggio utente
   * @param {string} sessionId - Session ID opzionale
   * @param {Array} conversationHistory - Cronologia messaggi opzionale
   */
  async getAudioResponse(userId, message, sessionId = null, conversationHistory = []) {
    try {
      // Genera risposta testuale usando OpenAI Assistant (con cronologia)
      const responseText = await openaiService.getResponse(userId, message, conversationHistory);

      // Genera audio con la voce di Joe
      let audioBuffer = null;
      try {
        // Carica la voce dell'agent se non l'abbiamo già
        if (!this.voiceId) {
          await this.loadAgentVoice();
        }

        if (this.voiceId) {
          audioBuffer = await this.textToSpeech(responseText, this.voiceId);
          logger.info(`Audio generated with voice: ${this.voiceId}`);
        } else {
          logger.warn('No voice ID available, sending text only');
        }
      } catch (audioError) {
        logger.warn('Could not generate audio, will send text only:', audioError.message);
      }

      logger.info(`Response generated: "${responseText.substring(0, 50)}..."`);

      return {
        text: responseText,
        sessionId: sessionId || `session_${Date.now()}`,
        audioBuffer
      };
    } catch (error) {
      logger.error('Error getting response:', error.message);
      throw error;
    }
  }

  /**
   * Ottieni solo risposta testuale (senza audio)
   */
  async getTextResponse(userId, message, sessionId = null) {
    try {
      // Genera risposta testuale usando OpenAI Assistant
      const responseText = await openaiService.getResponse(userId, message);

      logger.info(`Text response generated: "${responseText.substring(0, 50)}..."`);

      return {
        text: responseText,
        sessionId: sessionId || `session_${Date.now()}`,
        audioBuffer: null
      };
    } catch (error) {
      logger.error('Error getting text response:', error.message);
      throw error;
    }
  }


  /**
   * Carica la voce associata all'agent
   */
  async loadAgentVoice() {
    try {
      logger.info(`Loading voice for agent: ${this.agentId}`);

      const response = await axios.get(
        `https://api.elevenlabs.io/v1/convai/agents/${this.agentId}`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );

      // Estrai la voce dall'agent config
      this.voiceId = response.data.conversation_config?.agent?.prompt?.voice ||
                     response.data.conversation_config?.tts?.voice_id;

      if (this.voiceId) {
        logger.info(`Voice loaded successfully: ${this.voiceId}`);
      } else {
        logger.warn('No voice ID found in agent config');
        logger.debug('Agent config:', JSON.stringify(response.data, null, 2));
      }

      return this.voiceId;
    } catch (error) {
      logger.error('Error loading agent voice:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Text-to-Speech con una voce specifica
   */
  async textToSpeech(text, voiceId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      logger.info(`TTS generated (${response.data.byteLength} bytes)`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Error generating TTS:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ElevenLabsService();
