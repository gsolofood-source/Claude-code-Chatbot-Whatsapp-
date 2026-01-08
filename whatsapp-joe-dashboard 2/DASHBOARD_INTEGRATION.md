# Dashboard Integration - Chat Logs

## Panoramica

La dashboard Next.js è stata integrata con il sistema di chat logging del backend per visualizzare i log delle conversazioni in tempo reale.

## Nuove Funzionalità

### 1. Pagina Chat Logs (`/chat-logs`)

Una nuova pagina dedicata alla visualizzazione dei log delle chat con le seguenti caratteristiche:

- **Visualizzazione Log**: Mostra tutti i messaggi delle ultime N ore (configurabile)
- **Filtri Avanzati**:
  - Filtro per periodo (1h, 3h, 6h, 12h, 15h, 24h, 48h, 72h, settimana)
  - Filtro per utente specifico
  - Ricerca nel contenuto dei messaggi
- **Statistiche in Tempo Reale**:
  - Numero totale di messaggi
  - Utenti unici
  - Media messaggi per utente
  - Periodo temporale
- **Attività Utenti**: Riepilogo delle conversazioni più attive
- **Auto-refresh**: La pagina si aggiorna automaticamente

### 2. API Routes Create

Nuovi endpoint API nella dashboard che fanno da proxy al backend:

- `GET /api/chat-logs?hours=15` - Recupera tutti i log recenti
- `GET /api/chat-logs/stats?hours=15` - Recupera statistiche aggregate
- `GET /api/chat-logs/user/[userId]?hours=15` - Recupera log per utente specifico

### 3. Aggiornamento Pagina Conversations

La pagina "Conversations" è stata aggiornata per:

- Usare dati reali dal backend invece di mock data
- Mostrare conversazioni attive in tempo reale
- Visualizzare messaggi reali per ogni conversazione
- Auto-refresh ogni 10 secondi
- Stati di loading appropriati

## Configurazione

### 1. Variabili d'Ambiente

Crea un file `.env.local` nella directory della dashboard:

```bash
# Backend Bot API URL
BOT_API_URL=http://localhost:3000  # Per sviluppo locale

# Per produzione
# BOT_API_URL=https://your-bot-url.railway.app
```

### 2. Installazione Dipendenze

```bash
cd "whatsapp-joe-dashboard 2"
npm install
```

### 3. Avvio Dashboard

```bash
# Sviluppo
npm run dev

# Build per produzione
npm run build
npm start
```

La dashboard sarà disponibile su `http://localhost:3001` (Next.js usa automaticamente la porta 3000, ma se occupata passa alla 3001).

## Architettura

```
Dashboard (Next.js - Port 3001)
    ↓
API Routes (/api/chat-logs, /api/conversations)
    ↓
Backend API (Express - Port 3000)
    ↓
Chat Log Service + Conversation Manager
    ↓
File System (logs/chats/*.json) + Memory Cache
```

### Flusso Dati

1. **Dashboard → API Routes**: Il frontend React chiama le proprie API routes
2. **API Routes → Backend**: Le API routes della dashboard fanno richieste HTTP al backend
3. **Backend → Storage**: Il backend recupera i dati dal file system o dalla cache
4. **Dati → Dashboard**: I dati vengono passati attraverso la catena di ritorno

## Come Usare

### Visualizzare Chat Logs

1. Avvia il backend: `npm start` (dalla root del progetto)
2. Avvia la dashboard: `cd "whatsapp-joe-dashboard 2" && npm run dev`
3. Apri browser su `http://localhost:3001`
4. Clicca su "Chat Logs" nella sidebar

### Filtri Disponibili

**Periodo Temporale:**
- Ultima ora
- Ultime 3, 6, 12, 15, 24, 48, 72 ore
- Ultima settimana

**Filtro Utente:**
- Tutti gli utenti (default)
- Utente specifico (seleziona dal dropdown)

**Ricerca:**
- Cerca nel contenuto dei messaggi
- Cerca per User ID

### Statistiche

La sezione statistiche mostra:

- **Messaggi Totali**: Numero totale di messaggi nel periodo
- **Utenti Unici**: Numero di conversazioni diverse
- **Periodo**: Finestra temporale selezionata
- **Media Msg/Utente**: Messaggi medi per conversazione

### Attività Utenti

Mostra i top 10 utenti più attivi con:
- User ID
- Numero di messaggi
- Timestamp ultimo messaggio

## Componenti UI Aggiunti

### Nuovi Componenti

1. **Badge** (`components/ui/badge.tsx`):
   - Indicatori colorati per ruoli (User/Bot)
   - Varianti: default, secondary, destructive, outline

2. **Select** (`components/ui/select.tsx`):
   - Dropdown per selezione periodo e utente
   - Basato su Radix UI primitives

### Componenti Aggiornati

1. **Sidebar** (`components/sidebar.tsx`):
   - Aggiunto link "Chat Logs" con icona FileText
   - Riordinate le voci del menu

2. **Conversations Page** (`app/(dashboard)/conversations/page.tsx`):
   - Rimossi mock data
   - Integrati dati reali dal backend
   - Aggiunti stati di loading
   - Implementato auto-refresh

## API Backend Utilizzate

La dashboard si connette ai seguenti endpoint del backend:

### Conversations

```http
GET /conversations
GET /conversations/:userId
```

### Chat Logs

```http
GET /conversations/logs/recent?hours=15
GET /conversations/logs/stats?hours=15
GET /conversations/logs/user/:userId?hours=15
```

### Stats

```http
GET /stats
```

### Calls

```http
GET /calls
```

## Troubleshooting

### Dashboard non si connette al backend

1. **Verifica che il backend sia in esecuzione**:
   ```bash
   # Nella root del progetto
   npm start
   ```

2. **Verifica l'URL del backend nel .env.local**:
   ```bash
   BOT_API_URL=http://localhost:3000
   ```

3. **Controlla i log della console del browser**:
   - Apri DevTools (F12)
   - Cerca errori di rete nella tab Network
   - Verifica che le richieste vadano a `http://localhost:3001/api/*`

### Nessun dato visualizzato

1. **Verifica che ci siano log nel backend**:
   ```bash
   npm run logs
   ```

2. **Genera dati di test**:
   ```bash
   node scripts/test-chat-logs.js
   ```

3. **Verifica che gli endpoint API rispondano**:
   ```bash
   curl http://localhost:3000/conversations/logs/recent?hours=24
   ```

### Errori di CORS

Se vedi errori CORS nella console:

1. Assicurati che il backend abbia configurato CORS correttamente
2. Le API routes di Next.js dovrebbero gestire automaticamente CORS
3. In sviluppo, Next.js dovrebbe già configurare il proxy correttamente

### Dashboard non si ricarica automaticamente

1. Verifica che gli intervalli siano configurati correttamente
2. Il polling è impostato a:
   - Conversations: ogni 10 secondi
   - Dashboard stats: ogni 10 secondi
   - Chat Logs: manuale (usa pulsante Refresh)

## Best Practices

### Performance

- I log sono limitati a max 168 ore (1 settimana) per query performance
- La ricerca filtra i dati lato client per reattività immediata
- L'auto-refresh usa `cache: "no-store"` per dati freschi

### UX

- Stati di loading chiari per ogni sezione
- Messaggi informativi quando non ci sono dati
- Pulsanti refresh manuali disponibili
- Feedback visivo per operazioni in corso

### Sicurezza

- Le API routes validano i parametri di input
- Gli errori vengono catturati e gestiti gracefully
- I dati sensibili (API keys) rimangono sul backend
- Il frontend non espone credenziali

## Sviluppi Futuri

Possibili miglioramenti:

1. **Export dei Log**: Bottone per esportare log in CSV/JSON
2. **Grafici Temporali**: Visualizzazione grafica dell'attività
3. **Notifiche Real-time**: WebSocket per aggiornamenti istantanei
4. **Filtri Avanzati**: Per tipo di messaggio, contenuto, etc.
5. **Ricerca Full-text**: Implementazione search più potente
6. **Analytics**: Dashboard con metriche avanzate
7. **Archiviazione**: Sistema per archiviare log vecchi
8. **Autenticazione**: Sistema di login per dashboard

## Link Utili

- [Next.js Documentation](https://nextjs.org/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [date-fns](https://date-fns.org/)

## Support

Per problemi o domande:

1. Controlla la console del browser per errori JavaScript
2. Controlla i log del backend in `logs/combined.log`
3. Verifica che tutte le dipendenze siano installate: `npm install`
4. Assicurati di usare Node.js v18 o superiore
