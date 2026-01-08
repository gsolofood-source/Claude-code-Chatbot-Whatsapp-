# Guida al Deploy della Dashboard

## 🎯 Dove Deployare

Hai **2 opzioni** per deployare la dashboard:

### Opzione 1: Railway ⭐ (Consigliata)

**Pro:**
- Hai già il backend su Railway
- Tutto in un posto, più facile da gestire
- Variabili d'ambiente condivise

**Contro:**
- Leggermente più costoso di Vercel (ma comunque economico)

### Opzione 2: Vercel (Alternativa)

**Pro:**
- Gratis per progetti personali
- Ottimizzato specificamente per Next.js
- Deploy automatici da GitHub
- CDN globale ultra veloce

**Contro:**
- Dashboard e backend in posti diversi

---

## 🚀 Deploy su Railway (Consigliato)

### Passo 1: Accedi a Railway

1. Vai su [railway.app](https://railway.app)
2. Fai login con GitHub

### Passo 2: Crea Nuovo Progetto

1. Clicca **"New Project"**
2. Seleziona **"Deploy from GitHub repo"**
3. Scegli il repository: `Claude-code-Chatbot-Whatsapp-`
4. Railway rileverà automaticamente la dashboard

### Passo 3: Configura Root Directory

⚠️ **IMPORTANTE**: La dashboard è in una sottocartella!

1. Nelle impostazioni del servizio, vai su **"Settings"**
2. Trova **"Root Directory"**
3. Imposta: `whatsapp-joe-dashboard 2`
4. Salva

### Passo 4: Aggiungi Variabili d'Ambiente

Vai su **"Variables"** e aggiungi:

```bash
# URL del backend (usa l'URL del tuo backend Railway)
BOT_API_URL=https://your-backend-url.railway.app

# Esempio se il backend è su Railway:
# BOT_API_URL=https://whatsapp-joe-bot-production.up.railway.app

# Next.js
NODE_ENV=production
```

### Passo 5: Deploy!

1. Clicca **"Deploy"**
2. Aspetta 2-3 minuti
3. Railway ti darà un URL tipo: `https://dashboard-xxx.railway.app`

### Passo 6: Testa

Apri l'URL generato da Railway e clicca su **"Chat Logs"**!

---

## 🎨 Deploy su Vercel (Alternativa)

### Passo 1: Installa Vercel CLI (Opzionale)

```bash
npm install -g vercel
```

### Passo 2: Deploy da Web UI

1. Vai su [vercel.com](https://vercel.com)
2. Fai login con GitHub
3. Clicca **"Add New Project"**
4. Importa il repository `Claude-code-Chatbot-Whatsapp-`

### Passo 3: Configura Root Directory

⚠️ **IMPORTANTE**:

1. In **"Root Directory"**, imposta: `whatsapp-joe-dashboard 2`
2. Framework Preset: **Next.js** (auto-rilevato)
3. Build Command: `npm run build` (auto-rilevato)
4. Output Directory: `.next` (auto-rilevato)

### Passo 4: Aggiungi Variabili d'Ambiente

Nella sezione **"Environment Variables"**:

```bash
BOT_API_URL=https://your-backend-url.railway.app
NODE_ENV=production
```

### Passo 5: Deploy!

1. Clicca **"Deploy"**
2. Aspetta 1-2 minuti
3. Vercel ti darà un URL tipo: `https://dashboard-xxx.vercel.app`

---

## 🔧 Configurazione Finale Backend

Una volta deployata la dashboard, devi configurare il **CORS** sul backend per accettare richieste dalla dashboard.

### Backend: Aggiungi CORS

Nel file `src/server.js` del backend, aggiungi:

```javascript
import cors from 'cors';

// Dopo const app = express();
app.use(cors({
  origin: [
    'https://your-dashboard.railway.app',
    'https://your-dashboard.vercel.app',
    'http://localhost:3001' // Per sviluppo
  ],
  credentials: true
}));
```

Installa cors se non c'è già:

```bash
npm install cors
```

Poi fai commit e push per aggiornare il backend su Railway.

---

## ✅ Dopo il Deploy

La dashboard sarà accessibile a questo URL:

- **Railway**: `https://your-dashboard.railway.app`
- **Vercel**: `https://your-dashboard.vercel.app`

### Test Rapido:

1. Apri l'URL della dashboard
2. Clicca su **"Chat Logs"** nella sidebar
3. Dovresti vedere i 20 messaggi di test!

---

## 💡 Quale Scegliere?

### Usa Railway se:
- ✅ Vuoi tutto in un posto
- ✅ Preferisci gestire un solo account
- ✅ Non ti preoccupa qualche dollaro al mese

### Usa Vercel se:
- ✅ Vuoi il piano gratuito
- ✅ Vuoi performance ottimali per Next.js
- ✅ Ti va bene avere backend e frontend separati

---

## 🆘 Problemi Comuni

### Dashboard non si connette al backend

**Problema**: `Bot API unreachable`

**Soluzione**:
1. Verifica che `BOT_API_URL` sia corretto
2. Verifica che il backend sia online: `curl https://your-backend.railway.app/health`
3. Controlla che CORS sia configurato correttamente

### Deploy fallisce su Railway

**Problema**: "Build failed"

**Soluzione**:
1. Verifica che "Root Directory" sia: `whatsapp-joe-dashboard 2`
2. Controlla i log del build
3. Assicurati che `package.json` abbia lo script `build`

### 404 su Vercel

**Problema**: Tutte le pagine danno 404

**Soluzione**:
1. Verifica che "Root Directory" sia configurato correttamente
2. Assicurati che il build sia completato con successo
3. Controlla che `.next` sia nella directory corretta

---

## 📊 Costi Stimati

### Railway
- **Hobby Plan**: ~$5-10/mese
- Include backend + dashboard
- 500 ore di esecuzione al mese

### Vercel
- **Hobby Plan**: **GRATIS**
- Bandwidth: 100 GB/mese
- Serverless Functions: 100 GB-ore

### Raccomandazione
Per iniziare: **Vercel** (gratis)
Per produzione seria: **Railway** (tutto insieme)

---

## 🎉 Done!

Una volta deployata, avrai la dashboard sempre accessibile da qualsiasi dispositivo!

URL della dashboard: `https://your-dashboard.railway.app` o `.vercel.app`

Clicca su "Chat Logs" e vedi i tuoi log in tempo reale! 🚀
