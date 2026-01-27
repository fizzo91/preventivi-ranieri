
## Piano: Semplificazione Interfaccia

### Panoramica
Quattro modifiche per semplificare l'interfaccia e renderla più pratica per l'uso interno:

1. **Rimuovere doppio listino** - Solo prezzo DT
2. **Pulsante "Nuova Sezione"** alla fine di ogni sezione
3. **Semplificare area clienti** - Solo numero preventivo e nome cliente
4. **Semplificare Dashboard** - Solo preventivi recenti

---

### 1. Rimozione Doppio Listino (Solo DT)

**File coinvolti:**
- `src/pages/NewQuote.tsx` - Rimuovere selettore fornitore, usare sempre `price_dt`
- `src/pages/Products.tsx` - Rimuovere campi prezzo EM, mostrare solo DT
- `src/hooks/useProducts.ts` - Mantenere struttura (compatibilità DB)

**Modifiche NewQuote.tsx:**
- Rimuovere campo `supplier` da `quoteData` 
- Rimuovere selettore "Fornitore / Listino" dalla UI (linee 885-899)
- In `selectProduct()` usare sempre `selectedProduct.price_dt`
- Nel dialog "Aggiungi Prodotto Custom", rimuovere campo Prezzo EM

**Modifiche Products.tsx:**
- Form: Rimuovere campo "Prezzo EM", rinominare "Prezzo DT" in "Prezzo"
- Lista prodotti: Mostrare solo un prezzo
- Stats: Cambiare "Prezzo Medio EM" in "Prezzo Medio"

---

### 2. Pulsante "Nuova Sezione" alla Fine di Ogni Sezione

**File:** `src/pages/NewQuote.tsx`

Aggiungere un pulsante dopo ogni card sezione (dopo `</Card>`), prima della chiusura del map:

```text
┌─────────────────────────────────────────────────────────────────┐
│  SEZIONE 1                                                      │
│  ... contenuto sezione ...                                      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
              [+ Nuova Sezione]  ← Pulsante da aggiungere
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SEZIONE 2                                                      │
│  ... contenuto sezione ...                                      │
└─────────────────────────────────────────────────────────────────┘
```

- Rimuovere il pulsante "Nuova Sezione" dall'header (linea 964-967)
- Aggiungere pulsante centrato tra le sezioni con stile discreto

---

### 3. Semplificare Area Clienti

**File:** `src/pages/NewQuote.tsx`

Attualmente mostra: numero preventivo, data, valido fino al, stato, fornitore, nome, azienda, email, telefono, indirizzo

**Nuovo layout semplificato:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  Informazioni Preventivo                                        │
├─────────────────────────────────────────────────────────────────┤
│  Numero Preventivo: [____________]    Nome Cliente: [__________]│
└─────────────────────────────────────────────────────────────────┘
```

- Rimuovere card "Dati Cliente" separata
- Rimuovere: data, valido fino al, stato
- Unire tutto in una sola riga con 2 campi

---

### 4. Semplificare Dashboard

**File:** `src/pages/Dashboard.tsx`

**Rimuovere:**
- Stats Cards (Preventivi Totali, Valore Totale, Bozze, Inviati)
- Grafico "Analisi per Categoria"
- Quick Actions

**Mantenere:**
- Header con pulsante "Nuovo Preventivo"
- Lista "Preventivi Recenti" (aumentare da 3 a 10)

**Layout finale semplice:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                           [+ Nuovo Preventivo]       │
├─────────────────────────────────────────────────────────────────┤
│  Preventivi Recenti                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PREV-001 • Mario Rossi • € 1,500.00 • Bozza               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ PREV-002 • Luigi Verdi • € 2,300.00 • Inviato             │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ ...altri preventivi...                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                     [Vedi Tutti i Preventivi]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Riepilogo File da Modificare

| File | Modifiche |
|------|-----------|
| `src/pages/NewQuote.tsx` | Rimuovere selettore fornitore, semplificare header, ridurre area cliente, pulsante nuova sezione |
| `src/pages/Products.tsx` | Rimuovere campi/visualizzazione prezzo EM |
| `src/pages/Dashboard.tsx` | Rimuovere stats, grafico, quick actions; mostrare solo lista preventivi |

---

### Note Tecniche
- Il database mantiene entrambi i campi `price_em` e `price_dt` per retrocompatibilità
- I preventivi esistenti non vengono modificati
- La semplificazione migliora la velocità di utilizzo per calcoli interni
