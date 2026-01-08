# Guida al Sistema di Logging delle Chat

## Panoramica

Il sistema di logging delle chat registra tutti i messaggi scambiati con gli utenti in modo persistente, permettendo di recuperare le conversazioni anche dopo il riavvio del server o la scadenza delle conversazioni dalla cache.

## Caratteristiche

- **Logging Persistente**: I messaggi vengono salvati su file JSON giornalieri
- **Filtro Temporale**: Recupera facilmente i log delle ultime N ore
- **API REST**: Endpoint per accedere ai log via HTTP
- **CLI Tool**: Script da riga di comando per visualizzare i log
- **Statistiche**: Visualizza statistiche aggregate sulle conversazioni

## Struttura dei File

I log vengono salvati in:
```
logs/chats/chat-log-YYYY-MM-DD.json
```

Ogni file contiene un array di messaggi per quella giornata.

## Formato dei Log

Ogni entry di log contiene:

```json
{
  "userId": "1234567890",
  "messageType": "text",
  "content": "Contenuto del messaggio",
  "role": "user",
  "timestamp": "2026-01-08T10:30:00.000Z",
  "metadata": {
    "from": "whatsapp:+1234567890",
    "to": "whatsapp:+0987654321",
    "messageId": "wamid.xxx"
  }
}
```

## Utilizzo via CLI

### Visualizzare i log delle ultime 15 ore (default)

```bash
npm run logs
```

oppure

```bash
node scripts/view-chat-logs.js
```

### Visualizzare i log delle ultime N ore

```bash
npm run logs -- --hours=24
```

### Visualizzare i log di un utente specifico

```bash
npm run logs -- --user=1234567890 --hours=48
```

### Visualizzare statistiche

```bash
npm run logs:stats
```

oppure

```bash
npm run logs -- --stats --hours=24
```

### Aiuto

```bash
node scripts/view-chat-logs.js --help
```

## Utilizzo via API REST

### Endpoint disponibili

#### 1. Recupera tutti i log recenti

```http
GET /conversations/logs/recent?hours=15
```

Parametri query:
- `hours` (opzionale): Numero di ore da recuperare (default: 15, max: 168)

Risposta:
```json
{
  "success": true,
  "hours": 15,
  "totalMessages": 42,
  "logs": [...]
}
```

#### 2. Recupera statistiche

```http
GET /conversations/logs/stats?hours=15
```

Parametri query:
- `hours` (opzionale): Numero di ore da analizzare (default: 15, max: 168)

Risposta:
```json
{
  "success": true,
  "stats": {
    "totalMessages": 42,
    "uniqueUsers": 5,
    "timeRange": 15,
    "users": [
      {
        "userId": "1234567890",
        "messageCount": 10,
        "lastMessage": "2026-01-08T10:30:00.000Z",
        "firstMessage": "2026-01-08T09:00:00.000Z"
      }
    ]
  }
}
```

#### 3. Recupera log di un utente specifico

```http
GET /conversations/logs/user/1234567890?hours=15
```

Parametri URL:
- `userId`: ID dell'utente WhatsApp

Parametri query:
- `hours` (opzionale): Numero di ore da recuperare (default: 15, max: 168)

Risposta:
```json
{
  "success": true,
  "userId": "1234567890",
  "hours": 15,
  "totalMessages": 10,
  "logs": [...]
}
```

## Esempi con curl

```bash
# Recupera i log delle ultime 15 ore
curl http://localhost:3000/conversations/logs/recent

# Recupera i log delle ultime 24 ore
curl http://localhost:3000/conversations/logs/recent?hours=24

# Recupera statistiche delle ultime 48 ore
curl http://localhost:3000/conversations/logs/stats?hours=48

# Recupera i log di un utente specifico
curl http://localhost:3000/conversations/logs/user/1234567890?hours=24
```

## Manutenzione

### Pulizia Automatica

I log più vecchi di 30 giorni possono essere eliminati automaticamente chiamando:

```javascript
import chatLogService from './src/services/chatLogService.js';
chatLogService.cleanOldLogs(30); // Mantieni solo gli ultimi 30 giorni
```

### Backup

È consigliabile effettuare backup periodici della cartella `logs/chats/`:

```bash
tar -czf chat-logs-backup-$(date +%Y%m%d).tar.gz logs/chats/
```

## Integrazione nel Codice

Il logging è automatico. Ogni volta che viene aggiunto un messaggio tramite `conversationManager.addMessage()`, il messaggio viene salvato automaticamente nei log persistenti.

### Esempio di utilizzo programmatico

```javascript
import chatLogService from './src/services/chatLogService.js';

// Recupera log delle ultime 24 ore
const logs = chatLogService.getLogsLastHours(24);

// Recupera log di un utente specifico
const userLogs = chatLogService.getUserLogsLastHours('1234567890', 24);

// Ottieni statistiche
const stats = chatLogService.getLogStats(24);

// Pulisci log vecchi
const deletedCount = chatLogService.cleanOldLogs(30);
```

## Note Importanti

1. **Privacy**: I log contengono dati sensibili. Assicurati che la cartella `logs/` sia protetta e non esposta pubblicamente.

2. **Storage**: I file di log possono occupare spazio su disco. Implementa una strategia di pulizia automatica se necessario.

3. **Performance**: Per periodi molto lunghi (>7 giorni), il recupero dei log potrebbe richiedere più tempo.

4. **Timezone**: Tutti i timestamp sono in formato UTC (ISO 8601). Convertire al timezone locale quando necessario.

## Troubleshooting

### I log non vengono salvati

1. Verifica che la cartella `logs/chats/` esista e sia scrivibile
2. Controlla i log di errore in `logs/error.log`
3. Verifica che il servizio `chatLogService` sia correttamente importato in `conversationManager.js`

### Lo script CLI non funziona

1. Verifica di aver installato tutte le dipendenze: `npm install`
2. Assicurati che lo script sia eseguibile: `chmod +x scripts/view-chat-logs.js`
3. Usa Node.js versione 14 o superiore

### Gli endpoint API restituiscono errori

1. Verifica che il server sia in esecuzione
2. Controlla i log del server per errori specifici
3. Verifica che il parametro `hours` sia tra 1 e 168
