# Preventivo da testo con AI (Claude)

Nuovo strumento che trasforma una descrizione testuale del lavoro in una bozza di preventivo, agganciando automaticamente le voci al listino prodotti (DT).

## Come funziona

1. Nella pagina preventivo, accanto a "Importa da Word", un nuovo pulsante **"Genera da testo (AI)"**.
2. Si incolla il testo libero (email del cliente, appunti, capitolato).
3. L'AI Claude analizza il testo, individua sezioni e voci con quantità e unità di misura.
4. Ogni voce viene abbinata al prodotto più simile del listino DT, con un livello di confidenza.
5. Si apre un'**anteprima da confermare**: sezioni, voci, prodotto abbinato, quantità, prezzo DT e totale.
   - Le voci con confidenza bassa sono evidenziate.
   - Si può cambiare il prodotto abbinato, correggere quantità, escludere una voce.
6. Confermando, le sezioni vengono inserite nel preventivo aperto, con tutti i calcoli standard (totali, €/mq, rischi) invariati.

## Chiave API Anthropic

Serve la tua API key Anthropic (console.anthropic.com → API Keys). Te la chiederò con il modulo sicuro: viene salvata come segreto lato backend e mai esposta nel browser. Modello previsto: Claude Sonnet più recente disponibile.

## Dettagli tecnici

- Nuova edge function `quote-from-text`:
  - valida input (zod) e richiede JWT valido;
  - carica i prodotti non archiviati dell'utente (id, nome, codice, categoria, unità, price_dt) tramite il token dell'utente, così l'RLS resta rispettata;
  - passa a Claude testo + catalogo compatto, con output JSON strutturato (sezioni → voci con `product_id`, `quantity`, `unit`, `confidence`, `matched_name`);
  - se il catalogo è grande, pre-filtro lato server (match testuale) per contenere i token;
  - gestione esplicita degli errori 401/429/insufficienti crediti Anthropic.
- Nuovo componente `src/components/quotes/AiQuoteDialog.tsx` con textarea, stato di caricamento e tabella di anteprima editabile.
- Riuso delle utility esistenti (`quoteCalculations`, struttura `QuoteSection`/`QuoteItem` in `src/types/quote.ts`) per costruire le sezioni: nessuna modifica alla logica di calcolo.
- Aggancio in `src/pages/NewQuote.tsx` accanto all'import Word, con la stessa funzione di inserimento sezioni.
