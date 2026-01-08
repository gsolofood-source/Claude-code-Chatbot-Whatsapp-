import express from 'express';
import conversationManager from '../services/conversationManager.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /webhook/elevenlabs
 * Riceve eventi da ElevenLabs Agent
 */
router.post('/', async (req, res) => {
  try {
    const event = req.body;

    logger.info('ElevenLabs webhook received:', {
      type: event.type,
      conversationId: event.conversation_id,
      userId: event.user_id
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
    const { type, conversation_id, user_id } = event;

    // userId in formato WhatsApp (phone number)
    const userId = user_id || conversation_id;

    if (!userId) {
      logger.warn('ElevenLabs event missing user_id and conversation_id');
      return;
    }

    switch (type) {
      case 'user_transcript':
        // Utente ha inviato un messaggio (già loggato dal webhook WhatsApp)
        // Non serve fare nulla qui
        logger.debug(`User transcript event for ${userId} - already logged by WhatsApp webhook`);
        break;

      case 'agent_response':
        // ElevenLabs ha generato una risposta
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
        } else {
          logger.warn(`ElevenLabs agent_response event missing message content`);
        }
        break;

      case 'agent_response_correction':
        // Correzione della risposta (opzionale)
        logger.debug(`Agent response correction for ${userId}`);
        break;

      case 'conversation_end':
        // Conversazione terminata
        logger.info(`Conversation ended for ${userId}`);
        // Opzionale: potresti resettare la conversazione
        // conversationManager.resetConversation(userId);
        break;

      case 'interruption':
        // Utente ha interrotto l'agent
        logger.debug(`User interrupted agent for ${userId}`);
        break;

      case 'ping':
        // Health check da ElevenLabs
        logger.debug('ElevenLabs ping received');
        break;

      default:
        logger.debug(`Unhandled ElevenLabs event type: ${type}`);
        logger.debug('Event data:', JSON.stringify(event, null, 2));
    }

  } catch (error) {
    logger.error('Error processing ElevenLabs event:', error);
    logger.error('Event data:', JSON.stringify(event, null, 2));
  }
}

export default router;
