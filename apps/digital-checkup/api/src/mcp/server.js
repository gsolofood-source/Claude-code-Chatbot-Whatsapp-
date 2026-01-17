#!/usr/bin/env node

/**
 * MCP Server for SF-IG-CHECK
 * Exposes Instagram, Website, Reputation, GMB, and Global analysis tools via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import services (unified business logic)
import { analyzeReputation } from '../services/reputation-service.js';
import { analyzeInstagram, inspectInstagram } from '../services/instagram-service.js';
import { analyzeWebsite } from '../services/website-service.js';
import { analyzeGMB } from '../services/gmb-service.js';
import { analyzeGlobal } from '../services/global-service.js';

// Import unified response wrapper
import { wrapSuccess, wrapError } from './response-wrapper.js';

import dotenv from 'dotenv';

// Load environment variables (quiet mode for MCP stdio compatibility)
dotenv.config({ quiet: true });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Create MCP server
const server = new Server(
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
 * Helper function to wrap service results in MCP SDK format
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
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
        description: 'Analyze restaurant reputation from Google reviews with AI sentiment analysis (0-100). Evaluates rating quality, trends, volume, recency, owner response rate, and sentiment.',
        inputSchema: {
          type: 'object',
          properties: {
            businessName: {
              type: 'string',
              description: 'Restaurant name and city (e.g., "Verderame, Firenze") OR a Google Maps URL (e.g., "https://maps.app.goo.gl/xxxxx")',
            },
            placeId: {
              type: 'string',
              description: 'Google Place ID for precise identification (optional)',
            },
            verbose: {
              type: 'boolean',
              description: 'Include detailed sentiment themes',
              default: false,
            },
          },
          required: ['businessName'],
        },
      },
      {
        name: 'analyze_gmb',
        description: 'Analyze Google My Business profile completeness (0-100). FREE tool that evaluates basic info, photos, hours, attributes, and engagement features. No AI cost.',
        inputSchema: {
          type: 'object',
          properties: {
            businessName: {
              type: 'string',
              description: 'Business name and city (e.g., "Verderame, Firenze") OR a Google Maps URL (e.g., "https://maps.app.goo.gl/xxxxx")',
            },
            placeId: {
              type: 'string',
              description: 'Google Place ID for precise identification (optional)',
            },
          },
          required: ['businessName'],
        },
      },
      {
        name: 'analyze_global',
        description: 'Complete digital presence analysis across 4 pillars: Reputation (40%), GMB (25%), Instagram (20%), Website (15%). Resilient: continues even if some pillars fail.',
        inputSchema: {
          type: 'object',
          properties: {
            businessName: {
              type: 'string',
              description: 'Business name/city (e.g., "Verderame, Firenze") OR a Google Maps URL. Optional if providing instagramUsername or websiteUrl.',
            },
            instagramUsername: {
              type: 'string',
              description: 'Instagram username (optional, without @)',
            },
            websiteUrl: {
              type: 'string',
              description: 'Website URL (optional, include https://)',
            },
            placeId: {
              type: 'string',
              description: 'Google Place ID for precise identification (optional)',
            },
            verbose: {
              type: 'boolean',
              description: 'Include detailed AI feedback for all pillars',
              default: false,
            },
          },
          required: [],
        },
      },
      {
        name: 'inspect_instagram',
        description: 'Quick Instagram profile inspection without AI analysis. FREE tool that shows profile stats, recent posts, and content mix. No API cost.',
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
    ],
  };
});

/**
 * Handle tool calls
 * All responses use the unified response wrapper for consistent output to LLM agents
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'analyze_instagram': {
        const { username, verbose = false } = args;

        const result = await analyzeInstagram({
          username,
          anthropicApiKey: ANTHROPIC_API_KEY,
          verbose,
        });

        return wrapMcpResult(wrapSuccess('analyze_instagram', result));
      }

      case 'analyze_website': {
        const { url, verbose = false } = args;

        const result = await analyzeWebsite({
          url,
          anthropicApiKey: ANTHROPIC_API_KEY,
          verbose,
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
        });

        return wrapMcpResult(wrapSuccess('analyze_reviews', result));
      }

      case 'analyze_gmb': {
        const { businessName, placeId = null } = args;

        const result = await analyzeGMB({
          businessName,
          googleApiKey: GOOGLE_PLACES_API_KEY,
          placeId,
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
        });

        return wrapMcpResult(wrapSuccess('analyze_global', result));
      }

      case 'inspect_instagram': {
        const { username } = args;

        const result = await inspectInstagram({
          username,
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
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SF-IG-CHECK MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
