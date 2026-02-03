
# Piano: Costi Medi per Spessore nella Dashboard

## Panoramica
Aggiungeremo una nuova card nella Dashboard che mostra i costi medi per metro quadro raggruppati per spessore della pietra. Il sistema calcolerà correttamente i mq reali usando la logica che hai descritto.

## Logica di Calcolo dei mq Reali

Per ogni sezione:
1. **Cerca la voce "2° taglio"** - se presente, usa la sua quantità come mq reali
2. **Se non c'è 2° taglio** - usa la quantità della voce PIETRA

```
Sezione con 2° taglio:
- Pietra Liscia Sp. 50 mm: 6.94 mq
- 2° taglio su 5 cm: 6.94 mq  ← USA QUESTO (mq reali)
- sagomatura su 5 cm: 1 ml
→ mq reali = 6.94

Sezione senza 2° taglio:
- Pietra Liscia Sp. 50 mm: 4.4 mq ← USA QUESTO
- sagomatura su 5 cm: 2 ml
→ mq reali = 4.4
```

## Risultato Visualizzato

```
┌─────────────────────────────────────────────────────────────┐
│ Costo Medio per Spessore (€/mq)                             │
├─────────────────────────────────────────────────────────────┤
│ 20 mm   ████████████████  € 450/mq   (12 sezioni, 45 mq)   │
│ 30 mm   ██████████████████████  € 520/mq   (8 sezioni)     │
│ 50 mm   ██████████████████████████████  € 850/mq  (15 sez) │
│ 70 mm   ██████████████████████████████████████  € 1.100/mq │
└─────────────────────────────────────────────────────────────┘
```

## Modifiche Tecniche

### File: `src/pages/Dashboard.tsx`

1. **Nuovo `useMemo` per calcolare i costi per spessore**:
   - Scansiona tutte le sezioni di tutti i preventivi
   - Per ogni sezione:
     - Trova il prodotto PIETRA (categoria = "PIETRA")
     - Estrae lo spessore dal nome con regex: `/Sp\.\s*(\d+)\s*mm/i`
     - Cerca la voce "2° taglio" (nome contiene "2° taglio" o "2° taglio")
     - Se trovata, usa `quantity` del 2° taglio come mq reali
     - Altrimenti usa `quantity` della PIETRA
     - Calcola €/mq = totale sezione / mq reali
   - Raggruppa per spessore e calcola media ponderata

2. **Nuova Card con grafico a barre orizzontali**:
   - Asse Y: Spessori (20mm, 30mm, 50mm, ecc.)
   - Asse X: Costo medio €/mq
   - Tooltip con dettagli (numero sezioni, totale mq lavorati)

### Struttura Dati

```typescript
interface ThicknessCost {
  thickness: number;      // Spessore in mm
  label: string;          // "20 mm", "50 mm", ecc.
  averageCostPerMq: number;
  sectionCount: number;
  totalMq: number;
}
```

### Logica Dettagliata

```typescript
// Per ogni sezione
const pietra = section.items.find(i => i.category === "PIETRA");
const secondoTaglio = section.items.find(i => 
  i.productName.toLowerCase().includes("2° taglio") || 
  i.productName.toLowerCase().includes("2° taglio")
);

// Estrai spessore dal nome della pietra
const spMatch = pietra?.productName.match(/Sp\.\s*(\d+)\s*mm/i);
const spessore = spMatch ? parseInt(spMatch[1]) : null;

// mq reali = 2° taglio se presente, altrimenti pietra
const mqReali = secondoTaglio?.quantity ?? pietra?.quantity ?? 0;

// €/mq = totale sezione / mq reali
const euroPerMq = mqReali > 0 ? section.total / mqReali : 0;
```

## File da Modificare

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/pages/Dashboard.tsx` | Modifica | Aggiungere logica di calcolo e nuova card con grafico |

## Vantaggi

- Visione immediata dei costi medi per ogni spessore
- Calcolo corretto dei mq reali (2° taglio quando disponibile)
- Utile per quotazioni future e analisi dei prezzi
