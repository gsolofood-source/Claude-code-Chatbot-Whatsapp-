import express from 'express';
import { config } from '../config/index.js';
import messageHandler from '../handlers/messageHandler.js';
import logger from '../utils/logger.js';
import { verifyWebhookSignature } from '../middleware/webhookSecurity.js';
import deduplicationService from '../services/deduplicationService.js';
import userQueueService from '../services/userQueueService.js';

const router = express.Router();

/**
 * Webhook verification endpoint (GET)
 * Questo viene chiamato da Meta per verificare il webhook
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Webhook verification request received', {
    mode,
    token_provided: !!token,
    challenge_provided: !!challenge
  });

  // Usa direttamente process.env per essere indipendente da config
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || config.whatsapp.verifyToken;

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.warn('Webhook verification failed', {
      expected_token: verifyToken ? 'set' : 'missing',
      received_token: token
    });
    res.sendStatus(403);
  }
});

/**
 * Webhook endpoint per ricevere messaggi (POST)
 * Protetto da verifica firma HMAC SHA-256
 */
router.post('/', verifyWebhookSignature, async (req, res) => {
  try {
    // Risposta immediata a Meta (200 OK entro 20 secondi)
    res.sendStatus(200);

    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      logger.warn('Invalid webhook payload received');
      return;
    }

    // Processa ogni entry
    for (const item of entry) {
      const changes = item.changes;

      if (!changes || !Array.isArray(changes)) {
        continue;
      }

      for (const change of changes) {
        const { value } = change;

        // Gestisci messaggi
        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            // Deduplica: verifica se già processato
            if (deduplicationService.isDuplicate(message.id)) {
              logger.info(`Duplicate message skipped: ${message.id}`);
              continue;
            }

            // Marca come processato PRIMA di elaborare
            deduplicationService.markAsProcessed(message.id);

            logger.info(`Processing message: ${message.id}`);

            // Accodare alla queue dell'utente per garantire ordine
            userQueueService.enqueue(message.from, async () => {
              await messageHandler.handleIncomingMessage(message);
            }).catch(error => {
              logger.error('Error processing message:', error);
            });
          }
        }

        // Gestisci aggiornamenti di stato
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            messageHandler.handleStatusUpdate(status).catch(error => {
              logger.error('Error processing status update:', error);
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error in webhook handler:', error);
    // Non inviare errore a Meta, abbiamo già risposto 200
  }
});

export default router;
