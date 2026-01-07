# Voice Calls con ElevenLabs Conversational AI - Guida Semplificata

## 🎯 Architettura Semplificata

Il sistema usa **ElevenLabs Conversational AI Agent** per gestire TUTTO:
- ✅ Speech-to-Text (STT)
- ✅ AI Conversation
- ✅ Text-to-Speech (TTS)

**Tutto in un unico servizio!**

---

## 📞 Flusso Chiamata (Semplificato)

```
USER PHONE CALL
       ↓
WhatsApp riceve chiamata
       ↓
Webhook → /webhook (gestisce sia messaggi che chiamate)
       ↓
Bot inizia conversazione ElevenLabs
       ↓
┌─────────────────────────────────────┐
│  ElevenLabs Conversational AI       │
│  --------------------------------   │
│  1. Ascolta utente (STT interno)    │
│  2. Processa con AI (interno)       │
│  3. Risponde con voce Joe (TTS)     │
│                                     │
│  TUTTO GESTITO DA ELEVENLABS        │
│  Latenza: ~300ms                    │
│  No Whisper, No OpenAI necessari    │
└─────────────────────────────────────┘
       ↓
Conversazione continua automaticamente
       ↓
Chiamata termina
       ↓
Trascrizione disponibile per analytics
```

---

## 🚀 API Endpoints

### 1. **POST /calls/initiate** - Inizia Chiamata

Chiama un utente su WhatsApp

```bash
curl -X POST http://localhost:3001/calls/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+393331234567",
    "reason": "follow_up"
  }'
```

**Response:**
```json
{
  "success": true,
  "callId": "wamid.ABC123...",
  "conversationId": "conv_xyz789...",
  "message": "Call initiated. ElevenLabs will handle the conversation automatically."
}
```

---

### 2. **GET /calls/active** - Chiamate Attive

```bash
curl http://localhost:3001/calls/active
```

**Response:**
```json
{
  "success": true,
  "active_calls": 2,
  "calls": [
    {
      "call_id": "wamid.ABC...",
      "user": "393******154",
      "duration": 45,
      "status": "in_progress",
      "reason": "support",
      "elevenlabs_conversation_id": "conv_xyz..."
    }
  ]
}
```

---

### 3. **GET /calls/:callId** - Dettagli Chiamata

```bash
curl http://localhost:3001/calls/wamid.ABC123.../
```

**Response:**
```json
{
  "success": true,
  "callId": "wamid.ABC123...",
  "userId": "393******154",
  "status": "in_progress",
  "duration": 120,
  "reason": "support",
  "direction": "outbound",
  "elevenLabsStatus": {
    "conversationId": "conv_xyz...",
    "status": "active",
    "duration": 120
  }
}
```

---

### 4. **POST /calls/:callId/end** - Termina Chiamata

```bash
curl -X POST http://localhost:3001/calls/wamid.ABC123.../end
```

**Response:**
```json
{
  "success": true,
  "callId": "wamid.ABC123...",
  "conversationId": "conv_xyz...",
  "duration": 180,
  "transcript": {
    "messages": [
      {"role": "user", "content": "Ciao Joe..."},
      {"role": "assistant", "content": "Ciao! Come posso..."}
    ],
    "startTime": "2026-01-07T14:00:00Z",
    "endTime": "2026-01-07T14:03:00Z"
  }
}
```

---

## ⚙️ Configurazione WhatsApp

### Webhook Unificato

WhatsApp usa **un solo webhook** per tutto:

```
URL: https://cf437e36ce2f.ngrok-free.app/webhook
Token: solofood_webhook_secure_2026

Eventi sottoscritti:
✅ messages       → Messaggi testo/audio/immagini
✅ calls          → Chiamate vocali
```

### Come Configurare

1. **Meta Dashboard**: https://developers.facebook.com/apps
2. Tua app → **WhatsApp** → **Configuration**
3. **Webhook** section:
   - URL: `https://cf437e36ce2f.ngrok-free.app/webhook`
   - Token: `solofood_webhook_secure_2026`
4. **Subscribe** to:
   - ✅ `messages`
   - ✅ `calls`

**NOTA**: Non serve webhook separato! Lo stesso webhook gestisce sia messaggi che chiamate.

---

## 🧪 Test Rapido

### 1. Verifica Sistema Attivo

```bash
# Health check
curl http://localhost:3001/health

# Chiamate attive
curl http://localhost:3001/calls/active
```

### 2. Test Chiamata (Sostituisci numero)

```bash
curl -X POST http://localhost:3001/calls/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+39YOUR_NUMBER",
    "reason": "test"
  }'
```

**Cosa succede:**
1. ✅ Ricevi chiamata WhatsApp
2. ✅ Rispondi
3. ✅ ElevenLabs risponde con voce Joe
4. ✅ Parli → ElevenLabs trascrive + processa + risponde
5. ✅ Conversazione fluida (~300ms latency)

---

## 💡 Vantaggi Architettura Semplificata

| Aspetto | Prima (Complesso) | Ora (Semplificato) |
|---------|-------------------|-------------------|
| **Servizi** | Whisper + OpenAI + ElevenLabs | Solo ElevenLabs |
| **Latenza** | ~2-3 secondi | ~300ms |
| **API Calls** | 3 per ogni turno | 1 per chiamata |
| **Costo** | Più alto | Ottimizzato |
| **Complessità** | Alta | Bassa |
| **Manutenzione** | Difficile | Facile |

---

## 🔍 Differenza con Messaggi Audio

### Messaggi Audio WhatsApp
```
User invia audio → Whisper STT → OpenAI → ElevenLabs TTS → Risposta audio
```

**Usa**: Whisper + OpenAI + ElevenLabs (pipeline custom)

### Chiamate Vocali
```
User chiama → ElevenLabs Conversational AI (gestisce tutto) → Risposta
```

**Usa**: Solo ElevenLabs Conversational AI

---

## 📊 Log Example

```
INFO: Starting outbound call to 393******154
INFO: Voice call initiated successfully, whatsapp_call_id: wamid.ABC...
INFO: ElevenLabs conversation started, conversation_id: conv_xyz...
INFO: Call event: in_progress
INFO: Call ended successfully, duration_seconds: 180
INFO: Conversation transcript retrieved, messages_count: 12
```

---

## ⚠️ Limitazioni

1. **Chiamate Simultanee**: 5-10 (dipende da piano WhatsApp)
2. **Durata Max**: 60 minuti (limit WhatsApp)
3. **Costi**: Ogni minuto ha un costo
4. **Qualità Audio**: Dipende da rete utente

---

## 🔧 Troubleshooting

### Problema: "ElevenLabs API error"
**Soluzione**: Verifica `ELEVENLABS_API_KEY` e `ELEVENLABS_AGENT_ID` in `.env`

### Problema: "Call not initiated"
**Soluzione**:
1. Verifica numero formato `+[country][number]`
2. Controlla limiti piano WhatsApp
3. Verifica webhook configurato

### Problema: "No audio in call"
**Soluzione**:
1. Verifica ElevenLabs Conversational AI Agent attivo
2. Controlla logs per errori ElevenLabs
3. Testa agent su ElevenLabs dashboard

---

## 📈 Metriche Importanti

- **Active Calls**: Numero chiamate simultanee
- **Avg Duration**: Durata media chiamate
- **Success Rate**: % chiamate completate
- **Transcript Quality**: Accuratezza trascrizioni

---

## 🎯 Best Practices

✅ **DO:**
- Testa con 1-2 chiamate prima
- Monitora chiamate attive
- Recupera trascrizioni per analytics
- Imposta timeout (es: max 15 minuti)

❌ **DON'T:**
- Non spam chiamate
- Non superare limiti simultanei
- Non dimenticare di terminare chiamate
- Non testare in produzione senza verifica

---

**Status**: ✅ ElevenLabs Conversational AI Implemented
**Version**: 2.0 (Simplified)
**Date**: 2026-01-07
