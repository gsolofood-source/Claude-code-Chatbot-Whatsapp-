import voiceCallService from '../services/voiceCallService.js';
import elevenLabsConversationalService from '../services/elevenLabsConversationalService.js';
import databaseService from '../services/databaseService.js';
import logger from '../utils/logger.js';

/**
 * Voice Call Handler - Simplified
 * Usa ElevenLabs Conversational AI per gestire chiamate complete
 * ElevenLabs gestisce: STT + AI Conversation + TTS tutto insieme
 */
class VoiceCallHandler {
  constructor() {
    this.activeCalls = new Map(); // Traccia chiamate attive
    this.callHistory = []; // Storico chiamate con trascrizioni (max 100)
    this.maxHistorySize = 100;
    logger.info('Voice call handler initialized (ElevenLabs Conversational AI)');
  }

  /**
   * Inizia una chiamata verso un utente
   * @param {string} userId - Numero telefono utente
   * @param {string} reason - Motivo della chiamata (opzionale)
   * @returns {Promise<object>}
   */
  async startOutboundCall(userId, reason = 'general') {
    try {
      logger.info(`Starting outbound call to ${this.maskPhone(userId)}`, {
        reason: reason
      });

      // 1. Inizia conversazione ElevenLabs PRIMA (per ottenere session ID)
      const conversation = await elevenLabsConversationalService.startConversation(userId);

      if (!conversation.success) {
        throw new Error('Failed to start ElevenLabs conversation');
      }

      // 2. Inizia chiamata WhatsApp con session ID ElevenLabs
      const callResult = await voiceCallService.initiateCall(userId, conversation.conversationId);

      if (!callResult.success) {
        throw new Error('Failed to initiate WhatsApp call');
      }

      // 3. Registra chiamata attiva
      this.activeCalls.set(callResult.callId, {
        userId: userId,
        startTime: Date.now(),
        reason: reason,
        status: 'initiated',
        whatsappCallId: callResult.callId,
        elevenLabsConversationId: conversation.conversationId
      });

      logger.info(`Outbound call started successfully`, {
        whatsapp_call_id: callResult.callId,
        elevenlabs_conversation_id: conversation.conversationId,
        user: this.maskPhone(userId)
      });

      return {
        success: true,
        callId: callResult.callId,
        conversationId: conversation.conversationId,
        message: 'Call initiated. ElevenLabs will handle the conversation automatically.'
      };

    } catch (error) {
      logger.error('Error starting outbound call', {
        user: this.maskPhone(userId),
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Gestisce chiamata in entrata dall'utente
   * @param {string} callId - ID chiamata WhatsApp
   * @param {string} userId - Numero telefono utente
   * @returns {Promise<object>}
   */
  async handleInboundCall(callId, userId) {
    try {
      logger.info(`Handling inbound call`, {
        call_id: callId,
        user: this.maskPhone(userId)
      });

      // 1. Inizia conversazione ElevenLabs
      const conversation = await elevenLabsConversationalService.startConversation(userId);

      // 2. Registra chiamata
      this.activeCalls.set(callId, {
        userId: userId,
        startTime: Date.now(),
        direction: 'inbound',
        status: 'ringing',
        whatsappCallId: callId,
        elevenLabsConversationId: conversation.conversationId
      });

      logger.info(`Inbound call prepared with ElevenLabs`, {
        whatsapp_call_id: callId,
        elevenlabs_conversation_id: conversation.conversationId
      });

      return {
        success: true,
        callId: callId,
        conversationId: conversation.conversationId,
        message: 'ElevenLabs Conversational AI is handling the call'
      };

    } catch (error) {
      logger.error('Error handling inbound call', {
        call_id: callId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Termina chiamata attiva
   * @param {string} callId - ID chiamata WhatsApp
   * @returns {Promise<object>}
   */
  async endCall(callId) {
    try {
      const call = this.activeCalls.get(callId);

      if (!call) {
        logger.warn(`Attempted to end non-existent call: ${callId}`);
        return { success: false, message: 'Call not found' };
      }

      const duration = Math.floor((Date.now() - call.startTime) / 1000);

      logger.info(`Ending call`, {
        whatsapp_call_id: callId,
        elevenlabs_conversation_id: call.elevenLabsConversationId,
        duration_seconds: duration
      });

      // 1. Termina conversazione ElevenLabs
      if (call.elevenLabsConversationId) {
        await elevenLabsConversationalService.endConversation(call.elevenLabsConversationId);
      }

      // 2. Termina chiamata WhatsApp
      await voiceCallService.endCall(callId);

      // 3. Ottieni trascrizione finale (opzionale, per analytics)
      let transcript = null;
      if (call.elevenLabsConversationId) {
        try {
          transcript = await elevenLabsConversationalService.getConversationTranscript(
            call.elevenLabsConversationId
          );

          logger.info(`Conversation transcript retrieved`, {
            conversation_id: call.elevenLabsConversationId,
            messages_count: transcript.messages?.length || 0
          });

          // Salva trascrizione nello storico e nel database
          await this.addToHistory({
            callId: callId,
            userId: call.userId,
            conversationId: call.elevenLabsConversationId,
            startTime: new Date(call.startTime),
            endTime: new Date(),
            duration: duration,
            reason: call.reason,
            direction: call.direction || 'outbound',
            transcript: transcript
          });

        } catch (error) {
          logger.warn('Failed to retrieve transcript', {
            error: error.message
          });
        }
      }

      // 4. Rimuovi da chiamate attive
      this.activeCalls.delete(callId);

      logger.info(`Call ended successfully`, {
        call_id: callId,
        duration_seconds: duration,
        transcript_available: !!transcript
      });

      return {
        success: true,
        callId: callId,
        conversationId: call.elevenLabsConversationId,
        duration: duration,
        transcript: transcript
      };

    } catch (error) {
      logger.error('Error ending call', {
        call_id: callId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Gestisce eventi chiamata dal webhook
   * @param {object} event - Evento chiamata
   */
  async handleCallEvent(event) {
    try {
      const { id, status, from, to } = event;

      logger.info(`Call event: ${status}`, {
        call_id: id,
        from: this.maskPhone(from),
        to: this.maskPhone(to)
      });

      // Aggiorna stato chiamata
      if (this.activeCalls.has(id)) {
        const call = this.activeCalls.get(id);
        call.status = status;
        this.activeCalls.set(id, call);
      }

      // Gestisci eventi specifici
      switch (status) {
        case 'in_progress':
          // Chiamata risposta, ElevenLabs già gestisce la conversazione
          if (!this.activeCalls.has(id)) {
            await this.handleInboundCall(id, from);
          }
          break;

        case 'completed':
        case 'failed':
        case 'no_answer':
        case 'busy':
          // Chiamata terminata
          await this.endCall(id);
          break;
      }

      return await voiceCallService.handleCallEvent(event);

    } catch (error) {
      logger.error('Error handling call event', {
        event: event,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Ottieni conversazione specifica
   * @param {string} callId - ID chiamata WhatsApp
   * @returns {object|null}
   */
  async getCallDetails(callId) {
    try {
      const call = this.activeCalls.get(callId);

      if (!call) {
        return null;
      }

      // Ottieni stato da ElevenLabs se disponibile
      let conversationStatus = null;
      if (call.elevenLabsConversationId) {
        conversationStatus = await elevenLabsConversationalService.getConversationStatus(
          call.elevenLabsConversationId
        );
      }

      return {
        callId: callId,
        userId: this.maskPhone(call.userId),
        status: call.status,
        duration: Math.floor((Date.now() - call.startTime) / 1000),
        reason: call.reason,
        direction: call.direction,
        elevenLabsStatus: conversationStatus
      };

    } catch (error) {
      logger.error('Error getting call details', {
        call_id: callId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Ottieni statistiche chiamate attive
   */
  getActiveCallsStats() {
    return {
      active_calls: this.activeCalls.size,
      calls: Array.from(this.activeCalls.entries()).map(([id, call]) => ({
        call_id: id,
        user: this.maskPhone(call.userId),
        duration: Math.floor((Date.now() - call.startTime) / 1000),
        status: call.status,
        reason: call.reason || 'unknown',
        elevenlabs_conversation_id: call.elevenLabsConversationId
      }))
    };
  }

  /**
   * Aggiungi chiamata terminata allo storico e salva nel database
   */
  async addToHistory(callData) {
    this.callHistory.unshift(callData); // Aggiungi all'inizio

    // Mantieni solo le ultime N chiamate in memoria
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory = this.callHistory.slice(0, this.maxHistorySize);
    }

    logger.debug(`Call added to history`, {
      call_id: callData.callId,
      history_size: this.callHistory.length
    });

    // Salva nel database per persistenza
    try {
      // Trova l'utente nel database
      const phoneNumber = callData.userId.startsWith('+') ? callData.userId.slice(1) : callData.userId;
      const dbUser = await databaseService.getUserByPhone(phoneNumber);
      
      if (dbUser) {
        await databaseService.saveCallTranscript(dbUser.id, {
          elevenLabsConversationId: callData.conversationId,
          whatsappCallId: callData.callId,
          direction: callData.direction || 'inbound',
          durationSeconds: callData.duration,
          transcript: callData.transcript,
          startedAt: callData.startTime,
          endedAt: callData.endTime
        });
        logger.info(`Call transcript saved to database for user ${dbUser.id}`);
      } else {
        logger.warn(`Could not save transcript - user not found: ${this.maskPhone(callData.userId)}`);
      }
    } catch (error) {
      logger.error('Error saving call transcript to database:', error.message);
    }
  }

  /**
   * Ottieni tutte le trascrizioni delle chiamate terminate
   */
  getCallTranscripts() {
    return this.callHistory.map(call => ({
      callId: call.callId,
      userId: this.maskPhone(call.userId),
      conversationId: call.conversationId,
      startTime: call.startTime,
      endTime: call.endTime,
      duration: call.duration,
      reason: call.reason,
      direction: call.direction,
      messagesCount: call.transcript?.messages?.length || 0,
      hasTranscript: !!call.transcript
    }));
  }

  /**
   * Ottieni trascrizione di una chiamata specifica
   */
  getCallTranscript(callId) {
    const call = this.callHistory.find(c => c.callId === callId);
    return call ? call.transcript : null;
  }

  maskPhone(phone) {
    if (!phone || phone.length < 6) return '***';
    return phone.substring(0, 3) + '******' + phone.substring(phone.length - 3);
  }
}

export default new VoiceCallHandler();
