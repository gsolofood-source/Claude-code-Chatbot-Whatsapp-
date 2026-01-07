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

// Debug endpoint - verifica configurazione webhook
router.get('/debug/webhook-config', (req, res) => {
  res.json({
    verify_token_configured: !!process.env.WHATSAPP_VERIFY_TOKEN,
    verify_token_length: process.env.WHATSAPP_VERIFY_TOKEN?.length || 0,
    verify_token_first_chars: process.env.WHATSAPP_VERIFY_TOKEN?.substring(0, 8) || 'NOT_SET',
    node_env: process.env.NODE_ENV,
    railway_env: process.env.RAILWAY_ENVIRONMENT || 'not_railway'
  });
});

export default router;
