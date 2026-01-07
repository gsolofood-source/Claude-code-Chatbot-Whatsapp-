import NodeCache from 'node-cache';
import logger from '../utils/logger.js';

/**
 * Servizio di deduplica per message_id di WhatsApp
 * Previene elaborazione duplicata di messaggi (WhatsApp riprova webhook)
 * TTL: 24 ore
 */
class DeduplicationService {
  constructor() {
    // TTL: 24 ore (86400 secondi)
    // checkperiod: controlla ogni 10 minuti per rimuovere chiavi scadute
    this.cache = new NodeCache({
      stdTTL: 86400,
      checkperiod: 600,
      useClones: false
    });

    this.cache.on('expired', (key, value) => {
      logger.debug(`Dedup key expired: ${key}`);
    });

    logger.info('Deduplication service initialized');
  }

  /**
   * Verifica se un message_id è già stato processato
   * @param {string} messageId - WhatsApp message ID
   * @returns {boolean} true se già processato, false altrimenti
   */
  isDuplicate(messageId) {
    const key = `processed:${messageId}`;
    const exists = this.cache.has(key);

    if (exists) {
      logger.warn('Duplicate message detected', {
        event: 'duplicate_message_skipped',
        message_id: messageId
      });
    }

    return exists;
  }

  /**
   * Marca un message_id come processato
   * @param {string} messageId - WhatsApp message ID
   */
  markAsProcessed(messageId) {
    const key = `processed:${messageId}`;
    this.cache.set(key, Date.now());

    logger.debug(`Message marked as processed: ${messageId}`);
  }

  /**
   * Statistiche cache
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize
    };
  }

  /**
   * Reset cache (per testing)
   */
  reset() {
    this.cache.flushAll();
    logger.info('Deduplication cache reset');
  }
}

export default new DeduplicationService();
