import express from 'express';
import conversationManager from '../services/conversationManager.js';
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

export default router;
