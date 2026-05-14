
## Obiettivo

Riorganizzare l'app intorno al concetto di **Progetto** come contenitore di 3 sotto-sezioni: Scope, Preventivo, Trattativa. Rimuovere flussi non più necessari (ODA, calcolatori embedded) e unificare l'export PDF.

---

## 1. Rinomina "Conferma Ordine" → "Trattativa"

- Tab nel `ProjectDetail` rinominata da "Conferma Ordine" a "Trattativa".
- Riuso della tabella esistente `order_confirmations` (campo `data` JSONB già flessibile) — nessuna migration di rename necessaria. Il nome tabella resta interno.
- Nuovo schema della Trattativa (`trattativaSchema.ts`) basato su **righe negoziate per fornitore**:
  - Campo `righe[]` con: descrizione, quantità, prezzo unitario negoziato, fornitore (`fornitore_id` da select), note.
  - Campi testata: data trattativa, note generali.
- Hook rinominato: `useOrderConfirmation` → `useTrattativa` (mantiene query alla stessa tabella).
- File: `src/features/projects/tabs/TrattativaTab.tsx` (sostituisce `OrderConfirmationTab.tsx`).

### Calcolo % differenza

- Caricato il totale del/dei preventivi associati al progetto (`useQuotes` filtrato per `project_id`).
- `Totale Trattativa = somma(riga.qta × riga.prezzo)`.
- `% diff = (Totale Trattativa − Totale Preventivo) / Totale Preventivo × 100`.
- Visualizzata in un badge in cima alla tab + accanto al totale (verde se < 0, rosso se > 0).
- Se ci sono più preventivi nel progetto, somma di tutti.

### Select fornitore nelle righe

- Combobox con ricerca che carica `fornitori` dell'utente.
- Possibilità di righe con fornitori diversi (raggruppamento visivo opzionale per fornitore).

---

## 2. Rimozione ODA

- Eliminata tab "Ordini di Acquisto" da `ProjectDetail.tsx`.
- Eliminati: `src/features/projects/tabs/OrdiniAcquistoTab.tsx`, `src/hooks/useOrdiniAcquisto.ts`.
- **Mantenuti** in DB: `ordini_acquisto`, `oda_righe`, `counters`, RPC `incrementa_oda_counter` (nessuna migration distruttiva, evitiamo perdita dati). Le tabelle restano orfane ma non visibili.
- **Mantenuta** sezione Fornitori in sidebar (serve per la select in Trattativa).

---

## 3. Vista Progetti come elenco a linee

Refactor `src/pages/Projects.tsx`:

- Layout a lista (non card grid). Ogni riga mostra:
  ```text
  [Nome progetto] [Cliente]                   [📋 Scope] [💰 Preventivi] [🤝 Trattativa]   [⋯]
  ```
- Le 3 icone:
  - Cliccabili → `navigate(`/projects/${id}?tab=scope|quotes|trattativa`)`.
  - Stato visivo (colore pieno/outline) in base a se la sezione contiene dati. Per evitare N+1 query: aggiungere una vista o usare query aggregata (`project_scopes`, `quotes` count, `order_confirmations` per project_id) — soluzione semplice: una `useProjectsOverview` che fa 3 SELECT `project_id` su quelle tabelle e mappa in memoria.
- `ProjectDetail.tsx`: leggere `?tab=` da `useSearchParams` e impostare il tab attivo.

---

## 4. Rimozione strumenti dal Preventivo

Nel `NewQuote.tsx` e componenti di sezione:
- Rimuovere bottoni/dialog "Calcolatore Pietra" (StoneCalculator) e "Calcolatore Smaltatura" (EnamelCostCalculator/Dialog) **dall'interno della pagina preventivo**.
- I componenti `StoneCalculator.tsx` e `EnamelCostCalculator.tsx` restano disponibili come tool standalone nella pagina `/tools` (già esistono lì).
- Logica PDF stone summary e enamel appendix nel `generateFullPdf`: lasciata invariata se i dati esistono già su preventivi vecchi (retro-compatibilità). Per i nuovi preventivi semplicemente non verranno popolati.

---

## 5. PDF unificato

- Rimuovere il bottone "PDF Sintetico" dall'UI preventivo.
- Modificare `generateFullPdf.ts`: dopo l'appendice calcoli, **chiamare la logica di rendering sintetico** (estratta da `generateSyntheticPdf.ts`) come ulteriore appendice ("Riepilogo Sintetico").
- Refactor: estrarre la funzione `renderSyntheticContent(ctx, quoteData)` da `generateSyntheticPdf.ts` in modo che sia richiamabile sia standalone (per backward-compat se necessario) sia come appendice.
- `usePdfGenerator`: espone solo `generatePdf` (rimosso `generateSyntheticPdf` dall'interfaccia pubblica).

---

## Migration DB

Una sola migration leggera:

```sql
-- nessun rename tabella; la tabella order_confirmations resta ma rappresenta semanticamente la Trattativa
-- aggiungo solo indice su project_id se non esiste
CREATE INDEX IF NOT EXISTS idx_order_confirmations_project ON public.order_confirmations(project_id);
```

Nessuna modifica strutturale alle tabelle esistenti.

---

## File impattati

**Nuovi**
- `src/features/projects/templates/trattativaSchema.ts`
- `src/features/projects/tabs/TrattativaTab.tsx`
- `src/hooks/useTrattativa.ts`
- `src/hooks/useProjectsOverview.ts`

**Modificati**
- `src/pages/Projects.tsx` — layout lista + icone
- `src/pages/ProjectDetail.tsx` — rinomina tab, rimuove tab ODA, deep-linking via query param
- `src/pages/NewQuote.tsx` — rimuove calcolatori embedded e bottone PDF sintetico
- `src/utils/pdf/generateFullPdf.ts` — appende sintetico in coda
- `src/utils/pdf/generateSyntheticPdf.ts` — estrae `renderSyntheticContent`
- `src/hooks/usePdfGenerator.ts` — semplifica API
- `src/components/app-sidebar.tsx` — (verifica: Fornitori resta, eventuali voci ODA rimosse)

**Rimossi**
- `src/features/projects/tabs/OrderConfirmationTab.tsx`
- `src/features/projects/tabs/OrdiniAcquistoTab.tsx`
- `src/features/projects/templates/orderConfirmationSchema.ts`
- `src/hooks/useOrderConfirmation.ts`
- `src/hooks/useOrdiniAcquisto.ts`

---

## Note tecniche

- Tabella `order_confirmations` viene riusata come storage Trattativa (campo `data` JSONB contiene `{ righe: [...], note, data_trattativa }`). Evita migration distruttive.
- I dati ODA esistenti restano in DB ma non più accessibili da UI (recupero futuro possibile).
- `usePdfGenerator` mantiene la firma `generatePdf(quoteData)`; il sintetico è sempre in appendice.
