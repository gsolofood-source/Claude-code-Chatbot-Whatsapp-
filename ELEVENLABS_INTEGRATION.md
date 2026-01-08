# 🎙️ ElevenLabs Integration - Setup Guide

## ✅ MODIFICHE COMPLETATE

**Commit:** `15faaad` - Refactor: Backend logs only, ElevenLabs handles all text/audio responses

### File Modificati

1. **`src/handlers/messageHandler.js`**
   - **TEXT messages**: Solo logging, nessuna risposta (ElevenLabs risponderà)
   - **AUDIO messages**: Trascrizione + logging, nessuna risposta (ElevenLabs risponderà)
   - **IMAGE messages**: Flusso completo mantenuto (backend analizza con GPT-4 Vision e risponde)

2. **`src/routes/elevenlabsWebhook.js`** (NUOVO)
   - Endpoint per ricevere webhook da ElevenLabs Agent
   - Logga le risposte dell'agent nella dashboard

3. **`src/routes/index.js`**
   - Registrata nuova route: `POST /webhook/elevenlabs`

---

## 🔧 CONFIGURAZIONE ELEVENLABS

### 1. URL Webhook Backend

Configura ElevenLabs per inviare webhook al tuo backend Railway:

```
https://il-tuo-backend.railway.app/webhook/elevenlabs
```

**Dove trovarlo:**
- Vai su [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
- Seleziona il tuo Agent
- Settings → Webhooks
- Aggiungi URL webhook

---

### 2. Eventi da Abilitare

Abilita questi eventi nel webhook ElevenLabs:

| Evento | Descrizione | Azione Backend |
|--------|-------------|----------------|
| ✅ **agent_response** | Risposta generata dall'agent | **Logga come "assistant"** |
| ✅ **conversation_end** | Conversazione terminata | Log evento |
| ⚪ **user_transcript** | Trascrizione messaggio utente | Ignorato (già loggato da WhatsApp) |
| ⚪ **interruption** | Utente interrompe agent | Log evento |
| ⚪ **ping** | Health check | Log evento |

---

### 3. Formato Webhook ElevenLabs

Il backend si aspetta eventi in questo formato:

```json
{
  "type": "agent_response",
  "conversation_id": "conv_123456",
  "user_id": "393xxxxxxxxx",
  "agent_response": "Ciao! Come posso aiutarti oggi?",
  "timestamp": "2026-01-08T15:30:00.000Z"
}
```

**Campi supportati per il messaggio:**
- `agent_response` (preferito)
- `response` (fallback)
- `text` (fallback)

---

## 🔄 FLUSSO COMPLETO

### Messaggio TEXT da Utente

```
1. User → WhatsApp → "Ciao, come stai?"
2. WhatsApp → Backend /webhook
3. Backend: LOG "user: Ciao, come stai?" ✅
4. Backend: RETURN (no response) ✅
5. WhatsApp → ElevenLabs Agent
6. ElevenLabs: Genera risposta "Ciao! Sto benissimo, grazie!"
7. ElevenLabs → Backend /webhook/elevenlabs
8. Backend: LOG "assistant: Ciao! Sto benissimo, grazie!" ✅
9. ElevenLabs → WhatsApp → User riceve risposta ✅
```

### Messaggio AUDIO da Utente

```
1. User → WhatsApp → [audio messaggio vocale]
2. WhatsApp → Backend /webhook
3. Backend: Scarica audio + Trascrivi con Whisper ✅
4. Backend: LOG "user: [trascrizione]" ✅
5. Backend: RETURN (no response) ✅
6-9. [Stesso flusso di sopra con ElevenLabs]
```

### Messaggio IMAGE da Utente

```
1. User → WhatsApp → [foto di un piatto]
2. WhatsApp → Backend /webhook
3. Backend: Analizza con GPT-4 Vision ✅
4. Backend: LOG "user: [Image sent]" ✅
5. Backend: LOG "assistant: [analisi]" ✅
6. Backend → WhatsApp → User riceve analisi ✅
```

**Nota:** ElevenLabs NON gestisce le immagini, quindi il backend risponde direttamente.

---

## 🐛 TROUBLESHOOTING

### Dashboard mostra ancora "Mi dispiace, non riesco a processare"

**Causa:** Log vecchi salvati prima del refactoring

**Soluzione:**
```bash
# Elimina i log vecchi
rm logs/chats/chat-log-*.json

# Invia un nuovo messaggio di test
# La dashboard ora mostrerà i log corretti
```

---

### Backend riceve doppi messaggi

**Causa:** Webhook WhatsApp duplicato

**Soluzione:** Già gestita nel codice - il backend logga solo una volta per messageId

---

### ElevenLabs non invia webhook

**Verifica:**

1. **URL corretto:**
   ```bash
   curl -X POST https://il-tuo-backend.railway.app/webhook/elevenlabs \
     -H "Content-Type: application/json" \
     -d '{"type":"ping"}'

   # Dovresti ricevere: {"received":true}
   ```

2. **Controlla i log Railway:**
   - Cerca "ElevenLabs webhook received"
   - Se non vedi log, il webhook non sta arrivando

3. **Verifica configurazione ElevenLabs:**
   - Dashboard → Agent → Settings → Webhooks
   - URL deve essere ESATTAMENTE: `https://your-backend.railway.app/webhook/elevenlabs`
   - Eventi abilitati: `agent_response`

---

## 📊 MONITORAGGIO

### Verifica Logs Backend

```bash
# Controlla se i webhook ElevenLabs arrivano
grep "ElevenLabs webhook received" logs/*.log

# Controlla se le risposte vengono loggate
grep "ElevenLabs response logged" logs/*.log
```

### Verifica Dashboard

1. Vai su: `https://your-dashboard.railway.app/chat-logs`
2. Dovresti vedere:
   - Messaggi utente (role: "user")
   - Risposte ElevenLabs (role: "assistant", metadata.source: "elevenlabs")
   - Analisi immagini (role: "assistant", no metadata.source)

---

## 🎯 RISULTATI ATTESI

✅ **Niente duplicati**: Backend non risponde più a text/audio
✅ **Log completi**: Tutti i messaggi (user + assistant) sono loggati
✅ **Image handling**: Backend gestisce le immagini (ElevenLabs non lo fa)
✅ **Dashboard funzionante**: Mostra conversazioni complete e corrette
✅ **Performance**: Ridotto carico sul backend (non genera più risposte inutili)

---

## 📝 NOTE IMPORTANTI

1. **Whisper Transcription**: Il backend trascrive ancora gli audio per logging, ma NON genera risposta
2. **Session Management**: ElevenLabs gestisce le sessioni, il backend logga solo
3. **Image Analysis**: Unica funzionalità in cui il backend risponde direttamente
4. **Rate Limits**: Con questa architettura, il backend fa meno chiamate API (solo Whisper per audio, niente OpenAI per text)

---

## 🚀 DEPLOYMENT

**Railway rileverà automaticamente il commit `15faaad` e farà redeploy.**

Dopo il deploy:
1. Configura il webhook su ElevenLabs
2. Invia un messaggio di test su WhatsApp
3. Verifica che arrivi il webhook ElevenLabs con `grep "ElevenLabs webhook" logs/*.log`
4. Controlla la dashboard per vedere i log corretti

---

## 🔗 LINK UTILI

- **Backend Railway**: https://il-tuo-backend.railway.app
- **Dashboard Railway**: https://il-tuo-dashboard.railway.app
- **Webhook Endpoint**: https://il-tuo-backend.railway.app/webhook/elevenlabs
- **ElevenLabs Dashboard**: https://elevenlabs.io/app/conversational-ai
