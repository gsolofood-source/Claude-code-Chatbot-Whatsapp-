import express from 'express';
import conversationManager from '../services/conversationManager.js';
import chatLogService from '../services/chatLogService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /conversations
 * Ottieni tutte le conversazioni attive
 */
router.get('/', (req, res) => {
  try {
    const conversations = conversationManager.getAllConversations();

    res.json({
      success: true,
      total: conversations.length,
      conversations: conversations
    });
  } catch (error) {
    logger.error('Error getting conversations', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get conversations',
      message: error.message
    });
  }
});

/**
 * GET /conversations/:userId
 * Ottieni i messaggi di una conversazione specifica
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const conversation = conversationManager.getConversationMessages(userId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation: conversation
    });
  } catch (error) {
    logger.error(`Error getting conversation for ${req.params.userId}`, {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
      message: error.message
    });
  }
});

/**
 * GET /conversations/logs/recent
 * Ottieni i log delle chat delle ultime N ore (default: 15)
 */
router.get('/logs/recent', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 15;

    if (hours <= 0 || hours > 168) { // Max 7 giorni
      return res.status(400).json({
        success: false,
        error: 'Hours must be between 1 and 168'
      });
    }

    const logs = chatLogService.getLogsLastHours(hours);

    res.json({
      success: true,
      hours: hours,
      totalMessages: logs.length,
      logs: logs
    });
  } catch (error) {
    logger.error('Error getting recent chat logs', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get chat logs',
      message: error.message
    });
  }
});

/**
 * GET /conversations/logs/stats
 * Ottieni statistiche sui log delle ultime N ore (default: 15)
 */
router.get('/logs/stats', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 15;

    if (hours <= 0 || hours > 168) {
      return res.status(400).json({
        success: false,
        error: 'Hours must be between 1 and 168'
      });
    }

    const stats = chatLogService.getLogStats(hours);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logger.error('Error getting chat log stats', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get chat log stats',
      message: error.message
    });
  }
});

/**
 * GET /conversations/logs/user/:userId
 * Ottieni i log di un utente specifico delle ultime N ore (default: 15)
 */
router.get('/logs/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const hours = parseInt(req.query.hours) || 15;

    if (hours <= 0 || hours > 168) {
      return res.status(400).json({
        success: false,
        error: 'Hours must be between 1 and 168'
      });
    }

    const logs = chatLogService.getUserLogsLastHours(userId, hours);

    res.json({
      success: true,
      userId: userId,
      hours: hours,
      totalMessages: logs.length,
      logs: logs
    });
  } catch (error) {
    logger.error(`Error getting chat logs for user ${req.params.userId}`, {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get user chat logs',
      message: error.message
    });
  }
});

export default router;
