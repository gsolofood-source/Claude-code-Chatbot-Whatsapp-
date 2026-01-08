import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChatLogService {
  constructor() {
    // Directory per i log delle chat
    this.logsDir = path.join(__dirname, '../../logs/chats');
    this.initializeLogsDirectory();
  }

  /**
   * Inizializza la directory dei log
   */
  initializeLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      logger.info('Chat logs directory created');
    }
  }

  /**
   * Salva un messaggio nel log
   */
  logMessage(userId, message, messageType = 'text') {
    try {
      const logEntry = {
        userId,
        messageType,
        content: message.content || message.text || '',
        role: message.role || 'unknown',
        timestamp: new Date().toISOString(),
        metadata: {
          from: message.from,
          to: message.to,
          messageId: message.id || message.messageId,
          ...message.metadata
        }
      };

      // Crea un file per ogni giorno
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(this.logsDir, `chat-log-${today}.json`);

      // Leggi i log esistenti o inizializza un array vuoto
      let logs = [];
      if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf8');
        if (fileContent.trim()) {
          logs = JSON.parse(fileContent);
        }
      }

      // Aggiungi il nuovo log
      logs.push(logEntry);

      // Salva il file aggiornato
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      logger.debug(`Chat message logged for user ${userId}`);

      return logEntry;
    } catch (error) {
      logger.error('Error logging chat message:', error);
      throw error;
    }
  }

  /**
   * Recupera i log delle ultime N ore
   */
  getLogsLastHours(hours = 15) {
    try {
      const allLogs = [];
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

      // Leggi tutti i file di log nella directory
      const files = fs.readdirSync(this.logsDir)
        .filter(file => file.startsWith('chat-log-') && file.endsWith('.json'))
        .sort()
        .reverse(); // Inizia dai file più recenti

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        if (!fileContent.trim()) continue;

        const logs = JSON.parse(fileContent);

        // Filtra i log per timestamp
        const filteredLogs = logs.filter(log => {
          const logTime = new Date(log.timestamp);
          return logTime >= cutoffTime;
        });

        allLogs.push(...filteredLogs);

        // Se il file è più vecchio del cutoff, non serve leggere altri file
        const fileDate = file.match(/chat-log-(\d{4}-\d{2}-\d{2})\.json/);
        if (fileDate) {
          const fileDateTime = new Date(fileDate[1]);
          // Se il file è più di 24 ore più vecchio del cutoff, fermati
          if (fileDateTime.getTime() < cutoffTime.getTime() - 24 * 60 * 60 * 1000) {
            break;
          }
        }
      }

      // Ordina per timestamp (dal più recente al più vecchio)
      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      logger.info(`Retrieved ${allLogs.length} chat logs from last ${hours} hours`);
      return allLogs;
    } catch (error) {
      logger.error('Error retrieving chat logs:', error);
      throw error;
    }
  }

  /**
   * Recupera i log per un utente specifico nelle ultime N ore
   */
  getUserLogsLastHours(userId, hours = 15) {
    try {
      const allLogs = this.getLogsLastHours(hours);
      const userLogs = allLogs.filter(log => log.userId === userId);

      logger.info(`Retrieved ${userLogs.length} chat logs for user ${userId} from last ${hours} hours`);
      return userLogs;
    } catch (error) {
      logger.error(`Error retrieving logs for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Recupera statistiche sui log
   */
  getLogStats(hours = 15) {
    try {
      const logs = this.getLogsLastHours(hours);

      // Raggruppa per utente
      const userStats = {};
      logs.forEach(log => {
        if (!userStats[log.userId]) {
          userStats[log.userId] = {
            userId: log.userId,
            messageCount: 0,
            lastMessage: null,
            firstMessage: null
          };
        }

        userStats[log.userId].messageCount++;

        const logTime = new Date(log.timestamp);
        if (!userStats[log.userId].lastMessage ||
            new Date(userStats[log.userId].lastMessage) < logTime) {
          userStats[log.userId].lastMessage = log.timestamp;
        }

        if (!userStats[log.userId].firstMessage ||
            new Date(userStats[log.userId].firstMessage) > logTime) {
          userStats[log.userId].firstMessage = log.timestamp;
        }
      });

      return {
        totalMessages: logs.length,
        uniqueUsers: Object.keys(userStats).length,
        timeRange: hours,
        users: Object.values(userStats).sort((a, b) =>
          new Date(b.lastMessage) - new Date(a.lastMessage)
        )
      };
    } catch (error) {
      logger.error('Error calculating log stats:', error);
      throw error;
    }
  }

  /**
   * Pulisci i log più vecchi di N giorni
   */
  cleanOldLogs(daysToKeep = 30) {
    try {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000);

      const files = fs.readdirSync(this.logsDir)
        .filter(file => file.startsWith('chat-log-') && file.endsWith('.json'));

      let deletedCount = 0;
      for (const file of files) {
        const fileDate = file.match(/chat-log-(\d{4}-\d{2}-\d{2})\.json/);
        if (fileDate) {
          const fileDateTime = new Date(fileDate[1]);
          if (fileDateTime < cutoffDate) {
            fs.unlinkSync(path.join(this.logsDir, file));
            deletedCount++;
          }
        }
      }

      logger.info(`Cleaned ${deletedCount} old chat log files`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning old logs:', error);
      throw error;
    }
  }
}

export default new ChatLogService();
