# WhatsApp Joe Bastianich Bot

Chatbot WhatsApp che impersona Joe Bastianich usando ElevenLabs Agent API e WhatsApp Business API.

## Caratteristiche

- 🤖 Personalità di Joe Bastianich tramite ElevenLabs Agent
- 💬 Risposte testuali intelligenti
- 🎤 Messaggi vocali con voce clonata di Joe
- 🔄 Gestione conversazioni con contesto
- 📊 Logging professionale
- ⚡ Architettura scalabile e modulare

## Prerequisiti

- Node.js 18+ e npm
- Account WhatsApp Business API (Meta)
- Account ElevenLabs con Agent configurato
- ngrok o server pubblico per il webhook (in sviluppo)

## Installazione

### 1. Clona e installa dipendenze

```bash
cd whatsapp-joe-bot
npm install
```

### 2. Configura le variabili d'ambiente

Copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
```

Modifica `.env` con le tue credenziali:

```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=974619989064137
WHATSAPP_ACCESS_TOKEN=il_tuo_token_whatsapp
WHATSAPP_VERIFY_TOKEN=il_tuo_verify_token_personalizzato
WHATSAPP_BUSINESS_ACCOUNT_ID=il_tuo_business_account_id

# ElevenLabs
ELEVENLABS_API_KEY=la_tua_api_key_elevenlabs
ELEVENLABS_AGENT_ID=id_del_tuo_agent_joe_b

# Server
PORT=3000
NODE_ENV=development
```

### 3. Avvia il server

**Modalità sviluppo (con auto-reload):**
```bash
npm run dev
```

**Modalità produzione:**
```bash
npm start
```

Il server sarà disponibile su `http://localhost:3000`

## Configurazione Webhook WhatsApp

### Sviluppo locale con ngrok

1. Installa ngrok:
```bash
brew install ngrok  # macOS
# oppure scarica da https://ngrok.com/download
```

2. Avvia ngrok:
```bash
ngrok http 3000
```

3. Copia l'URL HTTPS generato (es. `https://abc123.ngrok.io`)

4. Configura il webhook su Meta:
   - Vai su [Meta for Developers](https://developers.facebook.com/)
   - Seleziona la tua app WhatsApp Business
   - Vai su "WhatsApp" → "Configuration"
   - Callback URL: `https://abc123.ngrok.io/webhook`
   - Verify Token: il token che hai impostato in `WHATSAPP_VERIFY_TOKEN`
   - Clicca "Verify and Save"

5. Sottoscrivi ai webhook events:
   - Seleziona `messages` per ricevere messaggi

### Produzione

In produzione, sostituisci ngrok con:
- Server pubblico (VPS, EC2, ecc.)
- Servizi cloud (Heroku, Railway, Render, ecc.)
- Reverse proxy (nginx, Caddy, ecc.)

Assicurati che il webhook URL usi HTTPS.

## Come ottenere le credenziali

### WhatsApp Business API

1. Vai su [Meta for Developers](https://developers.facebook.com/)
2. Crea una nuova app o usa una esistente
3. Aggiungi il prodotto "WhatsApp"
4. Nella sezione "API Setup":
   - **Phone Number ID**: lo trovi sotto il numero di telefono di test
   - **Access Token**: genera un token temporaneo o permanente
   - **Business Account ID**: nella dashboard principale

5. Crea un **Verify Token** personalizzato (una stringa a tua scelta)

### ElevenLabs

1. Vai su [ElevenLabs](https://elevenlabs.io/)
2. Accedi al tuo account
3. Vai su "Conversational AI" → "Agents"
4. Crea o seleziona il tuo agent "Joe B"
5. **Agent ID**: si trova nell'URL o nelle impostazioni dell'agent
6. **API Key**: vai su Settings → API Keys

## Struttura del Progetto

```
whatsapp-joe-bot/
├── src/
│   ├── config/           # Configurazione applicazione
│   │   └── index.js
│   ├── handlers/         # Gestori messaggi
│   │   └── messageHandler.js
│   ├── routes/           # Routes Express
│   │   ├── index.js
│   │   └── webhook.js
│   ├── services/         # Servizi business logic
│   │   ├── conversationManager.js
│   │   ├── elevenlabsService.js
│   │   └── whatsappService.js
│   ├── utils/            # Utilità
│   │   └── logger.js
│   └── server.js         # Entry point
├── logs/                 # File di log (creati automaticamente)
├── .env                  # Variabili ambiente (non committare!)
├── .env.example          # Template variabili ambiente
├── .gitignore
├── package.json
└── README.md
```

## Architettura

### Flusso messaggi in arrivo

1. **Webhook** riceve messaggio da WhatsApp
2. **MessageHandler** processa il messaggio:
   - Marca come letto
   - Estrae il contenuto
   - Recupera la conversazione dell'utente
3. **ElevenLabsService** invia al Agent e riceve risposta
4. **ConversationManager** aggiorna lo stato della conversazione
5. **WhatsAppService** invia risposta (testo o audio)

### Gestione conversazioni

- Ogni utente ha una conversazione indipendente
- Le conversazioni sono memorizzate in cache (in-memory)
- Timeout automatico dopo 30 minuti di inattività
- Session ID di ElevenLabs mantenuta per contesto

## API Endpoints

### `GET /webhook`
Verifica del webhook (chiamato da Meta)

### `POST /webhook`
Ricezione messaggi WhatsApp

### `GET /health`
Health check del server

**Risposta:**
```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2025-01-05T10:30:00.000Z"
}
```

### `GET /stats`
Statistiche conversazioni attive

**Risposta:**
```json
{
  "activeConversations": 5,
  "users": ["+39123456789", "+39987654321"],
  "uptime": 123.45,
  "timestamp": "2025-01-05T10:30:00.000Z"
}
```

## Personalizzazione

### Modificare quando inviare audio

Nel file [src/handlers/messageHandler.js](src/handlers/messageHandler.js), modifica il metodo `shouldSendAudioResponse()`:

```javascript
shouldSendAudioResponse(userMessage, botResponse) {
  // Esempio: invia audio solo per messaggi brevi
  return botResponse.length < 200;

  // Oppure: invia sempre testo
  // return false;

  // Oppure: invia sempre audio
  // return true;
}
```

### Modificare timeout conversazioni

Nel file [src/config/index.js](src/config/index.js):

```javascript
conversation: {
  timeoutMinutes: 30,        // Cambia il timeout
  maxMessagesInContext: 10   // Cambia il numero di messaggi memorizzati
}
```

### Aggiungere supporto messaggi audio in input

Attualmente il bot gestisce solo messaggi testuali. Per aggiungere supporto agli audio in input:

1. Integra OpenAI Whisper o un servizio di trascrizione
2. Modifica `messageHandler.js` per trascrivere l'audio
3. Invia la trascrizione a ElevenLabs

## Logging

I log sono salvati in:
- `logs/combined.log` - tutti i log
- `logs/error.log` - solo errori

Livelli di log configurabili in `.env`:
```env
LOG_LEVEL=debug  # debug, info, warn, error
```

## Troubleshooting

### Il webhook non riceve messaggi

1. Verifica che ngrok sia in esecuzione
2. Controlla che l'URL del webhook sia corretto su Meta
3. Verifica il verify token
4. Controlla i log: `tail -f logs/combined.log`

### Errore "Missing required environment variables"

Verifica che tutte le variabili in `.env` siano configurate correttamente.

### ElevenLabs non risponde

1. Verifica la tua API key
2. Controlla l'Agent ID
3. Verifica il credito rimanente su ElevenLabs
4. Controlla i log per errori specifici

### Audio non inviati

1. Verifica che ElevenLabs restituisca l'audio (controlla i log)
2. Controlla che il formato audio sia supportato da WhatsApp
3. Verifica i permessi del tuo numero WhatsApp Business

## Sicurezza

- Non committare mai il file `.env`
- Usa HTTPS per il webhook in produzione
- Valida sempre i payload ricevuti
- Implementa rate limiting per prevenire abusi
- Usa variabili d'ambiente per credenziali sensibili

## Limitazioni

- Messaggi audio in input non ancora supportati
- Cache conversazioni in-memory (si perde al restart)
- Nessun database persistente
- Rate limits di WhatsApp e ElevenLabs applicabili

## Prossimi passi

- [ ] Supporto trascrizione audio in input (Whisper)
- [ ] Database per persistenza conversazioni
- [ ] Rate limiting
- [ ] Analytics e metriche
- [ ] Comandi admin via WhatsApp
- [ ] Multi-lingua
- [ ] Fallback per downtime ElevenLabs

## Licenza

MIT

## Supporto

Per problemi o domande, apri una issue nel repository.
