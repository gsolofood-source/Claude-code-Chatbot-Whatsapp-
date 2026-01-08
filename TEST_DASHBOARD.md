# Test Dashboard Integration - Guida Rapida

## Prerequisiti

1. **Node.js** v18 o superiore installato
2. **Due terminali** aperti
3. **Dati di test** generati (opzionale ma consigliato)

## Passo 1: Genera Dati di Test

Nel primo terminale, dalla root del progetto:

```bash
# Genera alcuni log di test
node scripts/test-chat-logs.js
```

Questo creerà 10 messaggi di test che potrai visualizzare nella dashboard.

## Passo 2: Avvia il Backend

Sempre nel primo terminale:

```bash
# Avvia il server backend sulla porta 3000
npm start
```

Dovresti vedere:
```
🚀 WhatsApp Joe Bastianich Bot started on port 3000
```

## Passo 3: Avvia la Dashboard

In un **secondo terminale**:

```bash
# Entra nella directory della dashboard
cd "whatsapp-joe-dashboard 2"

# Installa le dipendenze (solo la prima volta)
npm install

# Avvia la dashboard in modalità sviluppo
npm run dev
```

La dashboard si avvierà su `http://localhost:3001` (o 3000 se libera).

## Passo 4: Apri la Dashboard

1. Apri il browser su `http://localhost:3001`
2. Vedrai la dashboard con le statistiche

## Passo 5: Visualizza i Chat Logs

1. Nella sidebar a sinistra, clicca su **"Chat Logs"**
2. Dovresti vedere:
   - 📊 Statistiche in alto (10 messaggi totali, 3 utenti unici, etc.)
   - 🔍 Filtri per periodo, utente e ricerca
   - 💬 Lista dei 10 messaggi di test con timestamp e contenuto
   - 👥 Sezione "Attività Utenti" in basso con i 3 utenti di test

## Passo 6: Prova i Filtri

### Filtro Periodo
1. Clicca sul dropdown "Periodo"
2. Seleziona "Ultime 24 ore"
3. La pagina si ricaricherà mostrando i log delle ultime 24 ore

### Filtro Utente
1. Clicca sul dropdown "Utente"
2. Seleziona "user1", "user2" o "user3"
3. Vedrai solo i messaggi di quell'utente specifico

### Ricerca
1. Digita "ciao" nella barra di ricerca
2. Vedrai solo i messaggi che contengono "ciao"

## Passo 7: Visualizza Conversazioni Reali

1. Nella sidebar, clicca su **"Conversations"**
2. Se ci sono conversazioni attive nel backend, le vedrai qui
3. Clicca su una conversazione per vedere i messaggi

**Nota**: Se non ci sono conversazioni attive, vedrai il messaggio "No active conversations". Questo è normale se il bot non ha ancora ricevuto messaggi reali da WhatsApp.

## Passo 8: Dashboard Principale

1. Clicca su **"Dashboard"** nella sidebar
2. Vedrai le statistiche generali:
   - Total Messages
   - Active Users
   - Active Calls
   - Avg Response Time
   - API Costs

## Verifica che Tutto Funzioni

### ✅ Checklist

- [ ] Backend è in esecuzione sulla porta 3000
- [ ] Dashboard è in esecuzione sulla porta 3001
- [ ] Pagina Chat Logs mostra i 10 messaggi di test
- [ ] I filtri funzionano correttamente
- [ ] Le statistiche mostrano: 10 messaggi, 3 utenti
- [ ] La ricerca filtra i messaggi
- [ ] La sezione "Attività Utenti" mostra user1, user2, user3
- [ ] Il pulsante "Aggiorna" ricarica i dati
- [ ] La pagina Conversations è accessibile (può essere vuota)
- [ ] La Dashboard principale mostra le statistiche

## Test Avanzati

### Test Auto-Refresh

1. Con la dashboard aperta, genera nuovi log:
   ```bash
   # Nel terminale del backend
   node scripts/test-chat-logs.js
   ```

2. Clicca sul pulsante "Aggiorna" nella pagina Chat Logs
3. Dovresti vedere i nuovi messaggi (ora 20 totali invece di 10)

### Test Periodi Diversi

1. Seleziona "Ultima ora" nel filtro periodo
2. Tutti i messaggi di test dovrebbero essere visibili
3. Seleziona "Ultime 3 ore"
4. Dovresti vedere ancora tutti i messaggi

### Test Ricerca Avanzata

Prova queste ricerche:
- "ciao" → trova messaggi con saluti
- "prezzi" → trova messaggi su prezzi
- "user1" → trova tutti i messaggi di user1
- "bot" → trova la parola bot nei metadati

## Troubleshooting

### Dashboard non si connette al backend

**Errore**: "Bot API unreachable" nei log

**Soluzione**:
1. Verifica che il backend sia in esecuzione: `ps aux | grep node`
2. Controlla che il backend sia sulla porta 3000: `curl http://localhost:3000/health`
3. Verifica il file `.env.local` nella dashboard:
   ```bash
   cat "whatsapp-joe-dashboard 2/.env.local"
   ```
   Deve contenere: `BOT_API_URL=http://localhost:3000`

### Nessun log visualizzato

**Problema**: La pagina Chat Logs è vuota

**Soluzione**:
1. Genera dati di test: `node scripts/test-chat-logs.js`
2. Verifica che i log esistano: `npm run logs`
3. Controlla che il file di log sia stato creato:
   ```bash
   ls -la logs/chats/
   ```

### Porta già in uso

**Errore**: "Port 3000 is already in use"

**Soluzione**:
1. Ferma altri processi sulla porta 3000
2. Oppure cambia porta nel backend modificando `PORT` in `.env`

### Errori di compilazione Next.js

**Errore**: Errori TypeScript o di compilazione

**Soluzione**:
1. Pulisci e reinstalla:
   ```bash
   cd "whatsapp-joe-dashboard 2"
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

## Screenshot Attesi

### Pagina Chat Logs
```
📊 STATISTICHE
- Messaggi Totali: 10
- Utenti Unici: 3
- Periodo: 15h
- Media: 3 msg/utente

🔍 FILTRI
- Periodo: Ultime 15 ore
- Utente: Tutti gli utenti
- Cerca: [campo di ricerca]

💬 LOG MESSAGGI (10 messaggi trovati)
1. 👤 UTENTE - user1 - "Ciao, come stai?"
2. 🤖 BOT - user2 - "Ciao! Sto bene, grazie..."
[...altri messaggi...]

👥 ATTIVITÀ UTENTI
1. user1: 4 messaggi
2. user3: 3 messaggi
3. user2: 3 messaggi
```

## Comandi Utili

```bash
# Backend
npm start                    # Avvia backend
npm run logs                 # Visualizza log da CLI
npm run logs:stats          # Statistiche da CLI
node scripts/test-chat-logs.js  # Genera dati test

# Dashboard
cd "whatsapp-joe-dashboard 2"
npm install                  # Installa dipendenze
npm run dev                 # Avvia in sviluppo
npm run build              # Build per produzione
npm start                  # Avvia in produzione

# Verifica
curl http://localhost:3000/health                    # Health check backend
curl http://localhost:3000/conversations/logs/recent # Test API logs
curl http://localhost:3001                          # Test dashboard
```

## Prossimi Passi

Dopo aver verificato che tutto funziona:

1. **Connetti WhatsApp**: Configura il webhook di WhatsApp per ricevere messaggi reali
2. **Deploy**: Fai il deploy di backend e dashboard su Railway o Vercel
3. **Personalizza**: Modifica colori, testi e layout secondo le tue preferenze
4. **Estendi**: Aggiungi nuove funzionalità (export, grafici, notifiche)

## Documentazione Completa

Per maggiori dettagli:
- Backend: `CHAT_LOGS_GUIDE.md`
- Dashboard: `whatsapp-joe-dashboard 2/DASHBOARD_INTEGRATION.md`
- Deployment: `RAILWAY_DEPLOYMENT.md`

Buon test! 🚀
