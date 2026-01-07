import express from 'express';
import webhookRouter from './webhook.js';
import callsRouter from './calls.js';
import conversationsRouter from './conversations.js';
import conversationManager from '../services/conversationManager.js';

const router = express.Router();

// Webhook di WhatsApp
router.use('/webhook', webhookRouter);

// Voice calls API
router.use('/calls', callsRouter);

// Conversations API
router.use('/conversations', conversationsRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
router.get('/stats', (req, res) => {
  const stats = conversationManager.getStats();
  const conversations = conversationManager.getAllConversations();

  res.json({
    ...stats,
    conversations: conversations,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;
