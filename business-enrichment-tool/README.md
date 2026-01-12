# Business Data Enrichment Tool

Un'applicazione web che permette di arricchire automaticamente i dati aziendali con informazioni di contatto e presenza online.

## Funzionalità

- **Upload File**: Carica file Excel (.xlsx, .xls) o PDF contenenti dati aziendali (export Creditsafe)
- **Parsing Automatico**: Estrae automaticamente Nome Azienda, Partita IVA, Città e altri dati
- **Enrichment**: Per ogni azienda, trova automaticamente:
  - Profilo Instagram
  - Sito Web ufficiale
  - Link Google My Business (Google Maps)
- **Export**: Esporta i dati arricchiti in un nuovo file Excel formattato

## Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS
- **Parsing Excel**: xlsx
- **Parsing PDF**: pdf-parse
- **Web Scraping**: axios + cheerio
- **Export Excel**: exceljs
- **UI Components**: lucide-react, react-dropzone

## Installazione

```bash
# Clona il repository
git clone <repository-url>
cd business-enrichment-tool

# Installa le dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:3000`

## Utilizzo

### 1. Upload File
- Vai alla pagina "Upload" o trascina un file nella homepage
- Formati supportati: .xlsx, .xls, .pdf
- Max 10MB per file

### 2. Parsing
- Dopo l'upload, il sistema analizza automaticamente il file
- Verifica che i dati siano stati estratti correttamente
- Procedi all'enrichment

### 3. Enrichment
- Configura le opzioni (Instagram, Website, Google Maps)
- Imposta il delay tra le ricerche (default 1.5s)
- Avvia l'enrichment e monitora il progresso in tempo reale

### 4. Risultati
- Visualizza le statistiche aggregate
- Filtra e ordina i risultati
- Scarica il file Excel arricchito

## Formato File Input

Il file Excel deve contenere almeno una di queste colonne:

| Colonna | Descrizione |
|---------|-------------|
| Nome Azienda / Company Name / Ragione Sociale | Nome dell'azienda (obbligatorio) |
| Partita IVA / VAT Number | Partita IVA |
| Città 1 / City / Comune | Città sede |
| Indirizzo 1 / Address | Indirizzo |
| Website / Sito Web | Website esistente (opzionale) |
| Telefono / Phone | Numero di telefono |

## Formato File Output

Il file Excel esportato include tutte le colonne originali più:

| Colonna | Descrizione |
|---------|-------------|
| Instagram URL | Link completo al profilo Instagram |
| Instagram Handle | Username (es. @nomeazienda) |
| Website Verificato | Sito web trovato/verificato |
| Google Maps URL | Link a Google Maps |
| Enrichment Status | Completo/Parziale/Non Trovato |
| Data Enrichment | Data e ora dell'elaborazione |

## Struttura Progetto

```
business-enrichment-tool/
├── app/
│   ├── layout.tsx          # Layout principale
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Stili globali
│   ├── upload/             # Pagina upload
│   ├── enrichment/         # Pagina enrichment
│   ├── results/            # Pagina risultati
│   └── api/
│       ├── upload/         # API upload file
│       ├── parse/          # API parsing
│       ├── enrich/         # API enrichment (SSE)
│       └── export/         # API export Excel
├── components/
│   ├── Sidebar.tsx         # Navigazione
│   ├── FileUploader.tsx    # Upload drag&drop
│   ├── DataTable.tsx       # Tabella risultati
│   ├── ProgressBar.tsx     # Barra progresso
│   ├── CompanyCard.tsx     # Card singola azienda
│   └── ExportButton.tsx    # Bottone export
├── lib/
│   ├── excel-parser.ts     # Parser Excel
│   ├── pdf-parser.ts       # Parser PDF
│   ├── web-scraper.ts      # Logica ricerca web
│   └── utils.ts            # Utility functions
└── types/
    └── index.ts            # TypeScript types
```

## Note Tecniche

### Rate Limiting
L'applicazione implementa un delay configurabile tra le ricerche (default 1.5s) per evitare ban dai motori di ricerca.

### Caching
I dati vengono salvati in localStorage per mantenere lo stato tra le pagine.

### CORS
Le ricerche web vengono effettuate tramite API routes Next.js per evitare problemi CORS.

## Script NPM

```bash
npm run dev      # Avvia in sviluppo
npm run build    # Build produzione
npm run start    # Avvia produzione
npm run lint     # Esegui linting
```

## License

MIT
