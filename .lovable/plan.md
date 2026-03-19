

## Plan: Pagina "Archivio Descrizioni" nel menu principale

### Obiettivo

Nuova pagina accessibile dal menu laterale che raccoglie tutte le descrizioni delle sezioni di tutti i preventivi, con riferimento al preventivo di origine. Include funzione di esportazione JSON per addestramento AI.

### Cosa viene creato

**1. Nuova pagina `src/pages/Descriptions.tsx`**
- Carica tutti i preventivi dall'utente via Supabase (`quotes.sections`)
- Estrae da ogni sezione: nome sezione, descrizione, numero preventivo, cliente, data
- Visualizza in una griglia di card con ricerca e filtro
- Ogni card mostra: descrizione, nome sezione, numero preventivo, cliente
- Click su card apre il preventivo collegato
- Pulsante "Scarica JSON" in alto: esporta tutte le descrizioni in formato strutturato per training AI:
  ```json
  [
    {
      "section_name": "Fornitura lastre",
      "description": "Fornitura e posa in opera di...",
      "quote_number": "P-2026-001",
      "client_name": "Mario Rossi",
      "date": "2026-03-01"
    }
  ]
  ```
- Pulsante "Scarica TXT" per formato plain text (una descrizione per blocco, separata da `---`)

**2. Sidebar e routing**
- Aggiunta voce "Descrizioni" nel menu laterale con icona `AlignLeft`, posizionata dopo "Galleria"
- Aggiunta route `/descriptions` in `App.tsx`

### File da creare/modificare

| File | Azione |
|---|---|
| `src/pages/Descriptions.tsx` | Nuovo — pagina archivio descrizioni |
| `src/components/app-sidebar.tsx` | Aggiunta voce menu "Descrizioni" |
| `src/App.tsx` | Aggiunta route `/descriptions` |

