
## Obiettivo

Aggiungere in `Nuovo Preventivo` un pulsante **"Importa da Word"** che accetta un `.docx`, ne estrae il testo, usa l'AI per identificare sezioni (per titolo/capitolo) e voci (descrizione + quantità), fa match automatico sui prodotti del catalogo DT e mostra un'anteprima modificabile prima di aggiungere le sezioni al preventivo corrente.

## UX

1. In `src/pages/NewQuote.tsx` (o nel toolbar sezioni), nuovo bottone `Importa da Word` accanto ad "Aggiungi sezione".
2. Click → dialog `WordImportDialog`:
   - Step 1 — Upload `.docx` (max 5MB), validazione estensione + magic bytes (PK zip header).
   - Step 2 — Loader "Analisi in corso…" mentre l'edge function elabora.
   - Step 3 — Anteprima: lista sezioni proposte con voci (descrizione, quantità, mq, prodotto matchato con badge di confidenza, prezzo). L'utente può:
     - Rinominare sezioni, rimuovere sezioni/voci
     - Cambiare il prodotto matchato (Combobox su prodotti DT) o lasciare "Voce libera"
     - Modificare quantità/mq
   - Pulsante `Aggiungi al preventivo` → crea le sezioni via `useSectionManager`.

## Componenti / File

**Nuovi:**
- `src/components/quotes/WordImportDialog.tsx` — dialog completo con i 3 step, tabella anteprima, mutation di conferma.
- `supabase/functions/parse-word-quote/index.ts` — riceve `{ text: string, products: {id,name,category,price,unit}[] }`, chiama Lovable AI Gateway (`google/gemini-2.5-flash`) con `response_format: json_object` e prompt che chiede l'output:
  ```json
  { "sections": [{ "name": "...", "description": "...",
      "items": [{ "description": "...", "quantity": 1, "mq": null,
                  "matchedProductId": "uuid|null", "confidence": 0.0-1.0 }] }] }
  ```
  Restituisce lo stesso JSON al client. `verify_jwt = true` di default; CORS headers standard; validazione input con Zod.

**Modificati:**
- `src/pages/NewQuote.tsx` — importa e monta `WordImportDialog`, passa callback per aggiungere sezioni tramite l'hook esistente.
- `src/hooks/useSectionManager.ts` — se manca, aggiungere helper `addSectionsFromImport(sections)` che crea sezioni con item precompilati (prezzo/categoria dal prodotto matchato, altrimenti voce libera con price 0).
- `package.json` — aggiungere `mammoth` per l'estrazione testo `.docx` lato client (evita di caricare binari in edge function).

## Flusso tecnico

1. Client: `mammoth.extractRawText({ arrayBuffer })` → stringa con paragrafi separati da `\n`.
2. Client: fetch prodotti DT (usa `useProducts`) → invia lista minimale [id, name, category, price, unit] all'edge function.
3. Edge function `parse-word-quote`:
   - Zod: `text: string.min(10).max(50000)`, `products: array`.
   - Prompt system: "Sei un estrattore di preventivi in pietra lavica. Suddividi il testo per capitoli/titoli in `sections`. Ogni bullet/riga con quantità o mq è un item. Fai match su `products` per nome/descrizione, restituisci `matchedProductId` solo se confidence ≥ 0.6; altrimenti `null`. Estrai `quantity` (default 1) e `mq` (se presente)."
   - Risposta AI → parse JSON → gestione errori 429/402 con messaggi user-friendly (già pattern usato in `generate-description`).
4. Client mostra anteprima; alla conferma costruisce `QuoteSection[]` (tipi da `src/types/quote.ts`) e li aggiunge allo state del preventivo.

## Matching prodotti

Il match lo fa l'AI passandogli il catalogo (nome+categoria). Fallback voce libera se `matchedProductId=null`. Il prezzo viene preso dal prodotto matchato; per voci libere il prezzo resta 0 e l'utente lo compila.

## Fuori scopo

- Nessun parsing di tabelle Word complesse (l'utente ha detto testo libero con elenchi).
- Nessuna modifica al PDF/export.
- Nessuna persistenza dell'import (i dati vanno direttamente nello state del preventivo in creazione).
