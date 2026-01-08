# Dashboard Update - Voice Calls Integration

## ✅ Completato

La dashboard è stata aggiornata per:

1. **Tracciare chiamate vocali in tempo reale**
   - Nuova card "Active Calls" nel dashboard principale
   - Visualizzazione chiamate in corso con durata e stato
   - Refresh automatico ogni 10 secondi

2. **Connessione ai dati reali del bot**
   - Rimossi tutti i dati mock
   - API routes ora si connettono al bot su `http://localhost:3001`
   - Endpoint creati:
     - `/api/stats` → Statistiche generali dal bot
     - `/api/calls` → Chiamate vocali attive
     - `/api/conversations` → Conversazioni recenti

3. **Nuove funzionalità UI**
   - Card dedicata per chiamate attive (appare solo se ci sono chiamate)
   - Icona telefono animata durante le chiamate
   - Durata chiamata in tempo reale (minuti e secondi)
   - Statistiche aggiornate nella sezione "Communication Stats"

## 📁 File Modificati

### API Routes
- `app/api/stats/route.ts` - Connesso a `BOT_API_URL/stats`
- `app/api/calls/route.ts` - Nuovo endpoint per chiamate
- `app/api/conversations/route.ts` - Connesso ai dati reali

### Dashboard
- `app/(dashboard)/page.tsx` - Aggiornato con:
  - Hook `useState` e `useEffect` per fetching dati
  - Quinta card per "Active Calls"
  - Sezione chiamate attive (mostra solo se presenti)
  - Polling automatico ogni 10 secondi

### Configurazione
- `.env.local` - Nuovo file con `BOT_API_URL=http://localhost:3001`

## 🚀 Come Usare

### Avvio Locale

1. **Bot WhatsApp** (porta 3001):
   ```bash
   cd "/Users/abmac/Desktop/Claude_P/Chatbot /whatsapp-joe-bot"
   node src/server.js
   ```

2. **Dashboard** (porta 3000):
   ```bash
   cd /Users/abmac/Desktop/Claude_P/whatsapp-joe-dashboard
   npm run dev
   ```

3. Apri browser: `http://localhost:3000`

### Durante una Chiamata Vocale

Quando c'è una chiamata attiva:
- La card "Active Calls" mostra il numero (0 quando nessuna chiamata)
- Appare una sezione dedicata con:
  - Icona telefono verde pulsante
  - Numero mascherato dell'utente
  - Motivo della chiamata (es: "general", "support")
  - Durata in tempo reale
  - Stato chiamata

### Testing

Per testare la visualizzazione delle chiamate:

```bash
# Inizia una chiamata di test
curl -X POST http://localhost:3001/calls/initiate \
  -H "Content-Type: application/json" \
  -d '{"to": "+393247722154", "reason": "test"}'

# Verifica chiamate attive
curl http://localhost:3001/calls/active
```

La dashboard aggiornerà automaticamente entro 10 secondi.

## 📊 Metriche Tracciate

La dashboard ora mostra dati reali per:

1. **Total Messages**: Numero totale messaggi processati
2. **Active Users**: Conversazioni attive uniche
3. **Active Calls**: Chiamate vocali in corso (NUOVO)
4. **Avg Response Time**: Tempo medio risposta bot
5. **API Costs**: Costi OpenAI + ElevenLabs

## 🎯 Deployment

Per il deployment su Railway/Vercel:

1. Imposta la variabile d'ambiente:
   ```
   BOT_API_URL=https://your-bot-domain.railway.app
   ```

2. Assicurati che il bot esponga:
   - `GET /stats` - Statistiche generali
   - `GET /calls/active` - Chiamate attive

## 🔄 Auto-refresh

La dashboard si aggiorna automaticamente ogni 10 secondi per mostrare:
- Nuove conversazioni
- Chiamate in corso
- Statistiche aggiornate

## ✨ UI Miglioramenti

- Icona telefono con animazione `pulse` durante chiamate
- Layout responsive (5 colonne su desktop)
- Card chiamate attive con sfondo muted
- Durata formattata (es: "2m 34s")
- Indicatori stato in tempo reale

---

**Status**: ✅ Pronto per il deployment
**Data**: 2026-01-07
**Versione**: 2.0
