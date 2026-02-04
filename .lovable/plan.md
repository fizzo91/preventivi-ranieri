
# Piano: Tags, Campi C/R e Template Sezioni

## Panoramica

Implementeremo tre funzionalità per migliorare la gestione delle sezioni nei preventivi:

1. **Tags/Etichette** - Per categorizzare le sezioni (es. "Cucina", "Bagno", "Esterno")
2. **Campi C e R** - Complessità e Rischio (scala 1-4) come indicatori compatti
3. **Template Sezioni** - Salvare e riutilizzare configurazioni di sezioni

---

## 1. Tags/Etichette

### Come funzionerà
- Ogni sezione avrà un campo per inserire tags separati da virgola
- I tags verranno visualizzati come badge colorati sotto il titolo della sezione
- Tags comuni saranno suggeriti automaticamente (Cucina, Bagno, Esterno, Top, Rivestimento)

### Aspetto Visivo
```
┌─────────────────────────────────────────────────────────────┐
│ Sezione 1: Cucina Cliente Rossi                            │
│ [Cucina] [Interno] [Premium]     <- Tags come badge        │
│ ─────────────────────────────────────────────────────────  │
```

---

## 2. Campi C (Complessità) e R (Rischio)

### Come funzionerà
- Due campi quadrati compatti accanto al titolo sezione
- Scala 1-4 con select dropdown
- Colori: 1=Verde, 2=Giallo, 3=Arancione, 4=Rosso
- Tooltip per spiegazione (C=Complessità lavorazione, R=Rischio generale)

### Aspetto Visivo
```
┌─────────────────────────────────────────────────────────────┐
│ Sezione 1: Bagno      [C:2] [R:3]     Totale: € 1.234,00   │
│                        ↑↑                                   │
│              Quadrati colorati 32x32px                      │
└─────────────────────────────────────────────────────────────┘
```

| Valore | Colore | Significato C | Significato R |
|--------|--------|---------------|---------------|
| 1 | Verde | Semplice | Basso |
| 2 | Giallo | Medio | Moderato |
| 3 | Arancione | Complesso | Alto |
| 4 | Rosso | Molto Complesso | Molto Alto |

---

## 3. Template Sezioni

### Come funzionerà
- Nuovo pulsante "Salva come Template" nel header di ogni sezione
- I template vengono salvati nel database con nome, descrizione e items
- Nuovo pulsante "Carica Template" per inserire una sezione pre-configurata
- Modale per gestire/eliminare template salvati

### Aspetto Visivo
```
┌─────────────────────────────────────────────────────────────┐
│ Header Sezione:                                             │
│ [Calc.Pietra] [Duplica] [Salva Template] [Elimina]          │
│                         ↑                                   │
│              Nuovo pulsante con icona salva                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Dialog "Carica Template":                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Top Cucina Standard                                     │ │
│ │ Pietra + 2° taglio + sagomatura + lucidatura            │ │
│ │ [Usa] [Elimina]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Rivestimento Base                                       │ │
│ │ Pietra + engobbiatura                                   │ │
│ │ [Usa] [Elimina]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Modifiche Tecniche

### Database

**Nuova tabella `section_templates`:**
```sql
CREATE TABLE section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  tags TEXT[],
  complexity INTEGER CHECK (complexity >= 1 AND complexity <= 4),
  risk INTEGER CHECK (risk >= 1 AND risk <= 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy
ALTER TABLE section_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates" 
  ON section_templates FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Interface QuoteSection Aggiornata

```typescript
interface QuoteSection {
  id: string
  name: string
  description: string
  chartImage?: string
  chartImagePath?: string
  items: QuoteItem[]
  risks: Risk[]
  engobbio: number
  finitura: number
  total: number
  mqTotali?: number
  euroPerMq?: number
  // NUOVI CAMPI
  tags?: string[]           // Array di etichette
  complexity?: number       // 1-4
  risk?: number             // 1-4
}
```

### Nuovo Hook `useSectionTemplates`

```typescript
export const useSectionTemplates = () => {
  return useQuery({
    queryKey: ["section-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("section_templates")
        .select("*")
        .order("name")
      if (error) throw error
      return data
    }
  })
}

export const useCreateSectionTemplate = () => { ... }
export const useDeleteSectionTemplate = () => { ... }
```

### Componente TagInput

Un componente per gestire l'inserimento dei tags:
- Input con autocompletamento
- Suggerimenti per tags comuni
- Visualizzazione come badge removibili

---

## File da Modificare/Creare

| File | Azione | Descrizione |
|------|--------|-------------|
| `supabase/migrations/xxx.sql` | Creare | Tabella section_templates |
| `src/hooks/useSectionTemplates.ts` | Creare | Hook per CRUD template |
| `src/components/TagInput.tsx` | Creare | Componente input tags |
| `src/components/SectionTemplateDialog.tsx` | Creare | Dialog per template |
| `src/pages/NewQuote.tsx` | Modificare | Aggiungere UI per tags, C/R, template |

---

## Flusso Utente

### Creare un Template
1. Completa una sezione con tutti i prodotti desiderati
2. Clicca "Salva come Template"
3. Inserisci nome (es. "Top Cucina Standard") e descrizione opzionale
4. Il template viene salvato nel database

### Usare un Template
1. Clicca "Nuova Sezione" o "Carica Template"
2. Seleziona il template desiderato dalla lista
3. La sezione viene pre-compilata con tutti i prodotti del template
4. Modifica quantità/prezzi secondo necessità

### Gestire Tags e C/R
1. Clicca sull'icona etichetta per aggiungere tags
2. Seleziona C e R dai dropdown compatti
3. Questi valori vengono salvati con il preventivo e i template
