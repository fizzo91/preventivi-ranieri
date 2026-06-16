## Obiettivo
Trasformare la riga "Engobbio" in tre campi sulla stessa riga:
1. **Dato Engobbio** (€) — input manuale
2. **Rischio %** — input manuale
3. **Totale Engobbio** (€) — calcolato = `dato + (dato × rischio% / 100)`, mostrato in sola lettura

Il valore totale resta quello usato nei calcoli della sezione (somma items + risks + engobbio + finitura) e nel PDF, così da non rompere la logica esistente.

## Modifiche

### 1. `src/types/quote.ts`
Aggiungere due campi opzionali a `QuoteSection`:
- `engobbioBase?: number` (dato inserito)
- `engobbioRiskPct?: number` (rischio %)

Il campo esistente `engobbio: number` continua a contenere il **totale** calcolato (retrocompatibilità con preventivi salvati, PDF, dashboard, calcoli).

### 2. `src/pages/NewQuote.tsx` (righe ~608–619)
Sostituire la riga Engobbio attuale con un layout a 3 campi sulla stessa riga:

```text
[ Engobbio ]   Dato: € [____]   Rischio: [__] %   Totale: € 0,00
```

Su mobile i campi vanno a capo (flex-wrap). Ogni `onChange` su Dato o Rischio:
- aggiorna `engobbioBase` / `engobbioRiskPct`
- ricalcola `engobbio = base + base * pct / 100` e lo salva nella sezione (così `calculateSectionTotal` continua a funzionare).

Per fare un aggiornamento atomico dei 3 campi si userà la funzione `updateSection` esistente (eventualmente chiamata due volte oppure estesa per accettare un patch). Se `updateSection` accetta solo `(id, field, value)`, si introduce un piccolo helper locale che applica più campi insieme per evitare race con i ri-render.

### 3. `src/hooks/useSectionManager.ts`
- Inizializzare nuove sezioni con `engobbioBase: 0`, `engobbioRiskPct: 0`.
- Quando si caricano sezioni da DB/template, se `engobbioBase` è assente fare fallback: `engobbioBase = engobbio`, `engobbioRiskPct = 0` (così i preventivi vecchi restano coerenti).
- Mappare i due nuovi campi nel salvataggio verso Supabase (colonne JSON delle sezioni — verifico se le sezioni sono salvate come JSONB o tabella dedicata prima di scrivere il codice; se JSONB nessuna migrazione serve).

### 4. Nessuna modifica
- `quoteCalculations.ts`: continua a usare `section.engobbio` (totale già aggiornato).
- `usePdfGenerator.ts`: stampa il totale engobbio come oggi.
- Dashboard / Cost analysis: invariati.

## Note tecniche
- Mantengo lo stile coerente con la riga "Finitura" (lasciata invariata, salvo allineamento del wrap se necessario).
- Rispetto la memoria progetto sui campi numerici (conversione punto→virgola già gestita globalmente).
- Nessuna migrazione DB se le sezioni sono persistite come JSONB; verificherò in fase di build.