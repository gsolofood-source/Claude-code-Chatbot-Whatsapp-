import whatsappService from '../services/whatsappService.js';
import elevenlabsService from '../services/elevenlabsService.js';
import conversationManager from '../services/conversationManager.js';
import openaiService from '../services/openaiService.js';
import databaseService from '../services/databaseService.js';
import logger from '../utils/logger.js';

// Messaggi di onboarding
const MESSAGES = {
  // Prompt per GPT per generare il messaggio di benvenuto
  WELCOME_PROMPT: (userMessage) => `L'utente ti ha appena scritto per la prima volta. Questo è il suo primo messaggio:
"${userMessage}"

ISTRUZIONI IMPORTANTI:
1. Presentati brevemente come Joe Bastianich (ristoratore, imprenditore, giudice MasterChef)
2. Se l'utente ha fatto una domanda o detto qualcosa di specifico, fai un breve commento pertinente
3. Chiedi il nome dell'utente in modo naturale e amichevole
4. Mantieni il tono diretto e professionale tipico di Joe
5. La risposta deve essere breve (2-3 frasi massimo)
6. NON rispondere ancora alla domanda dell'utente - prima devi sapere il suo nome

Esempio di tono: "Ciao! Sono Joe Bastianich. [breve commento sul messaggio]. Ma prima dimmi, come ti chiami?"`,
  
  ASK_NAME_AGAIN: `Non ho capito bene il tuo nome. Puoi ripeterlo? Scrivi semplicemente il tuo nome, per esempio "Marco" o "Mi chiamo Marco".`,
  
  WELCOME_BACK: (name) => `Ciao ${name}! Sono Joe. Come posso aiutarti oggi?`,
  
  NAME_CONFIRMED: (name) => `Piacere di conoscerti, ${name}! 🤝

Sono qui per parlare di ristorazione, business, vino, o qualsiasi cosa tu voglia discutere. Cosa ti porta qui oggi?`
};

class MessageHandler {
  
  /**
   * Estrae il nome dal messaggio usando GPT
   */
  async extractNameFromMessage(message) {
    try {
      const response = await openaiService.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Sei un assistente che estrae nomi di persona dai messaggi.
            
REGOLE:
- Se il messaggio contiene un nome di persona, restituisci SOLO il nome (prima lettera maiuscola)
- Se il messaggio è solo un nome (es: "Marco", "maria", "Giovanni Rossi"), restituisci il primo nome
- Se il messaggio contiene "mi chiamo X" o "sono X", estrai X
- Se NON c'è un nome chiaro di persona, restituisci esattamente: NO_NAME
- Non inventare nomi
- Ignora saluti, domande, o altro testo

ESEMPI:
- "Marco" → "Marco"
- "mi chiamo giulia" → "Giulia"  
- "Sono Alessandro" → "Alessandro"
- "Giovanni Rossi" → "Giovanni"
- "Ciao come stai?" → "NO_NAME"
- "Voglio parlare con Joe" → "NO_NAME"
- "123" → "NO_NAME"
- "ok" → "NO_NAME"`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 50,
        temperature: 0
      });

      const extractedName = response.choices[0].message.content.trim();
      
      if (extractedName === 'NO_NAME' || extractedName.length > 50) {
        return null;
      }
      
      return extractedName;
    } catch (error) {
      logger.error('Error extracting name:', error.message);
      return null;
    }
  }

  /**
   * Gestisce il flusso di onboarding (richiesta nome)
   * Ritorna true se l'onboarding è completo, false se ancora in corso
   */
  async handleOnboarding(dbUser, dbConversation, from, messageContent, messageId) {
    // Se l'utente ha già un nome, onboarding completato
    if (dbUser.name) {
      logger.debug(`User ${from} already registered as: ${dbUser.name}`);
      return true; // Onboarding completo, procedi normalmente
    }

    // L'utente non ha un nome - siamo in fase di onboarding
    logger.info(`User ${from} needs onboarding (no name set)`);

    // Controlla se questo è il primo messaggio (nessun messaggio precedente nella conversazione)
    const messageCount = dbConversation?.message_count || 0;
    
    // Salva il messaggio dell'utente
    if (dbConversation) {
      await databaseService.saveMessage(
        dbConversation.id,
        dbUser.id,
        'user',
        messageContent,
        'text',
        { whatsappMessageId: messageId }
      );
    }

    // Se è il primo messaggio, manda il benvenuto personalizzato con GPT
    if (messageCount === 0) {
      logger.info(`First message from ${from}, generating personalized welcome with GPT`);
      
      try {
        // Genera risposta di benvenuto con GPT che legge il messaggio dell'utente
        const welcomePrompt = MESSAGES.WELCOME_PROMPT(messageContent);
        const welcomeResponse = await openaiService.client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Sei Joe Bastianich, famoso ristoratore italo-americano, imprenditore e giudice di MasterChef Italia. Rispondi sempre in italiano con tono diretto, professionale ma amichevole."
            },
            {
              role: "user",
              content: welcomePrompt
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        });

        const welcomeMessage = welcomeResponse.choices[0].message.content.trim();
        logger.info(`GPT generated welcome: "${welcomeMessage.substring(0, 50)}..."`);

        await whatsappService.sendTextMessage(from, welcomeMessage);
        
        // Salva la risposta del bot
        if (dbConversation) {
          await databaseService.saveMessage(
            dbConversation.id,
            dbUser.id,
            'assistant',
            welcomeMessage,
            'text',
            {}
          );
        }
      } catch (error) {
        // Fallback a messaggio semplice se GPT fallisce
        logger.error('Error generating welcome with GPT, using fallback:', error.message);
        const fallbackMessage = "Ciao! Sono Joe Bastianich. Prima di iniziare, come ti chiami?";
        await whatsappService.sendTextMessage(from, fallbackMessage);
        
        if (dbConversation) {
          await databaseService.saveMessage(
            dbConversation.id,
            dbUser.id,
            'assistant',
            fallbackMessage,
            'text',
            {}
          );
        }
      }
      
      return false; // Onboarding in corso
    }

    // Non è il primo messaggio - l'utente sta rispondendo alla richiesta del nome
    // Prova a estrarre il nome
    const extractedName = await this.extractNameFromMessage(messageContent);

    if (extractedName) {
      // Nome trovato! Salvalo nel database
      await databaseService.updateUserName(dbUser.id, extractedName);
      logger.info(`User ${from} registered with name: ${extractedName}`);

      // Manda conferma
      const confirmMessage = MESSAGES.NAME_CONFIRMED(extractedName);
      await whatsappService.sendTextMessage(from, confirmMessage);
      
      // Salva la risposta del bot
      if (dbConversation) {
        await databaseService.saveMessage(
          dbConversation.id,
          dbUser.id,
          'assistant',
          confirmMessage,
          'text',
          {}
        );
      }

      return true; // Onboarding completo!
    } else {
      // Nome non trovato, richiedi di nuovo
      logger.info(`Could not extract name from: "${messageContent}"`);
      await whatsappService.sendTextMessage(from, MESSAGES.ASK_NAME_AGAIN);
      
      // Salva la risposta del bot
      if (dbConversation) {
        await databaseService.saveMessage(
          dbConversation.id,
          dbUser.id,
          'assistant',
          MESSAGES.ASK_NAME_AGAIN,
          'text',
          {}
        );
      }

      return false; // Onboarding ancora in corso
    }
  }

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
      // ONBOARDING: Controlla se l'utente ha un nome
      // (Solo per messaggi di TESTO - audio gestito nel suo blocco)
      // ========================================
      if (dbUser && type === 'text') {
        const messageContent = text.body;

        const onboardingComplete = await this.handleOnboarding(
          dbUser, 
          dbConversation, 
          from, 
          messageContent, 
          messageId
        );

        if (!onboardingComplete) {
          // Onboarding in corso - non procedere con il normale flusso
          logger.info(`Onboarding in progress for ${from}, blocking normal flow`);
          return;
        }

        // Ricarica l'utente per avere il nome aggiornato
        dbUser = await databaseService.getUserByPhone(from);
      }

      // ========================================
      // GESTIONE MESSAGGI TESTUALI
      // ========================================
      if (type === 'text') {
        // Salva nel database (se non già salvato dall'onboarding)
        if (dbUser && dbConversation && dbUser.name) {
          await databaseService.saveMessage(
            dbConversation.id,
            dbUser.id,
            'user',
            text.body,
            'text',
            { whatsappMessageId: messageId }
          );
        }

        // Logga nella cache
        conversationManager.addMessage(from, {
          role: 'user',
          content: text.body,
          messageId,
          type: 'text'
        });

        logger.info(`Text message logged for ${from} (${dbUser?.name || 'unknown'}), ElevenLabs will respond`);
        return;
      }

      // ========================================
      // GESTIONE MESSAGGI AUDIO
      // Backend gestisce: Whisper → GPT → TTS → Audio
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

          // Se utente in onboarding (senza nome), usa la trascrizione per estrarre nome
          if (dbUser && !dbUser.name) {
            // Salva il messaggio
            if (dbConversation) {
              await databaseService.saveMessage(
                dbConversation.id,
                dbUser.id,
                'user',
                transcription,
                'audio',
                { whatsappMessageId: messageId, audioTranscript: transcription }
              );
            }

            // Prova a estrarre il nome dalla trascrizione
            const extractedName = await this.extractNameFromMessage(transcription);
            
            if (extractedName) {
              // Nome trovato!
              await databaseService.updateUserName(dbUser.id, extractedName);
              logger.info(`User ${from} registered with name from audio: ${extractedName}`);

              const confirmMessage = MESSAGES.NAME_CONFIRMED(extractedName);
              await whatsappService.sendTextMessage(from, confirmMessage);
              
              if (dbConversation) {
                await databaseService.saveMessage(
                  dbConversation.id,
                  dbUser.id,
                  'assistant',
                  confirmMessage,
                  'text',
                  {}
                );
              }
              return;
            } else {
              // Non trovato, richiedi nome
              await whatsappService.sendTextMessage(from, MESSAGES.ASK_NAME_AGAIN);
              if (dbConversation) {
                await databaseService.saveMessage(
                  dbConversation.id,
                  dbUser.id,
                  'assistant',
                  MESSAGES.ASK_NAME_AGAIN,
                  'text',
                  {}
                );
              }
              return;
            }
          }

          // 3. Recupera cronologia degli ultimi 20 messaggi dal database
          let conversationHistory = [];
          if (dbConversation) {
            conversationHistory = await databaseService.getMessagesForContext(dbConversation.id, 20);
            logger.info(`Loaded ${conversationHistory.length} messages of context from database`);
          }

          // 4. Genera risposta con GPT (con contesto) e audio con ElevenLabs TTS
          const response = await elevenlabsService.getAudioResponse(from, transcription, null, conversationHistory);
          logger.info(`GPT response: "${response.text.substring(0, 50)}..."`);

          // 5. Salva nel database
          if (dbUser && dbConversation) {
            await databaseService.saveMessage(
              dbConversation.id,
              dbUser.id,
              'user',
              transcription,
              'audio',
              { whatsappMessageId: messageId, audioTranscript: transcription }
            );
            
            await databaseService.saveMessage(
              dbConversation.id,
              dbUser.id,
              'assistant',
              response.text,
              'audio',
              {}
            );
          }

          // 6. Logga nella cache
          conversationManager.addMessage(from, {
            role: 'user',
            content: transcription,
            messageId,
            type: 'audio'
          });

          conversationManager.addMessage(from, {
            role: 'assistant',
            content: response.text,
            type: 'audio'
          });

          // 6. Invia risposta audio
          if (response.audioBuffer) {
            await whatsappService.sendAudioMessage(from, response.audioBuffer);
            logger.info(`Audio response sent to ${from} (${dbUser?.name || 'unknown'})`);
          } else {
            // Fallback a testo se audio non disponibile
            await whatsappService.sendTextMessage(from, response.text);
            logger.info(`Text response sent to ${from} (audio generation failed)`);
          }

          return;

        } catch (error) {
          logger.error('Error processing audio:', error);
          await whatsappService.sendTextMessage(
            from,
            "Mi dispiace, ho avuto problemi a processare il messaggio audio. Riprova!"
          );
          return;
        }
      }

      // ========================================
      // GESTIONE IMMAGINI
      // ========================================
      else if (type === 'image') {
        try {
          logger.info(`Processing image message, media ID: ${image.id}`);

          // 1. Scarica l'immagine da WhatsApp
          const imageBuffer = await whatsappService.downloadMedia(image.id);
          logger.debug(`Image downloaded, size: ${imageBuffer.length} bytes`);

          // 2. Analizza l'immagine con GPT-4 Vision
          const imageAnalysis = await openaiService.analyzeImage(imageBuffer);
          logger.info(`Image analyzed: "${imageAnalysis.substring(0, 50)}..."`);

          // 3. Salva nel database
          if (dbUser && dbConversation) {
            await databaseService.saveMessage(
              dbConversation.id,
              dbUser.id,
              'user',
              '[Image sent]',
              'image',
              { whatsappMessageId: messageId, imageAnalysis }
            );
            
            await databaseService.saveMessage(
              dbConversation.id,
              dbUser.id,
              'assistant',
              imageAnalysis,
              'text',
              {}
            );
          }

          // 4. Logga nella cache
          conversationManager.addMessage(from, {
            role: 'user',
            content: '[Image sent]',
            messageId,
            type: 'image'
          });

          conversationManager.addMessage(from, {
            role: 'assistant',
            content: imageAnalysis,
            type: 'text'
          });

          // 5. Invia risposta
          await whatsappService.sendTextMessage(from, imageAnalysis);
          logger.info(`Image analysis sent to ${from} (${dbUser?.name || 'unknown'})`);

          return;

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
      logger.error('Message processing failed');
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
