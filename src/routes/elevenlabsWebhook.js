import express from 'express';
import conversationManager from '../services/conversationManager.js';
import databaseService from '../services/databaseService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /webhook/elevenlabs
 * Riceve eventi da ElevenLabs Agent (inclusi post-call webhooks)
 */
router.post('/', async (req, res) => {
  try {
    const event = req.body;

    logger.info('ElevenLabs webhook received:', {
      type: event.type,
      conversationId: event.data?.conversation_id || event.conversation_id
    });

    // Rispondi subito con 200 per confermare ricezione
    res.status(200).json({ received: true });

    // Processa l'evento in background
    await processElevenLabsEvent(event);

  } catch (error) {
    logger.error('Error handling ElevenLabs webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Processa eventi ElevenLabs
 */
async function processElevenLabsEvent(event) {
  try {
    const { type, data, event_timestamp } = event;

    // Gestisci i nuovi post-call webhooks
    if (type === 'post_call_transcription') {
      await handlePostCallTranscription(data, event_timestamp);
      return;
    }

    if (type === 'post_call_audio') {
      logger.info('Post-call audio received (not processed)', {
        conversation_id: data?.conversation_id
      });
      return;
    }

    if (type === 'call_initiation_failure') {
      logger.warn('Call initiation failed', {
        conversation_id: data?.conversation_id,
        failure_reason: data?.failure_reason
      });
      return;
    }

    // Gestione eventi legacy (in-call)
    const conversation_id = event.conversation_id;
    const user_id = event.user_id;
    const userId = user_id || conversation_id;

    if (!userId) {
      logger.warn('ElevenLabs event missing user_id and conversation_id');
      return;
    }

    switch (type) {
      case 'user_transcript':
        logger.debug(`User transcript event for ${userId} - already logged by WhatsApp webhook`);
        break;

      case 'agent_response':
        const agentMessage = event.agent_response || event.response || event.text;
        if (agentMessage) {
          conversationManager.addMessage(userId, {
            role: 'assistant',
            content: agentMessage,
            type: 'text',
            metadata: {
              source: 'elevenlabs',
              conversationId: conversation_id,
              timestamp: event.timestamp || new Date().toISOString()
            }
          });
          logger.info(`ElevenLabs response logged for ${userId}: "${agentMessage.substring(0, 50)}..."`);
        }
        break;

      case 'conversation_end':
        logger.info(`Conversation ended for ${userId}`);
        break;

      case 'interruption':
        logger.debug(`User interrupted agent for ${userId}`);
        break;

      case 'ping':
        logger.debug('ElevenLabs ping received');
        break;

      default:
        logger.debug(`Unhandled ElevenLabs event type: ${type}`);
    }

  } catch (error) {
    logger.error('Error processing ElevenLabs event:', error);
  }
}

/**
 * Gestisce il webhook post_call_transcription
 * Salva la trascrizione nel database
 */
async function handlePostCallTranscription(data, eventTimestamp) {
  try {
    const {
      conversation_id,
      agent_id,
      transcript,
      metadata,
      analysis,
      user_id
    } = data;

    // Log completo del payload per debug
    logger.info('Post-call transcription data received', {
      conversation_id,
      agent_id,
      user_id: user_id || 'NOT PROVIDED',
      transcript_length: transcript?.length || 0,
      duration: metadata?.call_duration_secs,
      metadata_keys: metadata ? Object.keys(metadata) : [],
      has_analysis: !!analysis
    });

    if (!transcript || transcript.length === 0) {
      logger.warn('Empty transcript received', { conversation_id });
      return;
    }

    // Estrai il numero di telefono da varie fonti possibili
    let phoneNumber = null;
    
    // 1. Prova da user_id
    if (user_id) {
      phoneNumber = user_id;
      logger.info('Phone from user_id', { phoneNumber });
    }
    
    // 2. Prova da metadata
    if (!phoneNumber && metadata) {
      phoneNumber = metadata.phone_number || metadata.to || metadata.from || metadata.caller_id || metadata.customer_number;
      if (phoneNumber) {
        logger.info('Phone from metadata', { phoneNumber });
      }
    }

    // 3. Prova da conversation_initiation_client_data (dynamic variables)
    if (!phoneNumber && data.conversation_initiation_client_data?.dynamic_variables) {
      const dynVars = data.conversation_initiation_client_data.dynamic_variables;
      phoneNumber = dynVars.phone_number || dynVars.phone || dynVars.caller_id;
      if (phoneNumber) {
        logger.info('Phone from dynamic_variables', { phoneNumber });
      }
    }

    // Pulisci il numero di telefono se trovato
    if (phoneNumber) {
      phoneNumber = phoneNumber
        .toString()
        .replace('whatsapp:', '')
        .replace('tel:', '')
        .replace('+', '')
        .replace(/\s/g, '');
      logger.info('Cleaned phone number', { phoneNumber });
    } else {
      logger.warn('No phone number found in webhook payload');
    }

    // Cerca l'utente nel database
    let dbUser = null;
    if (phoneNumber) {
      dbUser = await databaseService.getUserByPhone(phoneNumber);
      
      // Se non trovato, prova varianti
      if (!dbUser && phoneNumber.startsWith('39')) {
        dbUser = await databaseService.getUserByPhone(phoneNumber.substring(2));
      }
      if (!dbUser && !phoneNumber.startsWith('39') && phoneNumber.length < 12) {
        dbUser = await databaseService.getUserByPhone('39' + phoneNumber);
      }
    }

    // Se ancora non troviamo l'utente, prova a trovare l'ultimo utente attivo
    if (!dbUser) {
      logger.warn('Could not find user by phone, trying last active user');
      // Cerca l'ultimo utente che ha avuto una conversazione attiva
      const lastActiveUser = await databaseService.query(
        `SELECT u.* FROM users u 
         JOIN conversations c ON c.user_id = u.id 
         ORDER BY c.updated_at DESC LIMIT 1`
      );
      if (lastActiveUser.rows && lastActiveUser.rows.length > 0) {
        dbUser = lastActiveUser.rows[0];
        logger.info('Found last active user', { user_id: dbUser.id, phone: dbUser.phone_number });
      }
    }

    // Prepara i dati della trascrizione
    const transcriptData = {
      elevenLabsConversationId: conversation_id,
      direction: 'inbound',
      durationSeconds: metadata?.call_duration_secs || null,
      transcript: {
        messages: transcript.map(t => ({
          role: t.role === 'agent' ? 'assistant' : 'user',
          message: t.message,
          time_in_call_secs: t.time_in_call_secs
        })),
        analysis: analysis,
        metadata: metadata
      },
      summary: analysis?.transcript_summary || null,
      startedAt: metadata?.start_time_unix_secs 
        ? new Date(metadata.start_time_unix_secs * 1000) 
        : null,
      endedAt: eventTimestamp 
        ? new Date(eventTimestamp * 1000) 
        : new Date()
    };

    // Salva nel database (anche senza utente se necessario)
    if (dbUser) {
      const saved = await databaseService.saveCallTranscript(dbUser.id, transcriptData);
      
      if (saved) {
        logger.info('Call transcript saved successfully', {
          transcript_id: saved.id,
          user_id: dbUser.id,
          conversation_id,
          messages_count: transcript.length
        });
      }
    } else {
      logger.warn('Transcript not saved - no user found', { 
        conversation_id,
        attempted_phone: phoneNumber
      });
    }

  } catch (error) {
    logger.error('Error handling post-call transcription:', error);
  }
}

export default router;
