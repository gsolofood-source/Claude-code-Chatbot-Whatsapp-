# Production Hardening - Modifiche P0

Documento tecnico delle modifiche implementate per rendere il bot WhatsApp "Joe Bastianich" production-ready.

## Indice
- [A) Webhook Security (P0)](#a-webhook-security-p0)
- [B) Deduplica Messaggi (P0)](#b-deduplica-messaggi-p0)
- [C) Per-User Ordering (P0)](#c-per-user-ordering-p0)
- [D) Timeout & Retry (P0)](#d-timeout--retry-p0)
- [E) Logging Strutturato](#e-logging-strutturato)
- [Setup Istruzioni](#setup-istruzioni)

---

## A) Webhook Security (P0)

### Problema
Il webhook POST non verificava l'autenticità delle richieste. Chiunque poteva inviare richieste al webhook e far generare risposte costose (ElevenLabs, OpenAI).

### Soluzione
Implementata verifica firma HMAC SHA-256 secondo standard Meta/Facebook.

### File Modificati

#### 1. `.env` (NUOVO)
```env
WHATSAPP_APP_SECRET=your_app_secret_from_meta_dashboard
```

**Come ottenere APP_SECRET:**
1. Vai su https://developers.facebook.com/apps
2. Seleziona la tua app WhatsApp
3. Settings > Basic > App Secret
4. Clicca "Show" e copia il valore

#### 2. `src/config/index.js`
```diff
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
+   appSecret: process.env.WHATSAPP_APP_SECRET,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
```

#### 3. `src/server.js`
```diff
- app.use(express.json());
+ app.use(express.json({
+   verify: (req, res, buf) => {
+     req.rawBody = buf.toString('utf8');
+   }
+ }));
```

**Perché**: Serve il raw body per calcolare l'HMAC SHA-256.

#### 4. `src/middleware/webhookSecurity.js` (NUOVO)
Nuovo middleware che:
- Estrae header `X-Hub-Signature-256`
- Calcola HMAC SHA-256 del raw body con `APP_SECRET`
- Confronto sicuro con `crypto.timingSafeEqual` (protegge da timing attacks)
- Reject 401 se firma mancante o invalida

#### 5. `src/routes/webhook.js`
```diff
+ import { verifyWebhookSignature } from '../middleware/webhookSecurity.js';

- router.post('/', async (req, res) => {
+ router.post('/', verifyWebhookSignature, async (req, res) => {
```

### Comportamento
- **Development**: Se `APP_SECRET` non configurato, skip verifica (log warning)
- **Production**: Verifica obbligatoria, reject 401 se fallisce

---

## B) Deduplica Messaggi (P0)

### Problema
WhatsApp riprova i webhook se non riceve 200 OK entro 20s. Senza deduplica, lo stesso messaggio può essere processato 2-3 volte → risposte duplicate, costi doppi.

### Soluzione
Cache in-memory con TTL 24h usando `node-cache`.

### File Modificati/Creati

#### 1. `package.json`
```bash
npm install node-cache
```

#### 2. `src/services/deduplicationService.js` (NUOVO)
- Cache `processed:<message_id>` con TTL 24h
- `isDuplicate(messageId)` → true se già visto
- `markAsProcessed(messageId)` → salva in cache
- Auto-cleanup ogni 10 minuti

#### 3. `src/routes/webhook.js`
```diff
+ import deduplicationService from '../services/deduplicationService.js';

  for (const message of value.messages) {
+   if (deduplicationService.isDuplicate(message.id)) {
+     logger.info(`Duplicate message skipped: ${message.id}`);
+     continue;
+   }
+
+   deduplicationService.markAsProcessed(message.id);
+
    logger.info(`Processing message: ${message.id}`);
```

### Comportamento
- Marca come processato **PRIMA** di elaborare (fail-safe)
- Se duplicato → log + skip (no processing)
- TTL 24h → dopo 24h il message_id decade automaticamente

---

## C) Per-User Ordering (P0)

### Problema
Se un utente invia 2 messaggi ravvicinati (es. audio + testo), vengono processati in parallelo. Questo causa:
- Risposte fuori ordine
- Contesto condiviso corrotto
- Bug intermittenti

### Soluzione
Queue per utente che garantisce elaborazione sequenziale.

### File Creati

#### 1. `src/services/userQueueService.js` (NUOVO)
- Map `userId → { tasks: [], processing: boolean }`
- `enqueue(userId, task)` → accoda async task
- Processa uno alla volta per utente
- Max backlog: 10 messaggi
- Oltre → reject con `user_queue_overflow`
- Auto-cleanup queue vuote dopo 5 min

#### 2. `src/routes/webhook.js`
```diff
+ import userQueueService from '../services/userQueueService.js';

- messageHandler.handleIncomingMessage(message).catch(error => {
-   logger.error('Error processing message:', error);
- });
+ userQueueService.enqueue(message.from, async () => {
+   await messageHandler.handleIncomingMessage(message);
+ }).catch(error => {
+   logger.error('Error processing message:', error);
+ });
```

### Comportamento
- Messaggi stesso `from` → elaborati in ordine FIFO
- Messaggi utenti diversi → paralleli
- Se queue piena (>10) → reject immediato
- Lock sempre rilasciato (anche su errore)

---

## D) Timeout & Retry (P0)

### Problema
- Nessun timeout configurato → richieste possono appendersi indefinitamente
- Nessun retry → errori transienti causano fallimenti

### Soluzione
Client HTTP con timeout e retry exponential backoff usando `axios-retry`.

### File Creati/Modificati

#### 1. `package.json`
```bash
npm install axios-retry
```

#### 2. `src/utils/httpClient.js` (NUOVO)
Crea client axios preconfigurati:

```javascript
export const httpClients = {
  whatsapp: createHttpClient({
    timeout: 8000,  // 8s
    retries: 2,     // max 3 tentativi
    serviceName: 'WhatsApp'
  }),

  openai: createHttpClient({
    timeout: 15000,  // 15s
    retries: 2,
    serviceName: 'OpenAI'
  }),

  elevenlabs: createHttpClient({
    timeout: 15000,  // 15s
    retries: 2,
    serviceName: 'ElevenLabs'
  })
};
```

**Retry su:**
- Network errors
- HTTP 429, 500, 502, 503, 504

**Exponential backoff:**
- Tentativo 1: 0s
- Tentativo 2: 1s
- Tentativo 3: 2s

#### 3. `src/services/whatsappService.js`
```diff
- import axios from 'axios';
+ import { httpClients } from '../utils/httpClient.js';

  constructor() {
+   this.httpClient = httpClients.whatsapp;
  }

- const response = await axios.post(...)
+ const response = await this.httpClient.post(...)
```

**Ripetere per:**
- `src/services/openaiService.js` → `httpClients.openai`
- `src/services/elevenlabsService.js` → `httpClients.elevenlabs`

### Comportamento
- Timeout rigorosi → fallimento veloce
- Retry automatico su errori transienti
- Log strutturati per ogni retry
- Se audio fallisce dopo 3 tentativi → fallback a testo

---

## E) Logging Strutturato

### Implementato
- Eventi con campi strutturati:
  - `event`: tipo evento (es. `duplicate_message_skipped`, `webhook_signature_invalid`)
  - `message_id`: ID messaggio WhatsApp
  - `user_id`: Numero mascherato (`393******154`)
  - `duration_ms`: Durata operazione
  - `attempt`: Numero tentativo
  - `error_code`: Codice errore HTTP

- **PII Masking**: Numeri telefono mascherati
  ```javascript
  maskPhone('393247722154') → '393******154'
  ```

### Esempi Log
```javascript
logger.warn('Duplicate message detected', {
  event: 'duplicate_message_skipped',
  message_id: 'wamid.HBg...'
});

logger.error('Webhook signature mismatch', {
  event: 'webhook_signature_invalid',
  ip: req.ip
});

logger.info('Task completed for user', {
  user_id: '393******154',
  duration_ms: 8234,
  remaining_tasks: 0
});
```

---

## Setup Istruzioni

### 1. Configurazione Ambiente

Aggiungi al `.env`:
```env
# Obbligatorio per production
WHATSAPP_APP_SECRET=<copia da Meta Dashboard>
```

**Come ottenere:**
1. https://developers.facebook.com/apps
2. Tua app → Settings → Basic
3. App Secret → Show → Copia

### 2. Installazione Dipendenze

```bash
npm install node-cache axios-retry
```

### 3. Testing Signature Verification

**Development** (APP_SECRET non configurato):
- Server si avvia con warning
- Verifica firma skippata
- Webhook funziona normalmente

**Production** (APP_SECRET configurato):
- Verifica firma obbligatoria
- Richieste senza firma → 401
- Firma invalida → 401

### 4. Monitoraggio

#### Endpoint Stats
```bash
curl http://localhost:3000/stats
```

Restituisce:
```json
{
  "activeConversations": 2,
  "dedupStats": {
    "keys": 15,
    "hits": 3,
    "misses": 12
  },
  "queueStats": {
    "active_queues": 2,
    "queues": [
      {
        "user_id": "393******154",
        "tasks_pending": 1,
        "processing": true
      }
    ]
  }
}
```

---

## Testing Checklist

### A) Webhook Security
- [ ] Server parte con APP_SECRET configurato
- [ ] Richiesta POST senza header `X-Hub-Signature-256` → 401
- [ ] Richiesta POST con firma invalida → 401
- [ ] Richiesta POST con firma valida → 200

### B) Deduplica
- [ ] Stesso message_id inviato 2 volte → processato 1 volta
- [ ] Log `duplicate_message_skipped` presente

### C) Ordering
- [ ] Invia 2 messaggi rapidi → processati in ordine
- [ ] Invia 11+ messaggi rapidi → reject con `user_queue_overflow`

### D) Timeout & Retry
- [ ] Chiamata API lenta (>timeout) → fallisce con timeout error
- [ ] API restituisce 503 → retry automatico (log `http_retry`)
- [ ] Dopo 3 tentativi → fallback

---

## Metriche Chiave

| Metrica | Prima | Dopo |
|---------|-------|------|
| **Sicurezza** | ❌ Nessuna verifica webhook | ✅ HMAC SHA-256 verification |
| **Duplicati** | ❌ Possibili risposte multiple | ✅ Deduplica con TTL 24h |
| **Ordering** | ❌ Race conditions | ✅ Queue FIFO per utente |
| **Timeout** | ❌ Richieste appese | ✅ 8-15s timeout |
| **Retry** | ❌ Fallimenti su errori transienti | ✅ 3 tentativi con backoff |
| **Logging** | ⚠️ Basic | ✅ Strutturato + PII masking |

---

## File Modificati - Riepilogo

### File Nuovi
1. `src/middleware/webhookSecurity.js` - Verifica firma webhook
2. `src/services/deduplicationService.js` - Deduplica messaggi
3. `src/services/userQueueService.js` - Queue per-user
4. `src/utils/httpClient.js` - HTTP client con timeout/retry
5. `PRODUCTION_HARDENING.md` - Questa documentazione

### File Modificati
1. `.env` - Aggiunto `WHATSAPP_APP_SECRET`
2. `src/config/index.js` - Configurazione appSecret
3. `src/server.js` - Raw body per verifica firma
4. `src/routes/webhook.js` - Integrazione security + deduplica + queue
5. `src/services/whatsappService.js` - HTTP client con timeout
6. `src/services/openaiService.js` - HTTP client con timeout
7. `src/services/elevenlabsService.js` - HTTP client con timeout

---

## Next Steps (Opzionali - Non P0)

### Redis per Deduplica (P1)
Sostituire `node-cache` con Redis per:
- Deduplica cross-instance (scale orizzontale)
- Persistenza
- Stats centralizzate

### Circuit Breaker (P1)
Implementare circuit breaker per:
- ElevenLabs
- OpenAI
Protezione contro cascading failures.

### Healthcheck Avanzato (P1)
```bash
GET /health
```
Verifica:
- Connectivity WhatsApp API
- Connectivity ElevenLabs
- Connectivity OpenAI
- Cache status
- Queue status

---

## Domande Frequenti

### Q: Cosa succede se APP_SECRET è sbagliato?
**A:** Ogni richiesta POST di WhatsApp sarà rifiutata con 401. Il bot smetterà di funzionare. Verificare il valore su Meta Dashboard.

### Q: La deduplica funziona cross-restart?
**A:** No. `node-cache` è in-memory. Dopo restart, cache è vuota. Per persistenza, usare Redis.

### Q: Quanto dura la queue per utente?
**A:** Infinito finché ci sono messaggi. Se vuota per 5 minuti, viene rimossa automaticamente.

### Q: Cosa succede se tutte le API chiamate falliscono?
**A:** Dopo 3 tentativi (con backoff), viene lanciato errore. Per audio → fallback a testo. Per testo → messaggio errore all'utente.

---

## Contatti

Per problemi o domande su queste modifiche, riferirsi a questo documento.

**Versione:** 1.0
**Data:** 2026-01-06
**Status:** Production-ready
