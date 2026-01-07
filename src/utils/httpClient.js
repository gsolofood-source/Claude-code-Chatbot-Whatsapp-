import axios from 'axios';
import axiosRetry from 'axios-retry';
import logger from './logger.js';

/**
 * Crea un client HTTP con timeout e retry configurati
 * @param {Object} options - Opzioni di configurazione
 * @param {number} options.timeout - Timeout in ms
 * @param {number} options.retries - Numero di retry (default: 2)
 * @param {string} options.serviceName - Nome del servizio per logging
 * @returns {AxiosInstance}
 */
export function createHttpClient(options = {}) {
  const {
    timeout = 10000,
    retries = 2,
    serviceName = 'unknown'
  } = options;

  const client = axios.create({
    timeout,
    headers: {
      'User-Agent': 'WhatsApp-Joe-Bot/1.0'
    }
  });

  // Configura retry con exponential backoff
  axiosRetry(client, {
    retries,
    retryDelay: (retryCount) => {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retryCount - 1) * 1000;
      logger.debug(`Retry attempt ${retryCount} for ${serviceName} after ${delay}ms`);
      return delay;
    },
    retryCondition: (error) => {
      // Retry su errori di rete o HTTP 429, 500, 502, 503, 504
      if (axiosRetry.isNetworkError(error)) {
        logger.warn(`Network error for ${serviceName}, will retry`, {
          error: error.message
        });
        return true;
      }

      if (axiosRetry.isRetryableError(error)) {
        const status = error.response?.status;
        const shouldRetry = [429, 500, 502, 503, 504].includes(status);

        if (shouldRetry) {
          logger.warn(`Retryable HTTP error ${status} for ${serviceName}`, {
            status,
            error: error.message
          });
        }

        return shouldRetry;
      }

      return false;
    },
    onRetry: (retryCount, error, requestConfig) => {
      logger.info(`Retrying request to ${serviceName}`, {
        event: 'http_retry',
        service: serviceName,
        attempt: retryCount,
        url: requestConfig.url,
        error: error.message
      });
    }
  });

  // Interceptor per logging
  client.interceptors.request.use(
    (config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      const duration = Date.now() - response.config.metadata.startTime;
      logger.debug(`${serviceName} request completed`, {
        duration_ms: duration,
        status: response.status
      });
      return response;
    },
    (error) => {
      if (error.config?.metadata) {
        const duration = Date.now() - error.config.metadata.startTime;
        logger.error(`${serviceName} request failed`, {
          duration_ms: duration,
          status: error.response?.status,
          error: error.message
        });
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Client preconfigurati per i diversi servizi
 */
export const httpClients = {
  whatsapp: createHttpClient({
    timeout: 8000,
    retries: 2,
    serviceName: 'WhatsApp'
  }),

  openai: createHttpClient({
    timeout: 15000,
    retries: 2,
    serviceName: 'OpenAI'
  }),

  elevenlabs: createHttpClient({
    timeout: 15000,
    retries: 2,
    serviceName: 'ElevenLabs'
  })
};
