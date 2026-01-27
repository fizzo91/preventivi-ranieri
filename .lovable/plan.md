
## Piano: Campo Grafico per Ogni Sezione del Preventivo

### Panoramica
Aggiungeremo la possibilità di caricare un'immagine (grafico, disegno, schema) per ogni sezione del preventivo. L'immagine apparirà tra la descrizione della sezione e la tabella dei costi, sia nell'interfaccia che nel PDF generato.

### Layout Finale della Sezione

```text
┌─────────────────────────────────────────────────────────────────┐
│  Nome Sezione                                    Totale: € XXX  │
├─────────────────────────────────────────────────────────────────┤
│  Descrizione della sezione...                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐                    │
│  │                                         │                    │
│  │         [IMMAGINE/GRAFICO]              │  [Rimuovi]         │
│  │                                         │                    │
│  └─────────────────────────────────────────┘                    │
│                        oppure                                   │
│  [+ Carica Grafico/Immagine]                                    │
├─────────────────────────────────────────────────────────────────┤
│  Tabella Prodotti/Costi                                         │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Modifiche Tecniche

#### 1. Creazione Bucket Storage (Migrazione SQL)
Creare un bucket `section-charts` per archiviare le immagini delle sezioni:
- Bucket pubblico per facilitare la visualizzazione
- Policy RLS per permettere solo agli utenti autenticati di caricare/eliminare le proprie immagini

#### 2. Modifica Interfaccia QuoteSection
Nel file `src/pages/NewQuote.tsx`, aggiungere il campo opzionale:
```typescript
interface QuoteSection {
  id: string
  name: string
  description: string
  chartImage?: string  // URL dell'immagine caricata
  items: QuoteItem[]
  risks: Risk[]
  finitura: number
  total: number
}
```

#### 3. UI per Upload Immagine
Nella card di ogni sezione (tra descrizione e tabella prodotti):
- Pulsante "Carica Grafico" se nessuna immagine presente
- Anteprima dell'immagine con pulsante "Rimuovi" se già caricata
- Gestione upload tramite Supabase Storage
- Formati supportati: JPG, PNG, WEBP

#### 4. Funzioni di Gestione
- `uploadSectionChart(sectionId, file)`: carica l'immagine e aggiorna lo stato
- `removeSectionChart(sectionId)`: rimuove l'immagine dallo storage e dallo stato

#### 5. Modifica PDF Generator
Nel file `src/hooks/usePdfGenerator.ts`:
- Dopo la descrizione della sezione, inserire l'immagine se presente
- Usare `pdf.addImage()` di jsPDF per incorporare l'immagine
- Ridimensionare proporzionalmente per adattarla alla larghezza del contenuto
- Verificare page break prima di inserire l'immagine

---

### File da Modificare/Creare

| File | Azione |
|------|--------|
| Migrazione SQL | Creare bucket `section-charts` con policy RLS |
| `src/pages/NewQuote.tsx` | Aggiungere campo `chartImage`, UI upload, funzioni gestione |
| `src/hooks/usePdfGenerator.ts` | Aggiungere rendering immagine nel PDF |

---

### Note Importanti
- Le immagini vengono salvate in Lovable Cloud Storage, non nel database
- Il campo `chartImage` nella sezione contiene solo l'URL pubblico dell'immagine
- Il JSON delle sezioni salvato nel database conterrà questo URL
- Limite dimensione file consigliato: 5MB per immagine
