# Apps

Questa cartella contiene le app standalone che possono essere attivate come servizi del chatbot.

## App disponibili

| App | Descrizione | Status |
|-----|-------------|--------|
| [digital-checkup](./digital-checkup/) | Analisi presenza digitale (Sito, Instagram, GMB) | ✅ Attiva |

---

## Struttura standard

Ogni app segue questa struttura:

```
nome-app/
├── frontend/      → Interfaccia web
├── api/           → Backend (se necessario)
└── README.md      → Documentazione
```

---

## Come aggiungere una nuova app

1. Crea cartella in `/apps`
2. Aggiungi `frontend/` e/o `api/`
3. Documenta in `README.md`
4. Aggiorna questa lista
