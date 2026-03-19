

## Plan: Assistente Descrizioni + Glossario

### 1. Assistente Descrizioni Sezioni

Strumento ibrido: template predefiniti + generazione AI per descrizioni coerenti.

**Componente `src/components/DescriptionAssistant.tsx`**:
- Lista di template di descrizione predefiniti per categorie comuni (es. "Fornitura e posa", "Lavorazione pietra", "Trattamento superfici", ecc.)
- Pulsante "Genera con AI" che analizza le descrizioni delle sezioni esistenti (passate come contesto) e genera una descrizione coerente con lo stile
- Textarea per editing manuale del risultato
- Pulsante "Copia" per copiare la descrizione generata

**Edge function `supabase/functions/generate-description/index.ts`**:
- Riceve le descrizioni esistenti delle sezioni + nome sezione corrente
- Usa Lovable AI (google/gemini-3-flash-preview) per generare una descrizione coerente
- Prompt di sistema: "Sei un assistente per preventivi di lavorazione pietra. Genera descrizioni professionali e coerenti con lo stile delle descrizioni esistenti."

**Integrazione**:
- Aggiunta alla pagina Tools con icona `FileText`, gradient arancione
- Si apre come popup standalone con MacWindowBar
- Registrato in `ToolPage.tsx`

### 2. Glossario

Componente statico con terminologia del settore, non modificabile.

**Componente `src/components/Glossary.tsx`**:
- Lista di termini con definizioni organizzati per categoria (Materiali, Lavorazioni, Finiture, Misure)
- Barra di ricerca per filtrare i termini
- Layout a accordion per le categorie
- I termini sono hardcoded nel componente (array costante)

**Integrazione**:
- Aggiunta alla pagina Tools con icona `BookOpen`, gradient ambra/oro
- Si apre come popup standalone con MacWindowBar
- Registrato in `ToolPage.tsx`

### 3. Pagina Tools

Aggiunta delle due nuove card:
- "Descrizioni" / "Assistente AI" — gradient arancione, icona FileText
- "Glossario" / "Terminologia" — gradient ambra, icona BookOpen

Aggiunta dimensioni popup nel `sizes` map.

### Files da modificare/creare

| File | Azione |
|---|---|
| `src/components/DescriptionAssistant.tsx` | Nuovo — UI template + AI |
| `src/components/Glossary.tsx` | Nuovo — glossario statico |
| `supabase/functions/generate-description/index.ts` | Nuovo — edge function AI |
| `supabase/config.toml` | Aggiunta config funzione |
| `src/pages/Tools.tsx` | Aggiunta 2 nuovi tool |
| `src/pages/ToolPage.tsx` | Registrazione 2 nuovi tool |

