
# Piano: Aggiunta del campo "Engobbio" nei Preventivi

## Panoramica
Aggiungeremo un nuovo campo "Engobbio" che apparirà **prima** di "Finitura" nelle sezioni dei preventivi. Questo campo funzionerà esattamente come "Finitura": un importo in euro che viene sommato al totale della sezione e stampato nel PDF.

## Modifiche previste

### 1. Interfaccia e Stato (NewQuote.tsx)

**Aggiornamento dell'interfaccia QuoteSection** (riga 55-66):
- Aggiungere la proprietà `engobbio: number`

**Inizializzazione dello stato** (righe 335-349):
- Aggiungere `engobbio: 0` alla sezione iniziale

**Funzione addSection** (righe 467-482):
- Aggiungere `engobbio: 0` quando si crea una nuova sezione

**Duplicazione sezione** (righe 571-584):
- Copiare anche il valore `engobbio` nella sezione duplicata

### 2. Calcolo del Totale

**useEffect per i totali** (righe 430-465):
- Includere `engobbio` nella chiave di dipendenza
- Aggiornare il calcolo: `newTotal = itemsTotal + risksTotal + finitura + engobbio`

### 3. Interfaccia Utente

**Nuovo blocco UI** (prima della riga 1134):
Aggiungere un blocco identico a "Finitura" ma con etichetta "Engobbio":

```
┌─────────────────────────────────────────┐
│ Engobbio                          € [___]│
│ vedere preventivo allegato               │
├─────────────────────────────────────────┤
│ Finitura                          € [___]│
│ vedere preventivo allegato               │
└─────────────────────────────────────────┘
```

### 4. Generazione PDF (usePdfGenerator.ts)

**Stampa Engobbio** (prima della riga 297):
- Aggiungere la stampa di "Engobbio" con lo stesso formato di "Finitura"
- Mostrare solo se il valore è maggiore di 0

**Calcolo totale sezione** (riga 322):
- Aggiornare: `sectionTotal = sectionItemsTotal + sectionRisksTotal + engobbio + finitura`

**Riepilogo finale** (righe 360-375):
- Includere `engobbio` nel calcolo del totale per il riepilogo

## Dettagli tecnici

### File da modificare

| File | Modifiche |
|------|-----------|
| `src/pages/NewQuote.tsx` | Interfaccia, stato, calcoli, UI |
| `src/hooks/usePdfGenerator.ts` | Stampa PDF e calcoli |

### Ordine di visualizzazione

1. Rischi della sezione
2. **Engobbio** (nuovo)
3. Finitura
4. Totale sezione (con mq e €/mq)
