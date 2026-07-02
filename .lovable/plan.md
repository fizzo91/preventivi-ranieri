# Vision AI nello strumento Descrizioni

Integrare nel tool "Descrizioni" (già esistente) la possibilità di caricare uno screenshot/foto (render, disegno tecnico, moodboard) da cui l'AI riconosce gli elementi visibili e genera **una descrizione RLS per ciascuno**.

## UI — `src/components/DescriptionAssistant.tsx`

Nel blocco "Genera con AI" aggiungere sopra al campo testo:
- Pulsante "Carica immagine" (input file, `accept="image/jpeg,image/png,image/webp"`).
- Anteprima thumbnail con pulsante "Rimuovi".
- Validazione via `validateImageFile` (già in `src/lib/fileValidation.ts`, magic bytes + max 5MB).
- Conversione a base64 data URL in memoria (nessun upload su Storage — l'immagine viene solo passata alla edge function per l'analisi).

Il campo "Descrizione generica" diventa **facoltativo** quando è presente un'immagine (label "opzionale — hint aggiuntivo"). Il pulsante "Genera descrizione" è abilitato se c'è immagine **o** testo.

Il riquadro "Risultato" diventa una **lista** di descrizioni:
- Ogni item mostra la stringa RLS in `Textarea` editabile + pulsante "Copia".
- Pulsante "Copia tutte" in cima (join con `\n`).
- Se l'AI restituisce una sola descrizione (caso testo-only), la lista contiene un solo elemento — nessuna regressione.

## Edge function — `supabase/functions/generate-description/index.ts`

- Accetta nel body opzionale `imageDataUrl: string` (data URL base64).
- Se presente, costruisce il messaggio user in formato multimodale chat-completions:
  ```
  content: [
    { type: "text", text: "<istruzioni + eventuale hint>" },
    { type: "image_url", image_url: { url: imageDataUrl } }
  ]
  ```
- Modello: resta `google/gemini-3-flash-preview` (supporta input immagine T,I,A,V→T secondo il catalogo modelli).
- System prompt: estendere quello RLS esistente aggiungendo una sezione "VISION MODE":
  - Elencare tutti gli elementi visibili (top, backsplash, vanity, rivestimenti, ecc.).
  - Per ciascuno produrre UNA riga RLS conforme.
  - Se non deducibili, usare placeholder standard (`TBC`, `TBD`, dimensioni `L XXXX x W XXX x T XX mm`).
- Output: chiedere JSON `{ "descriptions": string[] }` con `response_format: { type: "json_object" }` per parsing robusto lato client.
- Retrocompatibilità: quando non c'è immagine, ritornare comunque `{ descriptions: [singola] }`; il client normalizza sempre a array. Rimuovere il vecchio `{ description }` con fallback che legge entrambi per una release.

## Errori e limiti

- 429 / 402 già gestiti — nessuna modifica.
- Validazione client su dimensione file e MIME (magic bytes).
- Toast di errore se il JSON non è parsabile.

## File toccati

- `src/components/DescriptionAssistant.tsx` — UI upload + preview + lista risultati.
- `supabase/functions/generate-description/index.ts` — input immagine, prompt vision, output array.

Nessuna modifica DB, storage, o altri tool.
