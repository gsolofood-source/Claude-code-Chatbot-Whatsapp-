#!/usr/bin/env node

/**
 * MCP Server for SF-IG-CHECK (Streamable HTTP Transport)
 * Implements MCP Streamable HTTP protocol (specification 2025-03-26)
 * Single /mcp endpoint for all MCP communication
 * Deployable on Railway, compatible with n8n MCP AI Agent and other HTTP clients
 * Also provides REST endpoints for backward compatibility
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

// Import services (unified business logic)
import { analyzeReputation } from '../services/reputation-service.js';
import { analyzeInstagram, inspectInstagram } from '../services/instagram-service.js';
import { analyzeWebsite } from '../services/website-service.js';
import { analyzeGMB } from '../services/gmb-service.js';
import { analyzeGlobal } from '../services/global-service.js';

// Import unified response wrapper
import { wrapSuccess, wrapError } from './response-wrapper.js';

import dotenv from 'dotenv';

// Load environment variables from .env file (for local development)
// On Railway, env vars are injected directly and this is a no-op
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const API_BEARER_TOKEN = process.env.API_BEARER_TOKEN;
const PORT = process.env.PORT || 3000;
const BIND_ADDRESS = process.env.BIND_ADDRESS || '0.0.0.0'; // 127.0.0.1 for local, 0.0.0.0 for Railway
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

// Log environment check (only show if keys exist, not the actual values)
console.log('[ENV] Environment variables status:');
console.log(`  - ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`  - GOOGLE_PLACES_API_KEY: ${GOOGLE_PLACES_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`  - API_BEARER_TOKEN: ${API_BEARER_TOKEN ? '✓ Set' : '✗ Missing'}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  - PORT: ${PORT}`);
console.log(`  - BIND_ADDRESS: ${BIND_ADDRESS}`);

// Allowed origins for CORS and DNS rebinding protection
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];

// Session management
const sessions = new Map(); // Map<sessionId, { created: timestamp, lastActivity: timestamp, state: {}, requestIds: Set, activeRequests: Map }>

// Active requests tracking for cancellation support
// Map<sessionId, Map<requestId, { abortController, promise }>>
const activeRequests = new Map();

// Create MCP server instance
const mcpServer = new Server(
  {
    name: 'sf-ig-check',
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool definitions (same as stdio server)
 */
const TOOLS = [
  {
    name: 'analyze_instagram',
    description: 'Analyze an Instagram profile with AI-powered scoring (0-100). Evaluates engagement rate, content quality, visual identity, copywriting, and originality. Requires public profile.',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'Instagram username (without @)',
        },
        verbose: {
          type: 'boolean',
          description: 'Include detailed AI feedback',
          default: false,
        },
      },
      required: ['username'],
    },
  },
  {
    name: 'analyze_website',
    description: 'Analyze a food business website with AI scoring (0-100). Evaluates menu quality, brand identity, UX, SEO, performance, CMS, compliance, and social proof.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Website URL (include https://)',
        },
        verbose: {
          type: 'boolean',
          description: 'Include detailed AI feedback',
          default: false,
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'analyze_reviews',
    description: 'Analyze Google reviews for a business with AI-powered sentiment analysis. Evaluates review quality, trends, and reputation risk.',
    inputSchema: {
      type: 'object',
      properties: {
        businessName: {
          type: 'string',
          description: 'Business name and city (e.g., "Restaurant Name, City") OR a Google Maps URL (e.g., "https://maps.app.goo.gl/xxxxx")',
        },
        placeId: {
          type: 'string',
          description: 'Optional Google Place ID for precise identification',
        },
        verbose: {
          type: 'boolean',
          description: 'Include detailed AI feedback',
          default: false,
        },
      },
      required: ['businessName'],
    },
  },
  {
    name: 'analyze_gmb',
    description: 'Analyze Google My Business completeness (0-100). Fast, rule-based analysis without AI. Checks profile photo, cover photo, description, website, phone, hours, and categories.',
    inputSchema: {
      type: 'object',
      properties: {
        businessName: {
          type: 'string',
          description: 'Business name and city (e.g., "Restaurant Name, City") OR a Google Maps URL (e.g., "https://maps.app.goo.gl/xxxxx")',
        },
        placeId: {
          type: 'string',
          description: 'Optional Google Place ID for precise identification',
        },
      },
      required: ['businessName'],
    },
  },
  {
    name: 'analyze_global',
    description: 'Complete digital presence audit with 4-pillar scoring (0-100): Reputation (40%), GMB (25%), Instagram (20%), Website (15%). Resilient: continues even if some pillars fail.',
    inputSchema: {
      type: 'object',
      properties: {
        businessName: {
          type: 'string',
          description: 'Business name and city (e.g., "Restaurant Name, City") OR a Google Maps URL (e.g., "https://maps.app.goo.gl/xxxxx"). Optional if providing instagramUsername or websiteUrl.',
        },
        instagramUsername: {
          type: 'string',
          description: 'Instagram username (optional, skip if not provided)',
        },
        websiteUrl: {
          type: 'string',
          description: 'Website URL (optional, skip if not provided)',
        },
        placeId: {
          type: 'string',
          description: 'Optional Google Place ID for precise identification',
        },
        verbose: {
          type: 'boolean',
          description: 'Include detailed AI feedback',
          default: false,
        },
      },
      required: [],  // At least one of businessName, instagramUsername, or websiteUrl required
    },
  },
  {
    name: 'inspect_instagram',
    description: 'Quick Instagram profile inspection without AI. Returns profile stats, recent posts, and engagement metrics. FREE and fast.',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'Instagram username (without @)',
        },
      },
      required: ['username'],
    },
  },
];

/**
 * Helper function to wrap service results in MCP format
 * Uses the unified response wrapper for consistent output
 */
function wrapMcpResult(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Execute tool call - Business logic
 * Supports progress notifications via progressToken
 * All responses use the unified response wrapper for consistent output to LLM agents
 */
async function executeToolCall(name, args, requestId, sessionId, progressToken) {
  // Helper to send progress updates via SSE
  const progressCallback = (message) => {
    if (progressToken && sessionId) {
      sendProgressNotification(sessionId, progressToken, null, null, message);
    }
  };

  try {
    switch (name) {
      case 'analyze_instagram': {
        const { username, verbose = false } = args;

        const result = await analyzeInstagram({
          username,
          anthropicApiKey: ANTHROPIC_API_KEY,
          verbose,
          progressCallback,
        });

        return wrapMcpResult(wrapSuccess('analyze_instagram', result));
      }

      case 'analyze_website': {
        const { url, verbose = false } = args;

        const result = await analyzeWebsite({
          url,
          anthropicApiKey: ANTHROPIC_API_KEY,
          verbose,
          progressCallback,
        });

        return wrapMcpResult(wrapSuccess('analyze_website', result));
      }

      case 'analyze_reviews': {
        const { businessName, placeId = null, verbose = false } = args;

        const result = await analyzeReputation({
          businessName,
          googleApiKey: GOOGLE_PLACES_API_KEY,
          anthropicApiKey: ANTHROPIC_API_KEY,
          placeId,
          verbose,
          progressCallback,
        });

        return wrapMcpResult(wrapSuccess('analyze_reviews', result));
      }

      case 'analyze_gmb': {
        const { businessName, placeId = null } = args;

        const result = await analyzeGMB({
          businessName,
          googleApiKey: GOOGLE_PLACES_API_KEY,
          placeId,
          progressCallback,
        });

        return wrapMcpResult(wrapSuccess('analyze_gmb', result));
      }

      case 'analyze_global': {
        const { businessName, instagramUsername = null, websiteUrl = null, placeId = null, verbose = false } = args;

        const result = await analyzeGlobal({
          businessName,
          googleApiKey: GOOGLE_PLACES_API_KEY,
          anthropicApiKey: ANTHROPIC_API_KEY,
          placeId,
          instagramUsername,
          websiteUrl,
          verbose,
          progressCallback,
        });

        return wrapMcpResult(wrapSuccess('analyze_global', result));
      }

      case 'inspect_instagram': {
        const { username } = args;

        const result = await inspectInstagram({
          username,
          progressCallback,
        });

        return wrapMcpResult(wrapSuccess('inspect_instagram', result));
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Use unified error wrapper for consistent error reporting
    return wrapMcpResult(wrapError(name, error));
  }
}

/**
 * Session management utilities
 */
function createSession() {
  const sessionId = crypto.randomUUID();
  const now = Date.now();

  sessions.set(sessionId, {
    created: now,
    lastActivity: now,
    state: {},
    requestIds: new Set(), // Track used request IDs to prevent reuse
    activeRequests: new Map(), // Track active requests for cancellation
    sseEventCounter: 0, // Counter for SSE event IDs
    sseEvents: [], // Store SSE events for resumability (limited to last 100)
  });

  console.log(`[Session] Created: ${sessionId}`);
  return sessionId;
}

function validateSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  // Check if session expired
  const now = Date.now();
  if (now - session.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(sessionId);
    console.log(`[Session] Expired: ${sessionId}`);
    return false;
  }

  // Update last activity
  session.lastActivity = now;
  return true;
}

function cleanExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Session] Cleaned ${cleaned} expired sessions`);
  }
}

// Clean expired sessions every 5 minutes
setInterval(cleanExpiredSessions, 5 * 60 * 1000);

/**
 * Send SSE event to client (if SSE connection exists)
 */
function sendSSEEvent(sessionId, data) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const eventId = `${sessionId}-${session.sseEventCounter++}`;
  const event = { id: eventId, data };

  // Store event for resumability (keep last 100)
  session.sseEvents.push(event);
  if (session.sseEvents.length > 100) {
    session.sseEvents.shift();
  }

  // Send event if SSE connection is active
  if (session.sseConnection && !session.sseConnection.writableEnded) {
    try {
      session.sseConnection.write(`id: ${eventId}\n`);
      session.sseConnection.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error(`[SSE] Error sending event to ${sessionId}:`, error.message);
    }
  }
}

/**
 * Send progress notification to client
 */
function sendProgressNotification(sessionId, progressToken, progress, total, message) {
  const notification = {
    jsonrpc: '2.0',
    method: 'notifications/progress',
    params: {
      progressToken,
      progress,
      ...(total !== undefined && { total }),
      ...(message && { message }),
    },
  };

  sendSSEEvent(sessionId, notification);
}

/**
 * JSON-RPC 2.0 utilities
 */
function createJsonRpcResponse(result, id) {
  return {
    jsonrpc: '2.0',
    result,
    id,
  };
}

function createJsonRpcError(code, message, id, data = null) {
  const error = {
    jsonrpc: '2.0',
    error: {
      code,
      message,
      ...(data && { data }),
    },
    id,
  };
  return error;
}

/**
 * Create Express HTTP server
 */
const app = express();

// Middleware
app.use(cors()); // Enable CORS for n8n
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// Origin validation middleware (DNS rebinding protection)
// MUST validate Origin header per MCP spec
function validateOrigin(req, res, next) {
  // Skip validation for health endpoint
  if (req.path === '/health') {
    return next();
  }

  const origin = req.headers.origin;

  // If no Origin header, allow (non-browser clients)
  if (!origin) {
    return next();
  }

  // Validate against allowed origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    return next();
  }

  // Check if it's a Railway deployment URL
  if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
    return next();
  }

  // Origin not allowed
  console.warn(`[Security] Rejected request from unauthorized origin: ${origin}`);
  return res.status(403).json({
    success: false,
    error: {
      message: 'Origin not allowed',
      type: 'ForbiddenError',
      origin: origin,
    },
  });
}

app.use(validateOrigin);

// Bearer token authentication middleware
function authenticateBearer(req, res, next) {
  // Skip authentication if API_BEARER_TOKEN not configured
  if (!API_BEARER_TOKEN) {
    console.warn('Warning: API_BEARER_TOKEN not set. Authentication disabled.');
    return next();
  }

  // Get Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Missing Authorization header. Use: Authorization: Bearer <token>',
        type: 'AuthenticationError',
      },
    });
  }

  // Check Bearer token format
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid Authorization scheme. Use: Authorization: Bearer <token>',
        type: 'AuthenticationError',
      },
    });
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Missing Bearer token. Use: Authorization: Bearer <token>',
        type: 'AuthenticationError',
      },
    });
  }

  // Verify token
  if (token !== API_BEARER_TOKEN) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid Bearer token',
        type: 'AuthenticationError',
      },
    });
  }

  // Token valid, proceed
  next();
}

// Health check endpoint (public, no authentication)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sf-ig-check-mcp',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    transport: 'Streamable HTTP',
    protocol: '2025-03-26',
    sessions: sessions.size,
  });
});

/**
 * MCP Streamable HTTP Endpoint
 * Single endpoint for all MCP communication (POST and GET)
 * Implements specification 2025-03-26
 */
app.post('/mcp', authenticateBearer, async (req, res) => {
  try {
    const message = req.body;
    let sessionId = req.headers['mcp-session-id']; // let instead of const (can be reassigned on initialize)
    const acceptHeader = req.headers.accept || '';

    // Validate Accept header (MUST include both application/json and text/event-stream)
    if (!acceptHeader.includes('application/json') || !acceptHeader.includes('text/event-stream')) {
      return res.status(400).json(
        createJsonRpcError(
          -32600,
          'Invalid Request: Accept header must include both application/json and text/event-stream',
          null
        )
      );
    }

    // Support batch messages (MUST support receiving batches per spec)
    const messages = Array.isArray(message) ? message : [message];
    const responses = [];
    let hasRequests = false; // Track if we have requests (messages with id)

    for (const msg of messages) {
      // Validate JSON-RPC 2.0 format
      if (!msg || typeof msg !== 'object') {
        return res.status(400).json(
          createJsonRpcError(-32700, 'Parse error: Invalid JSON', null)
        );
      }

      if (msg.jsonrpc !== '2.0') {
        return res.status(400).json(
          createJsonRpcError(-32600, 'Invalid Request: jsonrpc must be "2.0"', msg.id || null)
        );
      }

      // Validate Request ID (MUST NOT be null per spec)
      if ('id' in msg) {
        hasRequests = true;

        if (msg.id === null) {
          return res.status(400).json(
            createJsonRpcError(-32600, 'Invalid Request: id must not be null', null)
          );
        }

        // Validate session and check for ID reuse (except for initialize)
        if (msg.method !== 'initialize') {
          if (!validateSession(sessionId)) {
            return res.status(404).json(
              createJsonRpcError(-32000, 'Invalid or expired session ID', msg.id)
            );
          }

          const session = sessions.get(sessionId);

          // Check for request ID reuse
          if (session.requestIds.has(msg.id)) {
            return res.status(400).json(
              createJsonRpcError(
                -32600,
                `Invalid Request: request ID ${msg.id} has already been used in this session`,
                msg.id
              )
            );
          }

          // Track this request ID
          session.requestIds.add(msg.id);
        }
      }

      // Process single message
      const response = await processSingleMessage(msg, sessionId);

      // Check if initialize created a new session
      if (msg._sessionId) {
        sessionId = msg._sessionId;
      }

      if (response) {
        responses.push(response);
      }
    }

    // Set session ID header on all responses (including initialize)
    if (sessionId) {
      res.setHeader('Mcp-Session-Id', sessionId);
    }

    // Return appropriate response
    if (responses.length === 0) {
      // Only notifications/responses - return 202 Accepted
      return res.status(202).send();
    }

    // Return single response or batch
    const finalResponse = Array.isArray(message) ? responses : responses[0];
    return res.json(finalResponse);
  } catch (error) {
    console.error('[MCP] Error processing request:', error);

    const errorResponse = createJsonRpcError(
      -32603,
      'Internal error',
      req.body?.id || null,
      {
        message: error.message,
        type: error.constructor.name,
      }
    );

    res.status(500).json(errorResponse);
  }
});

/**
 * Process a single JSON-RPC message
 * Returns response object or null (for notifications)
 */
async function processSingleMessage(message, currentSessionId) {
  const { method, params, id } = message;

  try {
    switch (method) {
      case 'initialize': {
        // Create new session
        const newSessionId = createSession();

        // Store session ID to set header later
        message._sessionId = newSessionId;

        return createJsonRpcResponse(
          {
            protocolVersion: '2025-03-26',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'sf-ig-check',
              version: '3.0.0',
            },
          },
          id
        );
      }

      case 'ping': {
        // Ping must respond promptly with empty result
        return createJsonRpcResponse({}, id);
      }

      case 'tools/list': {
        return createJsonRpcResponse({ tools: TOOLS }, id);
      }

      case 'tools/call': {
        const { name, arguments: args } = params || {};

        if (!name) {
          return createJsonRpcError(-32602, 'Invalid params: missing tool name', id);
        }

        // Extract progress token from _meta if present
        const progressToken = message._meta?.progressToken;

        // Check if request was cancelled
        const session = sessions.get(currentSessionId);
        if (session?.activeRequests.has(id)?.cancelled) {
          console.log(`[Cancellation] Request ${id} was cancelled before execution`);
          return null; // Don't send response for cancelled requests
        }

        // Track active request
        if (session) {
          session.activeRequests.set(id, { cancelled: false, startTime: Date.now() });
        }

        try {
          // Execute tool with progress support
          const result = await executeToolCall(name, args || {}, id, currentSessionId, progressToken);

          // Check again if cancelled during execution
          if (session?.activeRequests.get(id)?.cancelled) {
            console.log(`[Cancellation] Request ${id} was cancelled during execution`);
            session.activeRequests.delete(id);
            return null; // Don't send response
          }

          // Clean up active request
          if (session) {
            session.activeRequests.delete(id);
          }

          return createJsonRpcResponse(result, id);
        } catch (error) {
          // Clean up active request
          if (session) {
            session.activeRequests.delete(id);
          }
          throw error;
        }
      }

      case 'notifications/cancelled': {
        // Handle cancellation notification
        const { requestId, reason } = params || {};

        if (!requestId) {
          console.warn('[Cancellation] Received cancelled notification without requestId');
          return null;
        }

        const session = sessions.get(currentSessionId);
        if (session?.activeRequests.has(requestId)) {
          console.log(`[Cancellation] Cancelling request ${requestId}: ${reason || 'No reason provided'}`);
          session.activeRequests.get(requestId).cancelled = true;
        } else {
          console.warn(`[Cancellation] Request ${requestId} not found or already completed`);
        }

        // Notifications don't require response
        return null;
      }

      case 'notifications/progress': {
        // Progress notifications from client (rare, but allowed)
        const { progressToken, progress, total } = params || {};
        console.log(`[Progress] Client progress: token=${progressToken}, progress=${progress}, total=${total}`);
        return null;
      }

      case 'notifications/message': {
        // Message notification from client
        const { message: msg } = params || {};
        console.log(`[Notification] Client message: ${msg}`);
        return null;
      }

      default: {
        return createJsonRpcError(-32601, `Method not found: ${method}`, id || null);
      }
    }
  } catch (error) {
    console.error('[MCP] Error processing message:', error);
    return createJsonRpcError(
      -32603,
      'Internal error',
      id || null,
      {
        message: error.message,
        type: error.constructor.name,
      }
    );
  }
}

/**
 * GET /mcp - SSE stream for server-initiated messages
 * Opens SSE stream on existing session for bidirectional communication
 * Per MCP spec 2025-03-26
 */
app.get('/mcp', authenticateBearer, (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const acceptHeader = req.headers.accept || '';
  const lastEventId = req.headers['last-event-id'];

  // Validate Accept header (MUST include text/event-stream, return 405 if not)
  if (!acceptHeader.includes('text/event-stream')) {
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method Not Allowed: GET /mcp requires Accept: text/event-stream',
        type: 'MethodNotAllowedError',
      },
    });
  }

  // Session ID is REQUIRED for GET (no auto-creation)
  if (!sessionId) {
    return res.status(400).json(
      createJsonRpcError(-32000, 'Bad Request: Mcp-Session-Id header required', null)
    );
  }

  // Validate session exists and is not expired
  if (!validateSession(sessionId)) {
    return res.status(404).json(
      createJsonRpcError(-32000, 'Invalid or expired session ID', null)
    );
  }

  const session = sessions.get(sessionId);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.setHeader('Mcp-Session-Id', sessionId);

  console.log(`[SSE] Client connected: ${sessionId}${lastEventId ? ` (resuming from event ${lastEventId})` : ''}`);

  // If resuming, replay messages after lastEventId
  if (lastEventId && session.sseEvents) {
    const lastEventIndex = session.sseEvents.findIndex(evt => evt.id === lastEventId);
    if (lastEventIndex >= 0) {
      const eventsToReplay = session.sseEvents.slice(lastEventIndex + 1);
      console.log(`[SSE] Replaying ${eventsToReplay.length} events after ${lastEventId}`);

      for (const evt of eventsToReplay) {
        res.write(`id: ${evt.id}\n`);
        res.write(`data: ${JSON.stringify(evt.data)}\n\n`);
      }
    }
  }

  // Store SSE connection in session for server-initiated messages
  session.sseConnection = res;

  // Keep-alive ping every 30 seconds
  const keepAliveInterval = setInterval(() => {
    if (!res.writableEnded) {
      res.write(`:keepalive\n\n`);
    } else {
      clearInterval(keepAliveInterval);
    }
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    console.log(`[SSE] Client disconnected: ${sessionId}`);
    clearInterval(keepAliveInterval);

    // Remove SSE connection from session
    if (session.sseConnection === res) {
      delete session.sseConnection;
    }

    // Note: We don't delete the session here because client might reconnect
    // Sessions expire after SESSION_TIMEOUT of inactivity
  });

  req.on('error', (error) => {
    console.error(`[SSE] Connection error for session ${sessionId}:`, error.message);
    clearInterval(keepAliveInterval);

    if (session.sseConnection === res) {
      delete session.sseConnection;
    }
  });
});

/**
 * DELETE /mcp - Terminate session
 * Allows client to explicitly terminate a session
 * Per MCP spec 2025-03-26
 */
app.delete('/mcp', authenticateBearer, (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Bad Request: Mcp-Session-Id header required',
        type: 'BadRequestError',
      },
    });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Session not found or already terminated',
        type: 'NotFoundError',
      },
    });
  }

  // Close SSE connection if exists
  if (session.sseConnection && !session.sseConnection.writableEnded) {
    session.sseConnection.end();
  }

  // Delete session
  sessions.delete(sessionId);
  console.log(`[Session] Terminated by client: ${sessionId}`);

  // Return 204 No Content
  res.status(204).send();
});

// List available tools (REST endpoint for compatibility)
app.get('/tools', authenticateBearer, (req, res) => {
  res.json({
    tools: TOOLS,
  });
});

// Convenience REST endpoints (easier for non-MCP clients)
// All endpoints use unified response wrapper for consistent output

app.post('/api/analyze/instagram', authenticateBearer, async (req, res) => {
  // executeToolCall now handles errors internally and returns wrapped response
  const result = await executeToolCall('analyze_instagram', req.body);
  res.json(result);
});

app.post('/api/analyze/website', authenticateBearer, async (req, res) => {
  const result = await executeToolCall('analyze_website', req.body);
  res.json(result);
});

app.post('/api/analyze/reviews', authenticateBearer, async (req, res) => {
  const result = await executeToolCall('analyze_reviews', req.body);
  res.json(result);
});

app.post('/api/analyze/gmb', authenticateBearer, async (req, res) => {
  const result = await executeToolCall('analyze_gmb', req.body);
  res.json(result);
});

app.post('/api/analyze/global', authenticateBearer, async (req, res) => {
  const result = await executeToolCall('analyze_global', req.body);
  res.json(result);
});

app.post('/api/inspect/instagram', authenticateBearer, async (req, res) => {
  const result = await executeToolCall('inspect_instagram', req.body);
  res.json(result);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint not found: ${req.method} ${req.path}`,
      type: 'NotFoundError',
      hint: 'Available endpoints: POST /mcp (MCP Streamable HTTP), GET /health, GET /tools, POST /api/analyze/*',
    },
  });
});

/**
 * Start HTTP server
 */
async function main() {
  app.listen(PORT, BIND_ADDRESS, () => {
    console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
    console.log(`║  SF-IG-CHECK MCP Server (Streamable HTTP)                      ║`);
    console.log(`╠════════════════════════════════════════════════════════════════╣`);
    console.log(`║  Version: 3.0.0                                                ║`);
    console.log(`║  Protocol: MCP Streamable HTTP (2025-03-26)                    ║`);
    console.log(`║  Address: ${BIND_ADDRESS}:${PORT}                                           ║`);
    console.log(`╠════════════════════════════════════════════════════════════════╣`);
    console.log(`║  Endpoints:                                                    ║`);
    console.log(`║    POST   /mcp            - MCP Streamable HTTP endpoint       ║`);
    console.log(`║    GET    /mcp            - SSE stream for server messages     ║`);
    console.log(`║    DELETE /mcp            - Terminate session                  ║`);
    console.log(`║    GET    /health         - Health check (public)              ║`);
    console.log(`║    GET    /tools          - List tools (requires auth)         ║`);
    console.log(`║    POST   /api/analyze/*  - REST endpoints (requires auth)     ║`);
    console.log(`╠════════════════════════════════════════════════════════════════╣`);
    console.log(`║  Features:                                                     ║`);
    console.log(`║    ✓ Ping/pong support                                         ║`);
    console.log(`║    ✓ Request cancellation                                      ║`);
    console.log(`║    ✓ Progress notifications                                    ║`);
    console.log(`║    ✓ Batch message support                                     ║`);
    console.log(`║    ✓ SSE resumability                                          ║`);
    console.log(`║    ✓ Origin validation (DNS rebinding protection)             ║`);
    console.log(`╠════════════════════════════════════════════════════════════════╣`);
    console.log(`║  Authentication: Bearer Token                                  ║`);
    console.log(`║  Header: Authorization: Bearer <token>                         ║`);
    console.log(`║  Session Timeout: ${SESSION_TIMEOUT / 60000} minutes                                ║`);
    console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

    if (!API_BEARER_TOKEN) {
      console.warn('⚠️  WARNING: API_BEARER_TOKEN not set! Authentication is disabled.');
      console.warn('⚠️  Set API_BEARER_TOKEN environment variable to enable authentication.\n');
    }

    if (BIND_ADDRESS === '0.0.0.0') {
      console.log('🌐 Server accessible from all network interfaces (deployment mode)');
    } else if (BIND_ADDRESS === '127.0.0.1') {
      console.log('🔒 Server bound to localhost only (local development mode)');
    }
    console.log('');
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
