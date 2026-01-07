import crypto from 'crypto';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Verifica la firma HMAC SHA-256 del webhook di WhatsApp
 * Protegge contro richieste non autentiche
 *
 * Documentazione: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
export function verifyWebhookSignature(req, res, next) {
  // Skip verifica in development se APP_SECRET non è configurato
  if (config.nodeEnv === 'development' && !config.whatsapp.appSecret) {
    logger.warn('Webhook signature verification skipped (APP_SECRET not configured)');
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    logger.error('Webhook signature missing', {
      event: 'webhook_signature_missing',
      ip: req.ip
    });
    return res.status(401).json({ error: 'Signature verification failed' });
  }

  if (!req.rawBody) {
    logger.error('Raw body not available for signature verification');
    return res.status(500).json({ error: 'Internal server error' });
  }

  try {
    // Calcola HMAC SHA-256
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', config.whatsapp.appSecret)
      .update(req.rawBody)
      .digest('hex');

    // Confronto sicuro contro timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logger.error('Webhook signature mismatch', {
        event: 'webhook_signature_invalid',
        ip: req.ip,
        receivedSignature: signature.substring(0, 15) + '...'
      });
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    logger.debug('Webhook signature verified successfully');
    next();
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return res.status(500).json({ error: 'Signature verification error' });
  }
}
