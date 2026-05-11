# Progetti — Piano di implementazione

## Obiettivo
Aggiungere una sezione **Progetti** che funge da contenitore. Ogni progetto ha tre schede: **Project Scope**, **Preventivi**, **Conferma Ordine**. Scope e Conferma Ordine partono da moduli template e generano un PDF stampabile, coerente con il PDF preventivi esistente.

## Modello dati (Supabase)

Tre nuove tabelle, tutte con RLS `auth.uid() = user_id`:

- **`projects`** — `id`, `user_id`, `name`, `client_name`, `client_company`, `client_email`, `client_phone`, `client_address`, `status` (attivo/chiuso/archiviato), `notes`, `created_at`, `updated_at`.
- **`project_scopes`** — `id`, `user_id`, `project_id`, `data` (jsonb, contiene tutti i campi del modulo scope, struttura definita quando passi i campi), `created_at`, `updated_at`. Uno per progetto.
- **`order_confirmations`** — `id`, `user_id`, `project_id`, `data` (jsonb), `created_at`, `updated_at`. Uno per progetto (o multipli se serve).

Sulla tabella **`quotes`** esistente: aggiungere colonna nullable `project_id uuid` + indice. I preventivi possono esistere senza progetto (collegamento opzionale).

## Navigazione e UI

- Nuova voce sidebar **"Progetti"** (icona `FolderKanban`), posizionata sopra "Preventivi".
- `/projects` → lista progetti (card con nome, cliente, stato, n° preventivi, valore totale) + pulsante "Nuovo progetto".
- `/projects/:id` → dettaglio progetto con tabs shadcn:
  - **Scope** — form template; se vuoto mostra "Compila scope"; pulsante "Genera PDF".
  - **Preventivi** — lista preventivi collegati + pulsante "Nuovo preventivo" che porta a `/new-quote?projectId=...` precompilando il cliente. Possibilità di "Collega preventivo esistente" via dialog di selezione.
  - **Conferma Ordine** — form template; pulsante "Genera PDF".
- Dalla pagina `/quotes` aggiungere un piccolo badge/link al progetto se `project_id` è valorizzato.
- `NewQuote` legge `?projectId=` dalla query: precompila cliente, salva con `project_id`, e dopo il salvataggio torna alla scheda Preventivi del progetto.

## Form template Scope / Conferma Ordine

I campi specifici li passi tu nel prossimo messaggio. Per ora struttura:
- Componente generico `<TemplateForm schema={...} value={...} onChange={...} />` che renderizza i campi dallo schema (text/textarea/number/date/select/lista ripetibile).
- Schema separato per Scope e per Conferma Ordine, in `src/features/projects/templates/`.
- Salvataggio in `data` jsonb → facile evolvere senza migrazioni.

## Generazione PDF

Riusare lo stile del PDF preventivi esistente:
- Nuovi file in `src/utils/pdf/`:
  - `generateScopePdf.ts`
  - `generateOrderConfirmationPdf.ts`
- Entrambi usano `createPdfBase()` e un nuovo `renderProjectHeader(ctx, project)` derivato da `renderHeader` (stesso font, margini, footer pagine).
- Sezioni del PDF popolate dai campi del template; totalmente coerenti tipograficamente con il PDF preventivi (Helvetica, header centrato, blocco cliente).
- Pulsanti "Genera PDF" nelle rispettive tab.

## File principali da creare

```
src/pages/Projects.tsx                       — lista
src/pages/ProjectDetail.tsx                  — tabs Scope/Preventivi/Conferma
src/features/projects/
  ProjectForm.tsx                            — crea/modifica progetto
  ProjectCard.tsx
  tabs/ScopeTab.tsx
  tabs/QuotesTab.tsx
  tabs/OrderConfirmationTab.tsx
  templates/scopeSchema.ts                   — definito quando passi i campi
  templates/orderConfirmationSchema.ts
  components/TemplateForm.tsx
src/hooks/useProjects.ts                     — CRUD progetti
src/hooks/useProjectScope.ts
src/hooks/useOrderConfirmation.ts
src/utils/pdf/generateScopePdf.ts
src/utils/pdf/generateOrderConfirmationPdf.ts
```

## File da modificare

- `src/App.tsx` — route `/projects` e `/projects/:id`.
- `src/components/app-sidebar.tsx` — voce "Progetti".
- `src/pages/NewQuote.tsx` — supporto `?projectId=` (precompila cliente, salva `project_id`, redirect).
- `src/pages/Quotes.tsx` / `QuoteListItem.tsx` — badge progetto se collegato.
- `src/hooks/useQuotes.ts` — includere `project_id` in select/insert/update.
- `src/types/quote.ts` — aggiungere `project_id?: string`.

## Migrazione DB (riepilogo per non tecnici)

- Crea tabella **Progetti** con cliente, stato, note.
- Crea tabella **Scope di progetto** (un modulo per progetto).
- Crea tabella **Conferme d'ordine** collegate al progetto.
- Aggiunge il collegamento opzionale **progetto** ai preventivi esistenti (i vecchi preventivi restano validi senza progetto).
- Solo l'utente proprietario può vedere/modificare i propri progetti, scope, conferme.

## Cose volutamente fuori scope per ora

- Definizione campi specifici di Scope e Conferma Ordine (li darai nel prossimo messaggio — al momento parte come schema vuoto/placeholder).
- Workflow di approvazione/firma elettronica.
- Conversione automatica Scope → Preventivo.

## Passaggi successivi dopo approvazione

1. Migrazione DB.
2. Hook + pagine Progetti (lista + dettaglio + tab Preventivi funzionante).
3. `TemplateForm` generico + schemi Scope/Conferma (placeholder finché non passi i campi).
4. Generatori PDF.
5. Aggancio NewQuote ↔ progetto.
