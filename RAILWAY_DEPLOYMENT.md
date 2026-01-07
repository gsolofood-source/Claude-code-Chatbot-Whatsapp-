# Guida Deployment su Railway

Guida step-by-step per deployare il WhatsApp Bot "Joe Bastianich" su Railway.

---

## Prerequisiti

- Account Railway (gratuito per iniziare)
- Repository GitHub del progetto (opzionale, ma consigliato)
- Tutti i valori delle variabili d'ambiente dal file `.env`

---

## Parte 1: Preparazione Repository GitHub (Consigliato)

### Step 1: Inizializza Git (se non già fatto)
```bash
cd "/Users/abmac/Desktop/Claude_P/Chatbot /whatsapp-joe-bot"
git init
git add .
git commit -m "Initial commit - WhatsApp Joe Bot production-ready"
```

### Step 2: Crea Repository su GitHub
1. Vai su https://github.com/new
2. Nome repository: `whatsapp-joe-bot` (o nome a tua scelta)
3. **IMPORTANTE**: Repository **PRIVATO** (contiene credenziali sensibili)
4. Non aggiungere README, .gitignore, o license (già presenti)
5. Clicca "Create repository"

### Step 3: Collega Repository Locale a GitHub
```bash
git remote add origin https://github.com/TUO_USERNAME/whatsapp-joe-bot.git
git branch -M main
git push -u origin main
```

**IMPORTANTE**: Verifica che il file `.env` NON sia stato caricato su GitHub (è già in .gitignore).

---

## Parte 2: Creazione Progetto su Railway

### Step 1: Accedi a Railway
1. Vai su https://railway.app
2. Clicca "Login" in alto a destra
3. Scegli "Login with GitHub" (consigliato per collegamento repository)
4. Autorizza Railway ad accedere al tuo account GitHub

### Step 2: Crea Nuovo Progetto
1. Dashboard Railway → Clicca "New Project"
2. Scegli "Deploy from GitHub repo"
3. Seleziona il repository `whatsapp-joe-bot` dalla lista
4. Railway inizierà automaticamente a rilevare il progetto

### Step 3: Configurazione Iniziale
Railway rileverà automaticamente:
- ✅ Dockerfile presente
- ✅ railway.json presente
- ✅ Node.js project

**Non fare il deploy ancora!** Prima dobbiamo configurare le variabili d'ambiente.

---

## Parte 3: Configurazione Variabili d'Ambiente

### Step 1: Apri Settings del Progetto
1. Nel progetto Railway, clicca sulla scheda del servizio (il container)
2. Vai su "Variables" nel menu laterale

### Step 2: Aggiungi TUTTE le Variabili d'Ambiente

Copia e incolla ESATTAMENTE questi valori dal tuo file `.env` locale:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=974619989064137
WHATSAPP_ACCESS_TOKEN=EAAJECZC6ZCuooBQdM9yD3k8gOZCvwNWnYrBcUPRvCZA9uVfsCdE1ZA2mYyWyGrIrlSoxKeJlLlXhu5EYZBz7lYcRL6TaA0eD9oNQ93gH3YN7gLmPYAZAJuV310BTSzGeJbHnFytoiLSgUJb26telX0L6jVIjfubqW7SZB1LSNF5yxafei36o9s68neQNktR3hGkY4VUNpVPq71hT78FwLWhgwW9KITVBA4uSRivavhJWOML8Tp3GbGURV3trMfDt9CNxF48Amomo8NncgQgJ2IdG
WHATSAPP_VERIFY_TOKEN=solofood_webhook_secure_2026
WHATSAPP_APP_SECRET=13cee1804a73e158e2a1b35cd4914351
WHATSAPP_BUSINESS_ACCOUNT_ID=434267327268373

# ElevenLabs Configuration
ELEVENLABS_API_KEY=sk_9a89d6aa5dded6832861a75a36c9c023f99f6746ed76b117
ELEVENLABS_AGENT_ID=agent_01jwxw994ze21aq5mqsj14crjr

# OpenAI Configuration
OPENAI_API_KEY=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
OPENAI_ASSISTANT_ID=asst_RqlZwdONIwZHZLwBBtDuuALd

# Server Configuration
PORT=3000
NODE_ENV=production

# Logging
LOG_LEVEL=info
```

**IMPORTANTE**:
- ✅ `NODE_ENV` deve essere `production` (non `development`)
- ✅ `LOG_LEVEL` impostato su `info` (non `debug` per risparmiare log in produzione)
- ✅ `PORT` può rimanere `3000` (Railway lo overriderà automaticamente con la sua variabile interna `$PORT`)

### Step 3: Verifica Variabili
Controlla che TUTTE le 12 variabili siano presenti:
- [x] WHATSAPP_PHONE_NUMBER_ID
- [x] WHATSAPP_ACCESS_TOKEN
- [x] WHATSAPP_VERIFY_TOKEN
- [x] WHATSAPP_APP_SECRET
- [x] WHATSAPP_BUSINESS_ACCOUNT_ID
- [x] ELEVENLABS_API_KEY
- [x] ELEVENLABS_AGENT_ID
- [x] OPENAI_API_KEY
- [x] OPENAI_ASSISTANT_ID
- [x] PORT
- [x] NODE_ENV
- [x] LOG_LEVEL

---

## Parte 4: Deploy

### Step 1: Avvia Deploy
1. Clicca "Deploy" nel progetto Railway
2. Railway inizierà il build del Docker container
3. Processo:
   - Building Docker image (2-3 minuti)
   - Installing dependencies
   - Starting application

### Step 2: Monitora Deploy
1. Vai su "Deployments" nel menu laterale
2. Vedrai il log in tempo reale
3. **Cerca questi messaggi**:
   ```
   ✅ WhatsApp Bot Server started on port 3000
   ✅ Webhook verification endpoint ready
   ✅ Deduplication service initialized
   ✅ User queue service initialized
   ```

### Step 3: Ottieni URL Pubblico
1. Vai su "Settings" del servizio
2. Scorri fino a "Networking" o "Domains"
3. Railway genera automaticamente un dominio tipo:
   ```
   https://whatsapp-joe-bot-production.up.railway.app
   ```
4. **COPIA QUESTO URL** - ti servirà per configurare il webhook WhatsApp

**IMPORTANTE**: Annota l'URL completo, esempio:
```
https://whatsapp-joe-bot-production.up.railway.app
```

---

## Parte 5: Aggiornamento Webhook WhatsApp

### Step 1: Costruisci URL Webhook Completo
Il tuo URL webhook sarà:
```
https://whatsapp-joe-bot-production.up.railway.app/webhook
```

### Step 2: Aggiorna Webhook su Meta Dashboard
1. Vai su https://developers.facebook.com/apps
2. Seleziona la tua app WhatsApp
3. Vai su "WhatsApp" → "Configuration"
4. Nella sezione "Webhook":
   - **Callback URL**: `https://whatsapp-joe-bot-production.up.railway.app/webhook`
   - **Verify token**: `solofood_webhook_secure_2026` (lo stesso di `.env`)
5. Clicca "Verify and Save"

### Step 3: Verifica Connessione
1. Meta invierà richiesta GET al tuo webhook
2. Controlla nei log di Railway:
   ```
   INFO: Webhook verification request received
   INFO: Webhook verified successfully
   ```
3. Se vedi ✅ verde su Meta Dashboard → tutto OK!

### Step 4: Sottoscrivi Webhook Events
Assicurati che siano attivi questi eventi:
- [x] messages
- [x] message_status

---

## Parte 6: Test Produzione

### Test 1: Messaggio di Testo
1. Invia messaggio WhatsApp al numero del bot
2. **Testo di esempio**: "Ciao Joe, come stai?"
3. **Risposta attesa**: Testo con tono Joe Bastianich entro 5-10 secondi

### Test 2: Messaggio Audio
1. Invia messaggio vocale WhatsApp
2. **Risposta attesa**: Audio con voce Joe Bastianich entro 15-20 secondi

### Test 3: Verifica Logs Railway
1. Vai su "Logs" nel progetto Railway
2. Dovresti vedere:
   ```
   INFO: Webhook signature verified successfully
   INFO: Processing message: wamid.HBg...
   INFO: Message marked as processed
   INFO: Task enqueued for user 393******154
   INFO: Audio response sent to 393******154
   INFO: Task completed for user 393******154
   ```

### Test 4: Deduplica
1. Invia stesso messaggio 2 volte rapidamente
2. Dovresti ricevere solo 1 risposta
3. Nel log Railway:
   ```
   INFO: Message marked as processed: wamid.HBg...
   INFO: Duplicate message skipped: wamid.HBg...
   ```

---

## Parte 7: Monitoraggio

### Logs in Tempo Reale
```bash
# Railway CLI (opzionale)
railway logs
```

O usa la dashboard Railway: "Logs" → Stream in tempo reale

### Metriche Chiave da Monitorare
1. **Response Time**: Dovrebbe essere 5-20s per audio, 3-8s per testo
2. **Error Rate**: Dovrebbe essere <1%
3. **Duplicate Rate**: Dovrebbe essere basso (<5%)
4. **Queue Overflow**: Non dovrebbe mai accadere

### Endpoint Stats
Puoi controllare stats del bot:
```bash
curl https://whatsapp-joe-bot-production.up.railway.app/stats
```

Risposta attesa:
```json
{
  "activeConversations": 2,
  "dedupStats": {
    "keys": 15,
    "hits": 3,
    "misses": 12
  },
  "queueStats": {
    "active_queues": 1,
    "queues": [...]
  }
}
```

---

## Parte 8: Troubleshooting

### Problema: "Webhook verification failed"
**Causa**: VERIFY_TOKEN sbagliato o URL webhook errato
**Soluzione**:
1. Verifica che `WHATSAPP_VERIFY_TOKEN` in Railway sia esattamente: `solofood_webhook_secure_2026`
2. Verifica URL webhook sia: `https://TUO_DOMINIO.railway.app/webhook` (con `/webhook` alla fine)

### Problema: "Signature verification failed" nei log
**Causa**: APP_SECRET sbagliato
**Soluzione**:
1. Vai su Meta Dashboard → Settings → Basic
2. Copia APP_SECRET (clicca "Show")
3. Aggiorna `WHATSAPP_APP_SECRET` in Railway
4. Redeploy: clicca "Redeploy" nel deployment

### Problema: Bot non risponde ai messaggi
**Checklist**:
- [ ] Logs Railway mostrano richieste in arrivo?
- [ ] Webhook signature verificata con successo?
- [ ] Tutte le 12 variabili d'ambiente sono configurate?
- [ ] `NODE_ENV` è impostato su `production`?
- [ ] OpenAI API key valida?
- [ ] ElevenLabs API key valida?

### Problema: Errori timeout o "Request failed after 3 retries"
**Causa**: Servizi esterni lenti o non raggiungibili
**Soluzione**:
1. Verifica status API esterne:
   - https://status.openai.com
   - https://status.elevenlabs.io
2. Se persistenti, considera aumentare timeout in `httpClient.js`:
   ```javascript
   openai: createHttpClient({
     timeout: 20000,  // da 15000 a 20000
     retries: 3       // da 2 a 3
   })
   ```

### Problema: Costo Railway elevato
**Railway Free Tier**: $5 di credito gratuito/mese
**Costi tipici**:
- Build time: ~$0.01 per build
- Runtime: ~$0.000463 per minuto (~$20/mese se sempre attivo)

**Ottimizzazioni**:
1. Usa "Sleep on Idle" (Railway mette servizio in sleep dopo 5 min inattività)
2. Monitora usage su Railway Dashboard
3. Per produzione seria, considera Railway Pro Plan ($20/mese)

---

## Parte 9: Aggiornamenti Futuri

### Come Aggiornare il Bot

#### Metodo 1: Push su GitHub (Automatico)
```bash
# Fai modifiche al codice
git add .
git commit -m "Update: descrizione modifica"
git push origin main
```

Railway rileverà automaticamente il push e farà redeploy.

#### Metodo 2: Railway CLI
```bash
railway up
```

#### Metodo 3: Dashboard Railway
1. Vai su "Deployments"
2. Clicca "Deploy Latest Commit"

---

## Parte 10: Backup e Sicurezza

### Backup Variabili d'Ambiente
Salva le variabili d'ambiente in un file sicuro (NON committare su GitHub):
```bash
# Esporta variabili da Railway
railway variables --json > railway-vars-backup.json
```

### Rotazione API Keys (Consigliato ogni 3 mesi)
1. **OpenAI**: Vai su https://platform.openai.com/api-keys → Crea nuova key
2. **ElevenLabs**: Vai su https://elevenlabs.io/app/settings → API Keys
3. **WhatsApp Access Token**: Vai su Meta Dashboard → Rigenera token
4. Aggiorna tutte le variabili in Railway
5. Redeploy

### Monitoraggio Sicurezza
- ✅ APP_SECRET verificato attivo (webhook signature verification)
- ✅ HTTPS obbligatorio (Railway default)
- ✅ PII masking attivo nei log
- ✅ Deduplica attiva contro replay attacks

---

## Checklist Finale Deploy

### Pre-Deploy
- [x] Dockerfile creato
- [x] .dockerignore creato
- [x] railway.json creato
- [x] .gitignore aggiornato
- [x] Repository GitHub creato (privato)
- [x] Codice pushato su GitHub

### Railway Setup
- [ ] Account Railway creato
- [ ] Progetto Railway creato
- [ ] Repository GitHub collegato
- [ ] Tutte le 12 variabili d'ambiente configurate
- [ ] NODE_ENV impostato su "production"
- [ ] LOG_LEVEL impostato su "info"

### Deploy & Test
- [ ] Deploy completato con successo
- [ ] URL pubblico ottenuto
- [ ] Webhook WhatsApp aggiornato
- [ ] Webhook verificato (✅ verde su Meta)
- [ ] Test messaggio testo → risposta ricevuta
- [ ] Test messaggio audio → audio risposta ricevuto
- [ ] Logs Railway verificati (nessun errore)
- [ ] Stats endpoint accessibile

### Post-Deploy
- [ ] Backup variabili d'ambiente salvato
- [ ] URL produzione documentato
- [ ] Monitoring attivo
- [ ] Team notificato del nuovo URL

---

## Supporto

### Railway Support
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Twitter: @Railway

### Meta WhatsApp Support
- Docs: https://developers.facebook.com/docs/whatsapp
- Business Support: https://business.facebook.com/help

---

## Riepilogo Comandi Utili

```bash
# Verifica health endpoint
curl https://TUO_DOMINIO.railway.app/health

# Verifica stats
curl https://TUO_DOMINIO.railway.app/stats

# Logs Railway (se hai CLI installato)
railway logs --follow

# Redeploy da terminale
railway up

# Esporta variabili
railway variables --json
```

---

**Versione**: 1.0
**Data**: 2026-01-06
**Status**: Production-ready per Railway deployment
