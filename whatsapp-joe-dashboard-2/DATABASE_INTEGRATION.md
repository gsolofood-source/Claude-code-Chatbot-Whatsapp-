# 🔄 Database Integration - Dashboard Joe Bastianich

## ✅ Modifiche Completate

La dashboard è stata aggiornata per leggere **direttamente dal database PostgreSQL** invece di fare proxy verso il backend bot.

### File Creati

| File | Descrizione |
|------|-------------|
| `lib/db.ts` | Libreria connessione PostgreSQL con Pool |

### File Aggiornati

| File | Modifica |
|------|----------|
| `app/api/stats/route.ts` | Legge statistiche dal DB |
| `app/api/conversations/route.ts` | Lista conversazioni dal DB |
| `app/api/conversations/[id]/route.ts` | Dettaglio conversazione dal DB |
| `app/api/chat-logs/route.ts` | Log messaggi recenti dal DB |
| `app/api/chat-logs/stats/route.ts` | Statistiche log dal DB |
| `app/api/chat-logs/user/[userId]/route.ts` | Log per utente dal DB |
| `app/api/calls/transcripts/route.ts` | Trascrizioni chiamate dal DB |
| `package.json` | Aggiunto `pg` e `@types/pg` |
| `.env.example` | Aggiunto `DATABASE_URL` |

### Nuove API Analytics

| Endpoint | Descrizione |
|----------|-------------|
| `GET /api/analytics/audience` | Insights sul pubblico (totali, trend, attività) |
| `GET /api/analytics/peak-hours` | Orari di picco (heatmap, giorni) |
| `GET /api/analytics/top-users` | Utenti più attivi con lead scoring |
| `GET /api/analytics/topics` | Argomenti discussi (word cloud, categorie) |
| `GET /api/analytics/segments` | Segmentazione pubblico per product placement |

---

## 🚀 Deployment su Railway

### 1. Variabili d'Ambiente

Su Railway, aggiungi questa variabile alla dashboard:

```
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
```

Puoi copiare la connection string dal tuo database PostgreSQL esistente su Railway:
- Vai su Railway → Database PostgreSQL
- Tab "Connect"
- Copia "Postgres Connection URL"

### 2. Deploy

```bash
# Dal terminale locale
cd whatsapp-joe-dashboard-2
git add .
git commit -m "Database integration + Analytics"
git push origin main
```

Railway rileverà automaticamente il push e farà il deploy.

### 3. Verifica

Dopo il deploy, testa gli endpoint:

```bash
# Stats
curl https://tua-dashboard.railway.app/api/stats

# Analytics Audience
curl https://tua-dashboard.railway.app/api/analytics/audience

# Analytics Segments
curl https://tua-dashboard.railway.app/api/analytics/segments
```

---

## 📊 API Analytics - Dettagli

### GET /api/analytics/audience

Restituisce insights sul pubblico:

```json
{
  "success": true,
  "audience": {
    "totalUsers": 150,
    "activeUsers": 45,
    "newUsers": 12,
    "userGrowth": 15,
    "avgMessagesPerUser": 8.5,
    "returnRate": 62,
    "callingUsers": 8,
    "activityBreakdown": {
      "superActive": 5,
      "active": 20,
      "moderate": 45,
      "casual": 80
    },
    "registrationTrend": [
      { "date": "2026-01-05", "count": 3 },
      { "date": "2026-01-06", "count": 5 }
    ]
  }
}
```

### GET /api/analytics/peak-hours

Analisi orari di attività:

```json
{
  "success": true,
  "peakHours": {
    "hourlyDistribution": [
      { "hour": "09:00", "messages": 45 },
      { "hour": "10:00", "messages": 62 }
    ],
    "weeklyDistribution": [
      { "day": "Lunedì", "messages": 120 },
      { "day": "Martedì", "messages": 145 }
    ],
    "heatmap": [...],
    "insights": {
      "peakHours": ["19:00", "20:00", "21:00"],
      "peakDay": "Mercoledì",
      "bestTimeToEngage": "19:00",
      "recommendation": "Il tuo pubblico è più attivo Mercoledì alle 19:00..."
    }
  }
}
```

### GET /api/analytics/top-users

Top utenti con lead scoring:

```json
{
  "success": true,
  "topUsers": [
    {
      "rank": 1,
      "userId": "123",
      "name": "Marco Rossi",
      "phone": "+39 333****567",
      "stats": {
        "messages": 156,
        "calls": 3,
        "callMinutes": 12.5
      },
      "engagementScore": 85,
      "firstInteraction": "2025-11-15T...",
      "lastInteraction": "2026-01-11T..."
    }
  ],
  "summary": {
    "totalTopUsers": 10,
    "totalEngagement": 450,
    "topUserShare": "18%",
    "mostActiveUser": "Marco Rossi"
  }
}
```

### GET /api/analytics/topics

Analisi argomenti discussi:

```json
{
  "success": true,
  "topics": {
    "wordCloud": [
      { "word": "ristorante", "count": 89 },
      { "word": "menu", "count": 56 },
      { "word": "personale", "count": 34 }
    ],
    "distribution": [
      {
        "topic": "ristorante",
        "count": 45,
        "percentage": 28,
        "examples": ["Vorrei aprire un ristorante...", "..."]
      }
    ],
    "insights": {
      "topTopic": "ristorante",
      "topTopicPercentage": 28,
      "recommendation": "Il 28% delle conversazioni riguarda ristorante..."
    },
    "questionPatterns": [
      { "pattern": "Come fare...", "count": 34 },
      { "pattern": "Quanto costa...", "count": 23 }
    ]
  }
}
```

### GET /api/analytics/segments

Segmentazione per product placement:

```json
{
  "success": true,
  "segments": {
    "list": [
      {
        "id": "aspiring_restaurateur",
        "name": "Aspiranti Ristoratori",
        "description": "Utenti che vogliono aprire un ristorante",
        "icon": "🍽️",
        "count": 45,
        "avgLeadScore": 72,
        "topUsers": [...]
      }
    ],
    "summary": {
      "topSegment": "Aspiranti Ristoratori",
      "topSegmentCount": 45,
      "highValueLeads": 12,
      "insights": [
        "45 utenti sono Aspiranti Ristoratori - target ideale per partnership con fornitori attrezzature.",
        "Hai 12 lead ad alto potenziale per collaborazioni commerciali."
      ]
    },
    "highValueLeads": [
      {
        "userId": "123",
        "name": "Marco Rossi",
        "phone": "+39 333****567",
        "messageCount": 156,
        "callCount": 3,
        "leadScore": 92
      }
    ]
  }
}
```

---

## 🎨 Prossimi Passi - Frontend

Le API sono pronte. Per visualizzare i dati nel frontend:

### 1. Creare pagina Analytics (`/analytics`)

```
app/(dashboard)/analytics/
├── page.tsx              # Pagina principale analytics
├── audience/page.tsx     # Insights pubblico
├── topics/page.tsx       # Word cloud + categorie
└── segments/page.tsx     # Segmenti + Lead
```

### 2. Componenti da creare

- `AudienceOverview.tsx` - Statistiche pubblico
- `PeakHoursHeatmap.tsx` - Heatmap orari
- `TopUsersTable.tsx` - Classifica utenti
- `WordCloud.tsx` - Tag cloud argomenti
- `SegmentCards.tsx` - Segmenti con lead scoring

---

## 📝 Note Tecniche

### Pool Connection

La connessione al database usa un pool singleton per efficienza:
- Max 10 connessioni simultanee
- Timeout 30s per connessioni idle
- SSL abilitato per Railway

### Caching

Tutte le route usano `dynamic = "force-dynamic"` per dati sempre freschi. Per produzione, considera:

```typescript
export const revalidate = 60; // Revalida ogni 60 secondi
```

### Privacy

I numeri di telefono sono mascherati: `+39 333****567`

---

## ✅ Checklist Deployment

- [ ] Copia `DATABASE_URL` da Railway PostgreSQL
- [ ] Aggiungi variabile a dashboard Railway
- [ ] Push codice su GitHub
- [ ] Verifica deploy su Railway
- [ ] Testa `/api/stats`
- [ ] Testa `/api/analytics/audience`
- [ ] Testa `/api/analytics/segments`
