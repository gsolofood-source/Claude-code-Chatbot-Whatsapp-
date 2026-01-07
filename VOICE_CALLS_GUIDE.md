# WhatsApp Voice Calls - Guida Completa

Guida per utilizzare le chiamate vocali con il bot WhatsApp Joe Bastianich.

---

## 📞 Cos'è la Funzione Chiamate

Con 2,000 messaggi WhatsApp abilitati, ora puoi:

- ✅ **Chiamare utenti** direttamente da WhatsApp
- ✅ **Ricevere chiamate** dagli utenti
- ✅ **AI Conversazionale** in tempo reale con voce Joe Bastianich
- ✅ **Trascrizione automatica** con OpenAI Whisper
- ✅ **Sintesi vocale** con ElevenLabs

---

## 🚀 API Endpoints

### 1. Inizia Chiamata (Outbound)

**POST** `/calls/initiate`

Inizia una chiamata vocale verso un utente.

**Request Body:**
```json
{
  "to": "+393331234567",
  "reason": "follow_up"
}
```

**Parameters:**
- `to` (required): Numero telefono con prefisso internazionale
- `reason` (optional): Motivo chiamata (es: "follow_up", "support", "sales")

**Response:**
```json
{
  "success": true,
  "callId": "wamid.ABcDEf123...",
  "message": "Call initiated. User will receive WhatsApp voice call."
}
```

**Esempio cURL:**
```bash
curl -X POST http://localhost:3001/calls/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+393331234567",
    "reason": "follow_up"
  }'
```

---

### 2. Termina Chiamata

**POST** `/calls/:callId/end`

Termina una chiamata in corso.

**Response:**
```json
{
  "success": true,
  "callId": "wamid.ABcDEf123...",
  "duration": 120
}
```

**Esempio cURL:**
```bash
curl -X POST http://localhost:3001/calls/wamid.ABcDEf123.../end
```

---

### 3. Chiamate Attive

**GET** `/calls/active`

Ottieni lista delle chiamate attualmente in corso.

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
      "status": "in_progress"
    },
    {
      "call_id": "wamid.XYZ...",
      "user": "393******287",
      "duration": 12,
      "status": "ringing"
    }
  ]
}
```

**Esempio cURL:**
```bash
curl http://localhost:3001/calls/active
```

---

## 🎯 Come Funziona

### Flusso Chiamata Outbound (Bot → Utente)

```
1. API Call (/calls/initiate)
   ↓
2. WhatsApp invia chiamata vocale all'utente
   ↓
3. Utente risponde
   ↓
4. Audio streaming inizia
   ↓
5. Bot ascolta → Trascrizione (Whisper)
   ↓
6. OpenAI processa richiesta
   ↓
7. ElevenLabs genera voce Joe
   ↓
8. Bot risponde con audio
   ↓
9. Conversazione continua fino a hangup
```

### Flusso Chiamata Inbound (Utente → Bot)

```
1. Utente chiama numero WhatsApp
   ↓
2. Webhook riceve evento "call.initiated"
   ↓
3. Bot risponde automaticamente
   ↓
4. Conversazione AI attiva
   ↓
5. Audio processato in tempo reale
```

---

## ⚙️ Configurazione WhatsApp Business

### Passo 1: Abilita Chiamate nel Dashboard Meta

1. Vai su https://developers.facebook.com/apps
2. Seleziona la tua app WhatsApp
3. Menu → **WhatsApp** → **Settings**
4. Nella sezione **Voice Calls**:
   - ✅ Enable voice calls
   - ✅ Set webhook URL for call events

### Passo 2: Configura Webhook per Chiamate

**Webhook URL:**
```
https://cf437e36ce2f.ngrok-free.app/calls/webhook
```

**Eventi da sottoscrivere:**
- ✅ `calls` - Eventi chiamata
- ✅ `call_status` - Aggiornamenti stato

### Passo 3: Configura Numero Telefono

Il tuo numero WhatsApp Business deve:
- ✅ Essere verificato
- ✅ Avere piano con chiamate abilitate (2k+ messaggi)
- ✅ Avere webhook configurato correttamente

---

## 🔊 Stati Chiamata

| Stato | Descrizione |
|-------|-------------|
| `initiated` | Chiamata iniziata, in attesa risposta |
| `ringing` | Telefono sta squillando |
| `in_progress` | Chiamata attiva, conversazione in corso |
| `completed` | Chiamata terminata con successo |
| `failed` | Chiamata fallita |
| `no_answer` | Utente non ha risposto |
| `busy` | Utente occupato |

---

## 💡 Esempi d'Uso

### Esempio 1: Chiamata Automatica di Follow-up

```javascript
// Dopo che un utente ha fatto un ordine
const response = await fetch('http://localhost:3001/calls/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+393331234567',
    reason: 'order_confirmation'
  })
});

const { callId } = await response.json();
console.log(`Call initiated: ${callId}`);
```

### Esempio 2: Bot Risponde a Chiamata In Entrata

Il bot risponde automaticamente quando riceve una chiamata:

```
Utente chiama → Bot: "Ciao! Sono Joe Bastianich. Come posso aiutarti oggi?"
```

### Esempio 3: Conversazione Completa

```
Bot: "Ciao, sono Joe Bastianich. Cosa posso fare per te?"
User: "Voglio aprire un ristorante"
Bot: "Fantastico! Hai già un concept in mente? Che tipo di cucina?"
User: "Pensavo cucina italiana tradizionale"
Bot: "Ottima scelta. La cucina italiana è la mia passione.
     Ti serve aiuto con il business plan o la scelta della location?"
```

---

## 🧪 Testing

### Test 1: Verifica Endpoint Chiamate

```bash
# Verifica che il servizio sia attivo
curl http://localhost:3001/calls/active

# Dovrebbe rispondere:
# {"success":true,"active_calls":0,"calls":[]}
```

### Test 2: Chiamata di Prova

```bash
# Sostituisci con il tuo numero di test
curl -X POST http://localhost:3001/calls/initiate \
  -H "Content-Type: application/json" \
  -d '{"to": "+39YOUR_NUMBER", "reason": "test"}'
```

**Cosa aspettarsi:**
1. Ricevi chiamata WhatsApp sul tuo telefono
2. Rispondi
3. Senti voce Joe Bastianich che ti saluta
4. Puoi parlare e il bot risponde

### Test 3: Monitoring Chiamate

Mentre una chiamata è attiva:

```bash
# In un terminale separato
watch -n 1 'curl -s http://localhost:3001/calls/active'
```

Vedrai aggiornamenti in tempo reale delle chiamate attive.

---

## 📊 Monitoring & Logs

### Log Events Chiamata

Il bot logga tutti gli eventi chiamata:

```
INFO: Initiating voice call to 393******154
INFO: Voice call initiated successfully, call_id: wamid.ABC...
INFO: Call event: in_progress, call_id: wamid.ABC...
INFO: User speech transcribed: "Ciao Joe, come stai?"
INFO: AI response generated, response_length: 142
INFO: Audio response generated, audio_size: 45632
INFO: Call ended successfully, duration_seconds: 120
```

### Metriche Importanti

- **Active Calls**: Numero chiamate simultanee
- **Avg Call Duration**: Durata media chiamate
- **Success Rate**: % chiamate completate vs fallite
- **Response Latency**: Tempo tra domanda utente e risposta bot

---

## ⚠️ Limitazioni & Considerazioni

### Limitazioni WhatsApp API

1. **Numero Simultaneo Chiamate**:
   - Dipende dal piano WhatsApp Business
   - Con 2k messaggi: tipicamente 5-10 chiamate simultanee

2. **Durata Massima**:
   - WhatsApp limita durata chiamate (tipicamente 60 min)
   - Consigliato: chiama terminata entro 15-20 minuti

3. **Costi**:
   - Ogni minuto di chiamata ha un costo
   - Verifica pricing su Meta Business Manager

### Best Practices

✅ **DO:**
- Testa in ambiente di sviluppo prima
- Implementa timeout per chiamate lunghe
- Monitora chiamate attive
- Logga tutti gli eventi
- Gestisci errori gracefully

❌ **DON'T:**
- Non chiamare numeri non verificati
- Non fare spam con chiamate automatiche
- Non superare limiti simultanei
- Non dimenticare di terminare chiamate

---

## 🔧 Troubleshooting

### Problema: "Call failed to initiate"

**Causa**: Numero non valido o non verificato
**Soluzione**:
1. Verifica formato numero: `+[country][number]`
2. Controlla che il numero sia WhatsApp Business verified
3. Verifica limiti piano (2k messaggi)

### Problema: "Audio not processing"

**Causa**: Problemi con Whisper o ElevenLabs
**Soluzione**:
1. Verifica API keys in `.env`
2. Controlla logs per errori specifici
3. Testa Whisper/ElevenLabs separatamente

### Problema: "Call webhook not receiving events"

**Causa**: Webhook non configurato correttamente
**Soluzione**:
1. Verifica URL webhook su Meta Dashboard
2. Assicurati che ngrok sia attivo
3. Controlla sottoscrizione eventi `calls`

---

## 📈 Prossimi Step

### Miglioramenti Futuri

1. **Streaming Audio in Tempo Reale**:
   - WebRTC integration per latenza < 200ms
   - Buffer audio ottimizzato

2. **Call Recording**:
   - Salva registrazioni chiamate
   - Trascrizioni complete

3. **Multi-lingua**:
   - Rileva lingua utente automaticamente
   - Risponde nella lingua dell'utente

4. **Call Analytics**:
   - Dashboard con metriche chiamate
   - Sentiment analysis conversazioni
   - Call heatmap (orari più attivi)

5. **IVR (Interactive Voice Response)**:
   - Menu vocale: "Premi 1 per..., Premi 2 per..."
   - Transfer a operatore umano

---

## 🔐 Sicurezza

### Protezioni Implementate

✅ **Webhook Signature Verification** - Solo Meta può inviare eventi
✅ **Phone Number Masking** - Privacy nei log
✅ **Rate Limiting** - Previene abusi
✅ **Call Duration Limits** - Evita chiamate infinite

### Dati Sensibili

**MAI committare**:
- Access tokens WhatsApp
- API keys ElevenLabs/OpenAI
- Numeri telefono reali nei log

**Sempre usare**:
- Variabili d'ambiente (`.env`)
- Phone masking nei log
- HTTPS per webhook

---

## 📚 Risorse

- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/make-calls
- **ElevenLabs Conversational AI**: https://elevenlabs.io/docs/conversational-ai
- **OpenAI Whisper**: https://platform.openai.com/docs/guides/speech-to-text

---

## 💬 Supporto

Per problemi o domande:
1. Controlla logs in `/logs/app.log`
2. Verifica configurazione WhatsApp
3. Testa endpoint `/calls/active`

---

**Status**: ✅ Voice Calls API Ready
**Version**: 1.0
**Last Updated**: 2026-01-07
