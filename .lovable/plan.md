# Mediana €/mq per spessore

Oggi sia `useThicknessAverages` (avviso scostamento in NewQuote) sia `useDashboardStats.thicknessCosts` (grafico Dashboard) calcolano un rapporto `somma costi / somma mq` per spessore. Un singolo progetto da molti mq sposta il risultato. Passiamo alla **mediana dei €/mq calcolati per ciascuna sezione**, così ogni sezione conta uno indipendentemente dalla dimensione.

## Cambi

### 1. Nuovo helper `src/utils/quoteCalculations.ts`
Aggiungere `median(values: number[]): number` (gestisce array vuoto → 0, ordina ascendente, media dei due centrali se pari).

### 2. `src/hooks/useThicknessAverages.ts`
- Per ogni sezione valida raccogliere `costPerMq = totalCost / mqReali` in un array per spessore (ignorare la moltiplicazione per `sectionQty`: una sezione = un campione).
- `avgCostPerMq` (manteniamo il nome del campo per non rompere consumer) = `median(samples)`.
- `sectionCount` = numero di campioni.

### 3. `src/hooks/useDashboardStats.ts` → `thicknessCosts`
Per ogni sezione valida calcolare e accumulare quattro campioni per spessore:
- `pietraPerMq = pietraLavorazioni / mqReali`
- `rischioPerMq = rischio / mqReali`
- `finituraPerMq = finitura / mqReali`
- `totalPerMq = (pietraLavorazioni + rischio + finitura) / mqReali`

Output:
- `avgPietraPerMq`, `avgRischioPerMq`, `avgFinituraPerMq`, `averageCostPerMq` = mediana dei rispettivi array.
- `sectionCount` = numero di sezioni considerate.
- `totalMq` = somma `mqReali * sectionQty` (resta indicativo del volume; non più usato per la media).

### 4. UI — comunicare il cambio metodo
- `ThicknessCostChart`: aggiungere sottotitolo "Mediana €/mq per sezione" sotto il titolo della card.
- `NewQuote` riga dell'avviso scostamento: cambiare "Media:" in "Mediana:" nel testo del warning.

## Note
- Nessuna modifica al DB.
- Mantenere il campo `quantity` di sezione: la mediana è per sezione singola, ma una sezione con `quantity > 1` continua a contare come **una** sezione (il moltiplicatore serve ai totali economici, non alla rappresentatività del €/mq).
- Soglia ±15% del warning resta invariata.
