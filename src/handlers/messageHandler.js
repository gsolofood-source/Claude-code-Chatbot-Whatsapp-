import whatsappService from '../services/whatsappService.js';
import elevenlabsService from '../services/elevenlabsService.js';
import conversationManager from '../services/conversationManager.js';
import openaiService from '../services/openaiService.js';
import databaseService from '../services/databaseService.js';
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

      // ========================================
      // DATABASE: Trova o crea utente e conversazione
      // ========================================
      let dbUser = null;
      let dbConversation = null;
      
      try {
        dbUser = await databaseService.findOrCreateUser(from);
        if (dbUser) {
          dbConversation = await databaseService.findOrCreateConversation(dbUser.id);
          logger.debug(`DB: User ${dbUser.id}, Conversation ${dbConversation?.id}`);
        }
      } catch (dbError) {
        logger.warn('Database operation failed, continuing without persistence:', dbError.message);
      }

      // ========================================
      // GESTIONE MESSAGGI TESTUALI
      // ========================================
      if (type === 'text') {
        // Salva nel database
        if (dbUser && dbConversation) {
          await databaseService.saveMessage(
            dbConversation.id,
            dbUser.id,
            'user',
            text.body,
            'text',
            { whatsappMessageId: messageId }
          );
        }

        // SOLO LOGGING - ElevenLabs risponderà
        conversationManager.addMessage(from, {
          role: 'user',
          content: text.body,
          messageId,
          type: 'text'
        });

        logger.info(`Text message logged for ${from}, ElevenLabs will respond`);
        return; // RETURN IMMEDIATO, non generare risposta
      }

      // ========================================
      // GESTIONE MESSAGGI AUDIO
      // ========================================
      else if (type === 'audio') {
        // Salva nel database
        if (dbUser && dbConversation) {
          await databaseService.saveMessage(
            dbConversation.id,
            dbUser.id,
            'user',
            '[Audio message]',
            'audio',
            { whatsappMessageId: messageId }
          );
        }

        // SOLO LOGGING - ElevenLabs gestisce tutto (trascrizione + risposta)
        conversationManager.addMessage(from, {
          role: 'user',
          content: '[Audio message - handled by ElevenLabs]',
          messageId,
          type: 'audio'
        });

        logger.info(`Audio message logged for ${from}, ElevenLabs will handle transcription and response`);
        return; // RETURN IMMEDIATO
      }

      // ========================================
      // GESTIONE IMMAGINI (MANTIENI FLUSSO COMPLETO)
      // ========================================
      else if (type === 'image') {
        // ElevenLabs NON gestisce immagini, quindi il backend risponde
        try {
          logger.info(`Processing image message, media ID: ${image.id}`);

          // 1. Scarica l'immagine da WhatsApp
          const imageBuffer = await whatsappService.downloadMedia(image.id);
          logger.debug(`Image downloaded, size: ${imageBuffer.length} bytes`);

          // 2. Analizza l'immagine con GPT-4 Vision
          const imageAnalysis = await openaiService.analyzeImage(imageBuffer);
          logger.info(`Image analyzed: "${imageAnalysis.substring(0, 50)}..."`);

          // 3. Salva nel database - messaggio utente
          if (dbUser && dbConversation) {
            await databaseService.saveMessage(
              dbConversation.id,
              dbUser.id,
              'user',
              '[Image sent]',
              'image',
              { whatsappMessageId: messageId, imageAnalysis }
            );
            
            // Salva la risposta dell'assistant
            await databaseService.saveMessage(
              dbConversation.id,
              dbUser.id,
              'assistant',
              imageAnalysis,
              'text',
              {}
            );
          }

          // 3. Logga la domanda utente (cache)
          conversationManager.addMessage(from, {
            role: 'user',
            content: '[Image sent]',
            messageId,
            type: 'image'
          });

          // 4. Logga la risposta assistant (cache)
          conversationManager.addMessage(from, {
            role: 'assistant',
            content: imageAnalysis,
            type: 'text'
          });

          // 5. Invia il feedback all'utente
          await whatsappService.sendTextMessage(from, imageAnalysis);
          logger.info(`Image analysis sent to ${from}`);

          return; // Flusso completato

        } catch (error) {
          logger.error('Error processing image:', error);
          await whatsappService.sendTextMessage(
            from,
            "Mi dispiace, ho avuto problemi ad analizzare l'immagine. Riprova!"
          );
          return;
        }
      }

      // ========================================
      // TIPO NON SUPPORTATO
      // ========================================
      else {
        logger.warn(`Unsupported message type: ${type}`);
        return;
      }

    } catch (error) {
      logger.error('Error handling incoming message:', error);
      // Non inviare messaggio di errore per text/audio per evitare conflitti con ElevenLabs
      logger.error('Message processing failed, no error message sent to avoid conflicts with ElevenLabs');
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
