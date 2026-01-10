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

    logger.info('Processing post-call transcription', {
      conversation_id,
      transcript_length: transcript?.length || 0,
      duration: metadata?.call_duration_secs,
      user_id_received: user_id,
      metadata_keys: metadata ? Object.keys(metadata) : []
    });

    if (!transcript || transcript.length === 0) {
      logger.warn('Empty transcript received', { conversation_id });
      return;
    }

    // Estrai il numero di telefono dall'user_id o metadata
    let phoneNumber = user_id;
    
    // Prova anche a cercare nei metadata se user_id non c'è
    if (!phoneNumber && metadata) {
      phoneNumber = metadata.phone_number || metadata.to || metadata.from || metadata.caller_id;
    }

    logger.info('Phone number extraction', {
      original_user_id: user_id,
      extracted_phone: phoneNumber
    });
    
    // Pulisci il numero di telefono
    if (phoneNumber) {
      // Rimuovi prefissi comuni
      phoneNumber = phoneNumber
        .replace('whatsapp:', '')
        .replace('tel:', '')
        .replace('+', '')
        .replace(/\s/g, ''); // rimuovi spazi
    }

    logger.info('Cleaned phone number', { phoneNumber });

    // Cerca l'utente nel database
    let dbUser = null;
    if (phoneNumber) {
      dbUser = await databaseService.getUserByPhone(phoneNumber);
      
      // Se non trovato, prova senza il prefisso del paese (es: 39 per Italia)
      if (!dbUser && phoneNumber.startsWith('39')) {
        dbUser = await databaseService.getUserByPhone(phoneNumber.substring(2));
      }
      // Prova anche con il prefisso se non c'è
      if (!dbUser && !phoneNumber.startsWith('39')) {
        dbUser = await databaseService.getUserByPhone('39' + phoneNumber);
      }
    }

    if (!dbUser) {
      logger.warn('Could not find user for transcript', { 
        user_id, 
        phoneNumber,
        conversation_id 
      });
      // Prova a salvare comunque con user_id null
    }

    // Prepara i dati della trascrizione
    const transcriptData = {
      elevenLabsConversationId: conversation_id,
      direction: 'inbound', // Le chiamate WhatsApp sono tipicamente inbound
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

    // Salva nel database
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
      logger.warn('Transcript not saved - user not found', { conversation_id });
    }

  } catch (error) {
    logger.error('Error handling post-call transcription:', error);
  }
}

export default router;
