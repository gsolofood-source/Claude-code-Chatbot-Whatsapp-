# Integration Guide: Connecting Dashboard to WhatsApp Bot Backend

This guide shows how to integrate the Next.js dashboard with your production WhatsApp bot running on Railway.

## Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│   Next.js Dashboard │ ◄─────► │ WhatsApp Bot Backend │ ◄─────► │  WhatsApp API   │
│   (Vercel/Railway)  │  HTTP   │     (Railway)        │  HTTPS  │  (Meta Graph)   │
└─────────────────────┘         └──────────────────────┘         └─────────────────┘
         │                                  │
         │                                  │
         ▼                                  ▼
   ┌──────────┐                      ┌──────────┐
   │ Optional │                      │ Database │
   │ Database │                      │ (Future) │
   └──────────┘                      └──────────┘
```

## Step 1: Add Stats Endpoint to Backend

Add these endpoints to your WhatsApp bot backend:

### `src/routes/stats.js` (NEW FILE)

```javascript
import express from 'express';
import deduplicationService from '../services/deduplicationService.js';
import userQueueService from '../services/userQueueService.js';

const router = express.Router();

// GET /api/stats - Return dashboard statistics
router.get('/', async (req, res) => {
  try {
    const dedupStats = deduplicationService.getStats();

    // You'll need to track these in your application
    // For now, we'll return mock data or basic stats
    const stats = {
      totalMessages: dedupStats.hits + dedupStats.misses,
      activeUsers: 0, // TODO: Track unique users
      avgResponseTime: "4.2s", // TODO: Calculate from actual timings
      apiCosts: "$0.00", // TODO: Track API costs
      trends: {
        messages: { value: 0, isPositive: true },
        users: { value: 0, isPositive: true },
        responseTime: { value: 0, isPositive: true },
        costs: { value: 0, isPositive: false },
      },
    };

    const timeline = generateTimeline(); // Helper function below

    res.json({
      stats,
      timeline,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to generate 24h timeline
function generateTimeline() {
  const now = new Date();
  const timeline = [];

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now - i * 60 * 60 * 1000);
    timeline.push({
      time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      messages: 0, // TODO: Track actual message counts per hour
    });
  }

  return timeline;
}

export default router;
```

### Update `src/server.js`

```javascript
// Add this import
import statsRouter from './routes/stats.js';

// Add this route
app.use('/api/stats', statsRouter);
```

## Step 2: Track Metrics in Your Bot

### Create `src/services/metricsService.js` (NEW FILE)

```javascript
import logger from '../utils/logger.js';

class MetricsService {
  constructor() {
    this.hourlyMessages = new Map(); // Hour -> count
    this.uniqueUsers = new Set();
    this.responseTimes = [];
    this.apiCosts = { openai: 0, elevenlabs: 0 };

    // Reset metrics every hour
    setInterval(() => this.rotateHourlyMetrics(), 60 * 60 * 1000);
  }

  recordMessage(userId, responseTime) {
    const hour = new Date().getHours();
    const current = this.hourlyMessages.get(hour) || 0;
    this.hourlyMessages.set(hour, current + 1);

    this.uniqueUsers.add(userId);
    this.responseTimes.push(responseTime);

    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  recordAPICost(service, cost) {
    this.apiCosts[service] += cost;
  }

  getStats() {
    const avgResponseTime = this.responseTimes.length > 0
      ? (this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length / 1000).toFixed(1)
      : 0;

    return {
      totalMessages: Array.from(this.hourlyMessages.values()).reduce((a, b) => a + b, 0),
      activeUsers: this.uniqueUsers.size,
      avgResponseTime: `${avgResponseTime}s`,
      apiCosts: `$${(this.apiCosts.openai + this.apiCosts.elevenlabs).toFixed(2)}`,
    };
  }

  getTimeline() {
    const timeline = [];
    for (let i = 0; i < 24; i++) {
      const hour = (new Date().getHours() - (23 - i) + 24) % 24;
      timeline.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        messages: this.hourlyMessages.get(hour) || 0,
      });
    }
    return timeline;
  }

  rotateHourlyMetrics() {
    const oldestHour = (new Date().getHours() - 23 + 24) % 24;
    this.hourlyMessages.delete(oldestHour);
  }
}

export default new MetricsService();
```

### Update `src/handlers/messageHandler.js`

```javascript
// Add import
import metricsService from '../services/metricsService.js';

// In handleIncomingMessage, track metrics
async handleIncomingMessage(message) {
  const startTime = Date.now();

  try {
    // ... existing message handling code ...

    const responseTime = Date.now() - startTime;
    metricsService.recordMessage(message.from, responseTime);

  } catch (error) {
    // ... error handling ...
  }
}
```

## Step 3: Update Dashboard Environment Variables

Create `.env.local` in your dashboard:

```env
# Production backend URL (your Railway app)
NEXT_PUBLIC_API_URL=https://whatsapp-joe-bot-production.up.railway.app

# Optional: Add API key for authentication
NEXT_PUBLIC_API_KEY=your-secure-api-key
```

## Step 4: Update Dashboard API Routes

### Update `app/api/stats/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${apiUrl}/api/stats`, {
      headers: {
        "Content-Type": "application/json",
        // Optional: Add API key authentication
        // "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
      },
      // Cache for 30 seconds
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stats from backend");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching stats:", error);

    // Fallback to mock data if backend is unavailable
    const { mockStats, mockTimelineData } = await import("@/lib/mock-data");
    return NextResponse.json({
      stats: mockStats,
      timeline: mockTimelineData,
      timestamp: new Date().toISOString(),
      error: "Using mock data - backend unavailable",
    });
  }
}
```

## Step 5: Add Authentication (Optional but Recommended)

### Backend: Add API Key Middleware

```javascript
// src/middleware/apiKeyAuth.js
export function verifyApiKey(req, res, next) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');

  if (!apiKey || apiKey !== process.env.DASHBOARD_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
```

```javascript
// src/routes/stats.js
import { verifyApiKey } from '../middleware/apiKeyAuth.js';

router.get('/', verifyApiKey, async (req, res) => {
  // ... stats logic ...
});
```

### Add to `.env` on Railway

```env
DASHBOARD_API_KEY=generate-a-secure-random-key-here
```

## Step 6: Real-time Updates (Advanced)

For real-time dashboard updates, add WebSocket support:

### Backend: Add Socket.io

```bash
npm install socket.io
```

```javascript
// src/server.js
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.DASHBOARD_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Emit stats every 5 seconds
setInterval(() => {
  const stats = metricsService.getStats();
  io.emit('stats:update', stats);
}, 5000);

// Use httpServer instead of app
httpServer.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});
```

### Dashboard: Add Socket.io Client

```bash
npm install socket.io-client
```

```typescript
// app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function DashboardPage() {
  const [stats, setStats] = useState(mockStats);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");

    socket.on("stats:update", (newStats) => {
      setStats(newStats);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ... rest of component ...
}
```

## Step 7: Database Integration (Future)

For persistent metrics, add a database:

### Option 1: PostgreSQL on Railway

```bash
# Add PostgreSQL to your Railway project
railway add postgresql

# Install pg driver
npm install pg
```

```javascript
// src/config/database.js
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create tables
export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS metrics (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT NOW(),
      total_messages INTEGER,
      active_users INTEGER,
      avg_response_time FLOAT,
      api_costs FLOAT
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255),
      user_name VARCHAR(255),
      last_message TEXT,
      timestamp TIMESTAMP,
      status VARCHAR(50),
      unread BOOLEAN
    );
  `);
}
```

### Option 2: MongoDB Atlas

```bash
npm install mongodb
```

```javascript
// src/config/database.js
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectDB() {
  await client.connect();
  return client.db('whatsapp-joe-bot');
}
```

## Testing the Integration

1. **Start backend**: `railway up` (or local: `node src/server.js`)
2. **Start dashboard**: `npm run dev`
3. **Send test message** to WhatsApp bot
4. **Check dashboard**: Should see updated metrics

### Debugging

```bash
# Check backend logs
railway logs

# Check if stats endpoint works
curl https://your-railway-app.railway.app/api/stats

# Check dashboard API route
curl http://localhost:3000/api/stats
```

## Deployment Checklist

- [ ] Backend `/api/stats` endpoint implemented
- [ ] Metrics tracking in messageHandler
- [ ] Environment variables set on Railway
- [ ] Dashboard API routes updated
- [ ] CORS configured correctly
- [ ] API key authentication (optional)
- [ ] Dashboard deployed to Vercel/Railway
- [ ] Real-time updates working (if implemented)
- [ ] Database initialized (if using)

## Next Steps

1. **Add Conversation Storage**: Save all conversations to database
2. **User Analytics**: Track user engagement patterns
3. **Cost Tracking**: Calculate actual OpenAI/ElevenLabs costs
4. **Alerts**: Set up email/Slack notifications for errors
5. **Export Reports**: Generate PDF/CSV reports
6. **A/B Testing**: Test different bot personalities

---

**Need help?** Check the [README.md](README.md) for dashboard setup or the main bot's `PRODUCTION_HARDENING.md` for backend configuration.
