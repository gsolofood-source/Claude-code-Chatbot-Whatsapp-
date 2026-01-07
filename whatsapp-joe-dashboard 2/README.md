# WhatsApp Joe Bot - Dashboard

A modern Next.js 14 dashboard for monitoring and managing your WhatsApp Joe Bastianich bot.

![Dashboard Preview](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

## Features

### 📊 Analytics Dashboard
- Real-time message statistics
- Active user tracking
- Response time monitoring
- API cost tracking
- 24-hour activity timeline
- System health status

### 💬 Conversations Manager
- View all WhatsApp conversations
- Filter by status (active/completed)
- Search conversations
- View message history
- Real-time conversation status

### ⚙️ Settings Control
- **General Settings**
  - Bot on/off control
  - Audio responses toggle
  - Business hours configuration

- **Personality Settings**
  - Conversation tone (friendly, professional, tough)
  - Response verbosity control

- **Automation**
  - Auto-reply configuration
  - Welcome messages
  - Away messages

- **Notifications**
  - Email alerts
  - Error notifications
  - Daily summaries

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Install dependencies:

```bash
cd whatsapp-joe-dashboard
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
whatsapp-joe-dashboard/
├── app/
│   ├── (dashboard)/          # Dashboard pages with layout
│   │   ├── page.tsx          # Analytics dashboard
│   │   ├── conversations/    # Conversations manager
│   │   └── settings/         # Settings page
│   ├── api/                  # API routes
│   │   ├── stats/            # GET /api/stats
│   │   ├── conversations/    # GET /api/conversations
│   │   └── config/           # GET/POST /api/config
│   ├── globals.css           # Global styles
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── switch.tsx
│   │   └── tabs.tsx
│   ├── sidebar.tsx           # Navigation sidebar
│   ├── stat-card.tsx         # Statistics card component
│   ├── message-timeline.tsx  # Activity chart
│   └── conversation-list.tsx # Conversation list
├── lib/
│   ├── utils.ts              # Utility functions (cn)
│   └── mock-data.ts          # Mock data for development
└── package.json
```

## API Routes

### GET /api/stats
Returns dashboard statistics and timeline data.

```typescript
{
  stats: {
    totalMessages: number,
    activeUsers: number,
    avgResponseTime: string,
    apiCosts: string,
    trends: { ... }
  },
  timeline: Array<{ time: string, messages: number }>,
  timestamp: string
}
```

### GET /api/conversations
Returns list of conversations with optional filters.

Query parameters:
- `status`: Filter by status (active/completed)
- `unread`: Filter unread only (true/false)

```typescript
{
  conversations: Array<Conversation>,
  total: number,
  timestamp: string
}
```

### GET /api/conversations/[id]
Returns specific conversation with message history.

```typescript
{
  conversation: Conversation,
  messages: Array<Message>,
  timestamp: string
}
```

### GET /api/config
Returns current bot configuration.

### POST /api/config
Updates bot configuration.

```typescript
// Request body
{
  config: {
    botEnabled: boolean,
    audioEnabled: boolean,
    businessHours: { ... },
    autoReply: { ... },
    personality: { ... },
    notifications: { ... }
  }
}
```

## Mock Data

Currently, the dashboard uses mock data defined in `lib/mock-data.ts`. This includes:

- **mockStats**: Dashboard statistics
- **mockTimelineData**: 24-hour message activity
- **mockConversations**: Sample conversations
- **mockConversationMessages**: Sample messages
- **mockRecentActivity**: Recent events
- **mockSettings**: Bot configuration

## Integration with Backend

To integrate with your actual WhatsApp bot backend:

1. **Update API Routes**: Replace mock data with real database queries or API calls to your backend
2. **Add Authentication**: Implement authentication (NextAuth.js recommended)
3. **Real-time Updates**: Add WebSocket or Server-Sent Events for live updates
4. **Database**: Connect to your backend's database (PostgreSQL, MongoDB, etc.)

### Example Integration

```typescript
// app/api/stats/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Replace with actual backend call
  const response = await fetch('https://your-railway-app.railway.app/api/stats');
  const data = await response.json();

  return NextResponse.json(data);
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will auto-detect Next.js and deploy

### Deploy to Railway

```bash
railway login
railway init
railway up
```

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod
```

## Environment Variables

Create a `.env.local` file for local development:

```env
# Backend API URL (for production integration)
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app

# Optional: NextAuth.js configuration
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

## Customization

### Adding New Pages

1. Create a new page in `app/(dashboard)/your-page/page.tsx`
2. Add the route to `components/sidebar.tsx` navigation array

### Adding New API Routes

1. Create a new route handler in `app/api/your-route/route.ts`
2. Implement GET/POST handlers as needed

### Styling

The dashboard uses Tailwind CSS with Shadcn/ui design tokens. Customize in:
- `tailwind.config.ts`: Theme configuration
- `app/globals.css`: Global styles and CSS variables

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Component Library

Shadcn/ui components are located in `components/ui/`. To add more components:

```bash
npx shadcn-ui@latest add [component-name]
```

## Future Enhancements

- [ ] Real-time message updates with WebSockets
- [ ] User authentication and role-based access
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Export reports (PDF/CSV)
- [ ] Advanced analytics (sentiment analysis)
- [ ] A/B testing framework
- [ ] Multi-language support
- [ ] Mobile responsive improvements
- [ ] Dark mode toggle
- [ ] Conversation notes and tags

## License

MIT License - feel free to use for your projects!

## Support

For issues or questions:
1. Check the mock data in `lib/mock-data.ts`
2. Review API routes in `app/api/`
3. Open an issue on GitHub

---

**Built with ❤️ for WhatsApp Joe Bastianich Bot**
