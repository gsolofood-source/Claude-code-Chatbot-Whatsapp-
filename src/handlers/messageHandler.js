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

      // ========================================
      // GESTIONE MESSAGGI TESTUALI
      // ========================================
      if (type === 'text') {
        try {
          // 1. Logga il messaggio utente
          conversationManager.addMessage(from, {
            role: 'user',
            content: text.body,
            messageId,
            type: 'text'
          });

          logger.info(`Processing text message from ${from}: "${text.body.substring(0, 50)}..."`);

          // 2. Ottieni risposta da GPT
          const responseText = await openaiService.getResponse(from, text.body);
          logger.info(`GPT response: "${responseText.substring(0, 50)}..."`);

          // 3. Logga la risposta assistant
          conversationManager.addMessage(from, {
            role: 'assistant',
            content: responseText,
            type: 'text'
          });

          // 4. Invia la risposta testuale
          await whatsappService.sendTextMessage(from, responseText);
          logger.info(`Text response sent to ${from}`);

          return;

        } catch (error) {
          logger.error('Error processing text message:', error);
          await whatsappService.sendTextMessage(
            from,
            "Mi dispiace, ho avuto problemi a processare il messaggio. Riprova!"
          );
          return;
        }
      }

      // ========================================
      // GESTIONE MESSAGGI AUDIO
      // ========================================
      else if (type === 'audio') {
        try {
          logger.info(`Processing audio message, media ID: ${audio.id}`);

          // 1. Scarica l'audio da WhatsApp
          const audioBuffer = await whatsappService.downloadMedia(audio.id);
          logger.debug(`Audio downloaded, size: ${audioBuffer.length} bytes`);

          // 2. Trascrivi con Whisper
          const transcription = await openaiService.transcribeAudio(audioBuffer);
          logger.info(`Audio transcribed: "${transcription.substring(0, 50)}..."`);

          // 3. Logga il messaggio utente (con trascrizione)
          conversationManager.addMessage(from, {
            role: 'user',
            content: transcription,
            messageId,
            type: 'audio',
            metadata: { originalType: 'audio' }
          });

          // 4. Ottieni risposta da GPT (usa lo stesso Assistant di Joe)
          const responseText = await openaiService.getResponse(from, transcription);
          logger.info(`GPT response: "${responseText.substring(0, 50)}..."`);

          // 5. Genera audio con ElevenLabs TTS
          const audioResponse = await elevenlabsService.textToSpeechWithAgentVoice(responseText);

          // 6. Logga la risposta assistant
          conversationManager.addMessage(from, {
            role: 'assistant',
            content: responseText,
            type: 'audio',
            metadata: {
              responseType: 'audio',
              source: 'backend-whisper-gpt-tts'
            }
          });

          // 7. Invia la risposta audio all'utente
          if (audioResponse) {
            await whatsappService.sendAudioMessage(from, audioResponse);
            logger.info(`Audio response sent to ${from}`);
          } else {
            // Fallback: invia testo se TTS fallisce
            await whatsappService.sendTextMessage(from, responseText);
            logger.info(`Text fallback sent to ${from}`);
          }

          return;

        } catch (error) {
          logger.error('Error processing audio message:', error);
          await whatsappService.sendTextMessage(
            from,
            "Mi dispiace, ho avuto problemi a processare il messaggio vocale. Riprova!"
          );
          return;
        }
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

          // 3. Logga la domanda utente
          conversationManager.addMessage(from, {
            role: 'user',
            content: '[Image sent]',
            messageId,
            type: 'image'
          });

          // 4. Logga la risposta assistant
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
