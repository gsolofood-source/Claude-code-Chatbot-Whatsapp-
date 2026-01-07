import express from 'express';
import voiceCallHandler from '../handlers/voiceCallHandler.js';
import callTemplateService from '../services/callTemplateService.js';
import elevenLabsConversationalService from '../services/elevenLabsConversationalService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /calls/initiate
 * Inizia una chiamata vocale verso un utente
 *
 * Body:
 * {
 *   "to": "+393331234567",
 *   "reason": "follow_up" (opzionale)
 * }
 */
router.post('/initiate', async (req, res) => {
  try {
    const { to, reason } = req.body;

    if (!to) {
      return res.status(400).json({
        error: 'Missing required parameter: to'
      });
    }

    // Valida formato numero
    if (!to.startsWith('+')) {
      return res.status(400).json({
        error: 'Phone number must start with + and include country code'
      });
    }

    logger.info(`API request to initiate call`, {
      to: voiceCallHandler.maskPhone(to),
      reason: reason
    });

    const result = await voiceCallHandler.startOutboundCall(to, reason);

    res.json(result);

  } catch (error) {
    logger.error('Error in /calls/initiate', {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to initiate call',
      message: error.message
    });
  }
});

/**
 * POST /calls/request
 * Invia messaggio template con bottone di chiamata
 * L'utente riceve un messaggio con bottone che avvia la chiamata
 *
 * Body:
 * {
 *   "to": "+393331234567"
 * }
 */
router.post('/request', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        error: 'Missing required parameter: to'
      });
    }

    // Valida formato numero
    if (!to.startsWith('+')) {
      return res.status(400).json({
        error: 'Phone number must start with + and include country code'
      });
    }

    logger.info(`API request to send call template`, {
      to: callTemplateService.maskPhone(to)
    });

    const result = await callTemplateService.sendSimpleCallRequest(to, 'outbound_call');

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Call request template sent. User will receive a message with call button.'
    });

  } catch (error) {
    logger.error('Error in /calls/request', {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to send call request',
      message: error.message
    });
  }
});

/**
 * GET /calls/active
 * Ottieni lista chiamate attive
 * NOTA: Deve essere PRIMA di /:callId per non matchare "active" come callId
 */
router.get('/active', (req, res) => {
  try {
    const stats = voiceCallHandler.getActiveCallsStats();

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    logger.error('Error getting active calls', {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to get active calls',
      message: error.message
    });
  }
});

/**
 * GET /calls/transcripts
 * Ottieni tutte le trascrizioni delle chiamate terminate
 */
router.get('/transcripts', async (req, res) => {
  try {
    // Ottieni le trascrizioni salvate durante le chiamate
    const transcripts = voiceCallHandler.getCallTranscripts();

    res.json({
      success: true,
      total: transcripts.length,
      transcripts: transcripts
    });

  } catch (error) {
    logger.error('Error getting call transcripts', {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to get call transcripts',
      message: error.message
    });
  }
});

/**
 * GET /calls/:callId
 * Ottieni dettagli di una chiamata specifica
 */
router.get('/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    const details = await voiceCallHandler.getCallDetails(callId);

    if (!details) {
      return res.status(404).json({
        error: 'Call not found'
      });
    }

    res.json({
      success: true,
      ...details
    });

  } catch (error) {
    logger.error(`Error getting call details ${req.params.callId}`, {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to get call details',
      message: error.message
    });
  }
});

/**
 * GET /calls/:callId/transcript
 * Ottieni la trascrizione di una chiamata specifica
 */
router.get('/:callId/transcript', async (req, res) => {
  try {
    const { callId } = req.params;
    const call = voiceCallHandler.getCallDetails(callId);

    if (!call || !call.elevenLabsStatus || !call.elevenLabsStatus.conversationId) {
      return res.status(404).json({
        error: 'Call or conversation not found'
      });
    }

    // Ottieni trascrizione da ElevenLabs
    const transcript = await elevenLabsConversationalService.getConversationTranscript(
      call.elevenLabsStatus.conversationId
    );

    res.json({
      success: true,
      callId: callId,
      ...transcript
    });

  } catch (error) {
    logger.error(`Error getting transcript for call ${req.params.callId}`, {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to get call transcript',
      message: error.message
    });
  }
});

/**
 * POST /calls/:callId/end
 * Termina una chiamata attiva
 */
router.post('/:callId/end', async (req, res) => {
  try {
    const { callId } = req.params;

    logger.info(`API request to end call: ${callId}`);

    const result = await voiceCallHandler.endCall(callId);

    res.json(result);

  } catch (error) {
    logger.error(`Error ending call ${req.params.callId}`, {
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to end call',
      message: error.message
    });
  }
});

/**
 * POST /calls/webhook
 * Webhook per eventi chiamate WhatsApp
 *
 * Body: evento chiamata da WhatsApp
 */
router.post('/webhook', async (req, res) => {
  try {
    // Risposta immediata a WhatsApp
    res.sendStatus(200);

    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      logger.warn('Invalid call webhook payload');
      return;
    }

    for (const item of entry) {
      const changes = item.changes;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        const { value } = change;

        // Gestisci eventi chiamata
        if (value.calls && Array.isArray(value.calls)) {
          for (const callEvent of value.calls) {
            logger.info(`Call event received`, {
              call_id: callEvent.id,
              status: callEvent.status
            });

            await voiceCallHandler.handleCallEvent(callEvent);
          }
        }
      }
    }

  } catch (error) {
    logger.error('Error in call webhook handler', {
      error: error.message
    });
  }
});

export default router;
