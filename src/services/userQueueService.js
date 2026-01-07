import logger from '../utils/logger.js';

/**
 * Servizio di queue per processare messaggi per utente in ordine
 * Garantisce che messaggi dello stesso utente siano processati sequenzialmente
 */
class UserQueueService {
  constructor() {
    // Map<userId, Queue>
    // Queue = { tasks: [], processing: boolean }
    this.queues = new Map();
    this.maxBacklog = 10; // Massimo 10 messaggi in coda per utente

    logger.info('User queue service initialized');
  }

  /**
   * Aggiunge un task alla queue dell'utente
   * @param {string} userId - Numero WhatsApp dell'utente
   * @param {Function} task - Funzione async da eseguire
   * @returns {Promise} - Promise che si resolve quando il task è completato
   */
  async enqueue(userId, task) {
    // Ottieni o crea la queue per l'utente
    if (!this.queues.has(userId)) {
      this.queues.set(userId, {
        tasks: [],
        processing: false
      });
    }

    const queue = this.queues.get(userId);

    // Verifica overflow
    if (queue.tasks.length >= this.maxBacklog) {
      logger.error('User queue overflow', {
        event: 'user_queue_overflow',
        user_id: this.maskPhone(userId),
        queue_length: queue.tasks.length
      });
      throw new Error('User queue full. Too many messages in backlog.');
    }

    // Crea promise per il task
    return new Promise((resolve, reject) => {
      queue.tasks.push({ task, resolve, reject });

      logger.debug(`Task enqueued for user ${this.maskPhone(userId)}`, {
        queue_length: queue.tasks.length
      });

      // Avvia processamento se non già in corso
      if (!queue.processing) {
        this.processQueue(userId);
      }
    });
  }

  /**
   * Processa la queue dell'utente sequenzialmente
   * @param {string} userId
   */
  async processQueue(userId) {
    const queue = this.queues.get(userId);

    if (!queue || queue.tasks.length === 0) {
      return;
    }

    queue.processing = true;

    while (queue.tasks.length > 0) {
      const { task, resolve, reject } = queue.tasks.shift();

      const startTime = Date.now();

      try {
        logger.debug(`Processing task for user ${this.maskPhone(userId)}`);

        const result = await task();

        const duration = Date.now() - startTime;
        logger.info(`Task completed for user ${this.maskPhone(userId)}`, {
          duration_ms: duration,
          remaining_tasks: queue.tasks.length
        });

        resolve(result);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Task failed for user ${this.maskPhone(userId)}`, {
          error: error.message,
          duration_ms: duration
        });

        reject(error);
      }
    }

    queue.processing = false;

    // Rimuovi la queue se vuota da più di 5 minuti
    if (queue.tasks.length === 0) {
      setTimeout(() => {
        const q = this.queues.get(userId);
        if (q && q.tasks.length === 0 && !q.processing) {
          this.queues.delete(userId);
          logger.debug(`Queue cleaned up for user ${this.maskPhone(userId)}`);
        }
      }, 300000); // 5 minuti
    }
  }

  /**
   * Maschera numero di telefono per privacy (PII)
   * @param {string} phone
   * @returns {string}
   */
  maskPhone(phone) {
    if (!phone || phone.length < 6) return '***';
    return phone.substring(0, 3) + '******' + phone.substring(phone.length - 3);
  }

  /**
   * Statistiche queue
   */
  getStats() {
    const stats = {
      active_queues: this.queues.size,
      queues: []
    };

    for (const [userId, queue] of this.queues.entries()) {
      stats.queues.push({
        user_id: this.maskPhone(userId),
        tasks_pending: queue.tasks.length,
        processing: queue.processing
      });
    }

    return stats;
  }
}

export default new UserQueueService();
