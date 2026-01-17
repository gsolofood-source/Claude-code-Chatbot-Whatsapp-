# Digital Check-Up

Analizzatore di presenza digitale per food business.

Analizza **Sito Web**, **Instagram** e **Google My Business** e restituisce un punteggio 0-100 con raccomandazioni.

---

## Struttura

```
digital-checkup/
├── frontend/          → Pagina web (index.html)
├── api/               → Backend API (deploy su Railway)
└── README.md
```

---

## 🚀 Setup

### 1. Deploy API su Railway

1. [railway.app](https://railway.app) → New Project → GitHub
2. Seleziona repo `Claude-code-Chatbot-Whatsapp-`
3. **Root Directory**: `apps/digital-checkup/api`
4. Aggiungi Variables:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   GOOGLE_PLACES_API_KEY=AIza...
   ```
5. Deploy → copia l'URL generato (es. `https://xxx.up.railway.app`)

### 2. Configura Frontend

1. Apri `frontend/index.html`
2. Trova riga ~490: `const API_BASE_URL = ...`
3. Sostituisci con il tuo URL Railway
4. Commit e Push

### 3. Usa

- Apri `frontend/index.html` in un browser
- Oppure hostalo su Vercel/Netlify/GitHub Pages

---

## 📡 API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/analyze/global` | Analisi completa |
| POST | `/api/analyze/website` | Solo sito |
| POST | `/api/analyze/instagram` | Solo Instagram |
| POST | `/api/analyze/gmb` | Solo GMB |

### Esempio

```bash
curl -X POST https://TUO-URL.up.railway.app/api/analyze/global \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://example.com",
    "instagramUsername": "username",
    "businessName": "https://maps.app.goo.gl/xxx"
  }'
```

---

## 💰 Costi

| Servizio | Costo |
|----------|-------|
| Railway | ~$5/mese |
| Anthropic API | ~$0.04/analisi |
| Google Places | Gratis (200k req/mese) |

---

## 🧪 Test locale API

```bash
cd api
npm install
cp .env.example .env   # Aggiungi le API key
npm run mcp:sse        # Avvia su http://localhost:3000
```
