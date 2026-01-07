import whatsappService from '../services/whatsappService.js';
import elevenlabsService from '../services/elevenlabsService.js';
import conversationManager from '../services/conversationManager.js';
import openaiService from '../services/openaiService.js';
import logger from '../utils/logger.js';

class MessageHandler {
  /**
   * Gestisce i messaggi in arrivo da WhatsApp
   */
  async handleIncomingMessage(messageData) {
    try {
      const { from, id: messageId, type, text, audio, image } = messageData;

      logger.info(`Incoming message from ${from}, type: ${type}`);

      // Marca il messaggio come letto
      await whatsappService.markAsRead(messageId);

      // Ottieni la conversazione dell'utente
      const conversation = conversationManager.getConversation(from);

      let userMessage = '';
      let isAudioInput = false;

      // Estrai il contenuto del messaggio
      if (type === 'text') {
        userMessage = text.body;
        isAudioInput = false;
      } else if (type === 'audio') {
        // Gestisci messaggio audio
        isAudioInput = true;

        try {
          logger.info(`Processing audio message, media ID: ${audio.id}`);

          // 1. Scarica l'audio da WhatsApp
          const audioBuffer = await whatsappService.downloadMedia(audio.id);
          logger.debug(`Audio downloaded, size: ${audioBuffer.length} bytes`);

          // 2. Trascrivi con Whisper
          userMessage = await openaiService.transcribeAudio(audioBuffer, 'audio.ogg');
          logger.info(`Audio transcribed: "${userMessage.substring(0, 50)}..."`);

        } catch (error) {
          logger.error('Error processing audio:', error);
          await whatsappService.sendTextMessage(
            from,
            "Mi dispiace, ho avuto problemi a processare l'audio. Riprova o scrivimi in testo."
          );
          return;
        }
      } else if (type === 'image') {
        // Gestisci messaggio immagine
        try {
          logger.info(`Processing image message, media ID: ${image.id}`);

          // 1. Scarica l'immagine da WhatsApp
          const imageBuffer = await whatsappService.downloadMedia(image.id);
          logger.debug(`Image downloaded, size: ${imageBuffer.length} bytes`);

          // 2. Analizza l'immagine con GPT-4 Vision
          const imageAnalysis = await openaiService.analyzeImage(imageBuffer);
          logger.info(`Image analyzed: "${imageAnalysis.substring(0, 50)}..."`);

          // 3. Invia subito il feedback
          await whatsappService.sendTextMessage(from, imageAnalysis);
          logger.info(`Image analysis sent to ${from}`);

          // Non procedere oltre, abbiamo già risposto
          return;

        } catch (error) {
          logger.error('Error processing image:', error);
          await whatsappService.sendTextMessage(
            from,
            "Mi dispiace, ho avuto problemi ad analizzare l'immagine. Riprova!"
          );
          return;
        }
      } else {
        // Tipo di messaggio non supportato
        logger.warn(`Unsupported message type: ${type}`);
        return;
      }

      // Aggiungi il messaggio alla conversazione
      conversationManager.addMessage(from, {
        role: 'user',
        content: userMessage,
        messageId
      });

      // Mostra typing indicator immediatamente per feedback UX
      await whatsappService.showTypingIndicator(from, messageId);

      // Genera la risposta (audio o testo in base all'input)
      const response = await this.getAgentResponse(from, userMessage, conversation.sessionId, isAudioInput);

      // Aggiorna la session ID se è nuova
      if (response.sessionId) {
        conversationManager.updateSessionId(from, response.sessionId);
      }

      // Aggiungi la risposta alla conversazione
      conversationManager.addMessage(from, {
        role: 'assistant',
        content: response.text
      });

      // Logica di risposta:
      // - Se input è testo → risposta testuale
      // - Se input è audio → risposta audio
      if (isAudioInput && response.audioBuffer) {
        // Invia l'audio (MP3 da ElevenLabs)
        await whatsappService.sendAudioMessage(from, response.audioBuffer);
        logger.info(`Audio response sent to ${from}`);
      } else {
        // Invia solo il testo
        await whatsappService.sendTextMessage(from, response.text);
        logger.info(`Text response sent to ${from}`);
      }

    } catch (error) {
      logger.error('Error handling incoming message:', error);

      // Invia un messaggio di errore all'utente
      try {
        await whatsappService.sendTextMessage(
          messageData.from,
          "Mi dispiace, c'è stato un problema. Riprova tra poco."
        );
      } catch (sendError) {
        logger.error('Error sending error message:', sendError);
      }
    }
  }

  /**
   * Ottieni risposta dall'Agent OpenAI + ElevenLabs
   */
  async getAgentResponse(userId, message, sessionId, needsAudio = false) {
    try {
      if (needsAudio) {
        // Richiedi risposta con audio
        const response = await elevenlabsService.getAudioResponse(userId, message, sessionId);
        return response;
      } else {
        // Richiedi solo risposta testuale
        const response = await elevenlabsService.getTextResponse(userId, message, sessionId);
        return response;
      }
    } catch (error) {
      logger.error('Error getting agent response:', error);

      // Fallback: risposta testuale di default
      return {
        text: "Mi dispiace, non riesco a processare la richiesta in questo momento.",
        sessionId: null,
        audioBuffer: null
      };
    }
  }

  /**
   * Gestisce i messaggi di stato (consegnato, letto, ecc.)
   */
  async handleStatusUpdate(statusData) {
    const { id, status, recipient_id } = statusData;
    logger.debug(`Message ${id} status update: ${status} for ${recipient_id}`);
  }
}

export default new MessageHandler();
