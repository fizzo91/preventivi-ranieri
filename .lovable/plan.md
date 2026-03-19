
# Barra a 3 segmenti con fallback mq

## Cosa cambia

Il grafico "Costo Medio per Spessore" passera' da una singola barra blu a **3 segmenti colorati sovrapposti**, con la logica di fallback per i mq.

### Visualizzazione

```text
50 mm  |████████████████░░░░░░░▓▓▓▓|
        Pietra+Lavoraz.  Rischio Finitura

30 mm  |████████░░░▓▓|
```

| Segmento | Contenuto | Colore |
|----------|-----------|--------|
| Pietra e Lavorazioni | Somma di tutti gli `item.total` | Blu (primary) |
| Rischio | Somma dei costi calcolati dai `risks` | Arancione |
| Finitura | `engobbio` + `finitura` | Verde |

### Logica mq (fallback a 3 livelli)

1. `section.mqTotali` -- se compilato e > 0
2. Quantita' della voce "2 taglio" -- se presente
3. Quantita' della voce PIETRA -- ultima risorsa

Se nessuno e' disponibile o > 0, la sezione viene saltata.

### Tooltip

Al passaggio del mouse:
- Spessore
- Pietra e Lavorazioni: X euro/mq
- Rischio: X euro/mq
- Finitura: X euro/mq
- Totale: X euro/mq
- N sezioni, N mq totali

## Dettagli tecnici

### File: `src/pages/Dashboard.tsx`

**1. Aggiornare l'interfaccia `ThicknessCost`:**

Aggiungere i campi `avgPietraPerMq`, `avgRischioPerMq`, `avgFinituraPerMq`.

**2. Aggiornare il `useMemo` di `thicknessCosts`:**

- Il `thicknessMap` accumulera' 4 valori separati per spessore: `totalPietra`, `totalRischio`, `totalFinitura`, `totalMq`, `count`.
- Per ogni sezione con PIETRA:
  - Determina mq con fallback: `mqTotali` -> quantita' "2 taglio" -> quantita' PIETRA.
  - `pietraLavorazioni` = somma di tutti `item.total` nella sezione.
  - `rischio` = per ogni risk: se `appliedToItemId === 'SECTION_TOTAL'`, applica percentuale su itemsTotal; altrimenti applica su item specifico.
  - `finitura` = `section.engobbio + section.finitura`.
  - Moltiplica tutto per `section.quantity || 1`.
- Alla fine, divide ogni totale accumulato per `totalMq` per ottenere i costi al mq.

**3. Aggiornare il grafico:**

Sostituire la singola `<Bar>` con 3 barre stacked:

```tsx
<Bar dataKey="avgPietraPerMq" stackId="cost" fill="hsl(var(--primary))" name="Pietra e Lavorazioni" radius={[0, 0, 0, 0]} />
<Bar dataKey="avgRischioPerMq" stackId="cost" fill="#f97316" name="Rischio" radius={[0, 0, 0, 0]} />
<Bar dataKey="avgFinituraPerMq" stackId="cost" fill="#22c55e" name="Finitura" radius={[0, 4, 4, 0]} />
```

**4. Aggiornare il tooltip custom** per mostrare i 3 valori con i colori corrispondenti e il totale complessivo.

Nessun altro file viene modificato.
