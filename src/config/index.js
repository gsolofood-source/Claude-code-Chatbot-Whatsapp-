import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // WhatsApp Business API
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: 'v21.0',
    apiBaseUrl: 'https://graph.facebook.com'
  },

  // ElevenLabs
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    agentId: process.env.ELEVENLABS_AGENT_ID,
    apiBaseUrl: 'https://api.elevenlabs.io/v1'
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    assistantId: process.env.OPENAI_ASSISTANT_ID
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // Conversazione
  conversation: {
    timeoutMinutes: 30, // Dopo 30 minuti di inattività, reset della conversazione
    maxMessagesInContext: 10 // Mantieni gli ultimi 10 messaggi per contesto
  }
};

// Validazione configurazione critica
const requiredEnvVars = [
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_VERIFY_TOKEN',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_AGENT_ID',
  'OPENAI_API_KEY',
  'OPENAI_ASSISTANT_ID'
];

export function validateConfig() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
