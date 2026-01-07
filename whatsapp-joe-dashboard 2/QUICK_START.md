# Quick Start Guide

Get your WhatsApp Joe Bot Dashboard running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- npm or yarn

## 1. Install Dependencies

```bash
cd whatsapp-joe-dashboard
npm install
```

## 2. Start Development Server

```bash
npm run dev
```

## 3. Open Dashboard

Navigate to [http://localhost:3000](http://localhost:3000)

You should see:
- ✅ **Dashboard** page with analytics and charts
- ✅ **Conversations** page with message list
- ✅ **Settings** page with bot configuration

## Current Features (Mock Data)

The dashboard is currently using mock data from `lib/mock-data.ts`. This means:

- All statistics are simulated
- Conversations are sample data
- Settings changes won't persist
- No real backend connection yet

## What You See

### Dashboard Page (/)
- 📊 Total Messages: 1,247
- 👥 Active Users: 89
- ⏱️ Avg Response Time: 4.2s
- 💰 API Costs: $12.45
- 📈 24-hour activity chart
- 🔔 Recent activity feed
- 💚 System health status

### Conversations Page (/conversations)
- 5 sample conversations
- Search functionality
- Filter by unread
- Message history viewer
- User info display

### Settings Page (/settings)
- Bot on/off toggle
- Audio responses control
- Business hours configuration
- Personality settings
- Auto-reply messages
- Notification preferences

## Next Steps

### Option 1: Use Mock Data (Current)
Perfect for:
- Testing the UI
- Demonstrating to stakeholders
- Frontend development
- Design iterations

Just keep using as-is!

### Option 2: Connect to Real Backend
To connect to your production WhatsApp bot:

1. Read [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
2. Add stats endpoints to your backend
3. Update `.env.local` with backend URL
4. Update API routes to fetch real data

### Option 3: Add Database
For persistent data:

1. Choose database (PostgreSQL, MongoDB)
2. Set up on Railway
3. Create tables/collections
4. Update API routes to query DB

## Troubleshooting

### Port 3000 Already in Use

```bash
# Use different port
npm run dev -- -p 3001
```

### TypeScript Errors

```bash
# Rebuild types
npm run build
```

### Dependencies Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Hot Reload
The dashboard has hot reload enabled - just save files and see changes instantly!

### Mock Data Location
All sample data is in `lib/mock-data.ts` - edit this to customize examples.

### Adding New Components
```bash
# Shadcn/ui has many more components available
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
```

### Customize Colors
Edit `app/globals.css` to change theme colors.

## Build for Production

```bash
npm run build
npm run start
```

## Deploy

### Vercel (Easiest)
1. Push to GitHub
2. Import in Vercel
3. Deploy automatically

### Railway
```bash
railway login
railway init
railway up
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

## File Structure Quick Reference

```
app/
  (dashboard)/
    page.tsx           ← Dashboard home
    conversations/     ← Conversations page
    settings/          ← Settings page
  api/                 ← API routes

components/
  ui/                  ← Shadcn components
  sidebar.tsx          ← Navigation
  stat-card.tsx        ← Metric cards

lib/
  mock-data.ts         ← Sample data
  utils.ts             ← Utilities
```

## Support

- 📖 Full documentation: [README.md](README.md)
- 🔗 Backend integration: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- 🐛 Issues: Check console logs and Network tab

---

**You're all set! Enjoy your WhatsApp Joe Bot Dashboard! 🎉**

For questions or issues, refer to the comprehensive [README.md](README.md) or [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).
