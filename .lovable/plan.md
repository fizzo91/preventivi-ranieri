## Preventivo come file `.json` locale

### Comportamento

**File `.json` = snapshot completo del preventivo**
- Contiene: cliente, sezioni, voci, prezzi, rischi, note, metadata (versione formato, id preventivo, data ultima modifica).
- Estensione: `.rpv.json` (Ranieri Preventivo) per identificarlo con un'icona personalizzata sul sistema operativo.

**Aprire il file (doppio clic → si apre nel preventivo)**
1. Registrare un **file handler** via web manifest (`file_handlers` API + PWA installata).
   - Il file `.rpv.json` viene associato all'app installata.
   - Doppio clic lancia l'app aperta su `/new-quote?openFile=1`, l'app riceve il file via `launchQueue.setConsumer()`.
   - Fallback per utenti senza PWA installata: dentro `/new-quote` un pulsante **"Apri da file"** + area drag & drop che accetta `.rpv.json`.
2. All'apertura: parse del JSON, popolamento del form Nuovo Preventivo (usando la stessa logica dell'import JSON già esistente). Se il JSON contiene un `id` esistente per l'utente → carica quel preventivo in edit mode; altrimenti crea nuovo.

**Salvare (download automatico del `.json` aggiornato)**
- Ad ogni "Salva" riuscito nel backend:
  - Serializza lo stato del preventivo in JSON.
  - Trigger automatico del download del file `nome-cliente-YYYYMMDD.rpv.json`.
  - Toast di conferma: "Preventivo salvato. File aggiornato scaricato."
- Se il preventivo è stato aperto via `launchQueue` con `FileSystemFileHandle` in modalità read-write (Chromium desktop), sovrascrivere direttamente il file originale senza chiedere. Altrimenti fallback su download classico.

### Componenti tecnici

| Area | Cosa fare |
|---|---|
| `public/manifest.webmanifest` | Aggiungere `file_handlers: [{ action: "/new-quote", accept: { "application/json": [".rpv.json"] } }]`. Il progetto è già PWA. |
| `src/lib/quoteFile.ts` (nuovo) | `serializeQuote(quote): Blob` + `parseQuoteFile(file): QuoteData`. Riutilizza formato dell'export JSON esistente, aggiungendo header `{ format: "rpv", version: 1, ... }`. |
| `src/pages/NewQuote.tsx` | Al mount: `if ('launchQueue' in window)` → `launchQueue.setConsumer(handleFiles)`. Salva l'eventuale `FileSystemFileHandle` in ref per riuso al salvataggio. |
| `src/components/quotes/OpenFileButton.tsx` (nuovo) | Pulsante "Apri da file" + drag & drop overlay su tutta la pagina Nuovo Preventivo. |
| Hook `useQuoteSave` (o punto attuale del save) | Dopo save success: `downloadOrOverwriteFile(quote, handleRef.current)`. |
| Rimozione | Il pulsante/logica "Importa da Word" (WordImportDialog + edge function `parse-word-quote`) e il template `.docx` non servono più — chiedere se rimuoverli o tenerli come opzione secondaria. |

### Limiti da comunicare all'utente

- **Doppio clic diretto**: funziona solo se l'app è **installata come PWA** (Chrome/Edge desktop, Android). Su Safari/iOS il doppio clic apre il JSON come testo — l'utente deve trascinarlo nell'app.
- **Sovrascrittura in-place del file**: solo Chromium desktop con PWA installata. Altrove ogni salvataggio scarica una nuova copia (l'utente la sposta manualmente nella cartella progetto sovrascrivendo).
- Il file `.json` da solo **non è un backup completo** se contiene riferimenti a immagini caricate nel bucket `section-charts`: gli URL firmati scadono. Opzioni: (a) accettarlo, (b) inlineare le immagini come base64 nel JSON (file più pesante). Da confermare.

### Domande aperte prima di implementare
1. Cosa fare con l'import da Word appena costruito: **rimuoverlo**, tenerlo come opzione, o convertirlo in un secondo formato di apertura?
2. Immagini delle sezioni: **link ai URL** (leggeri, dipendono dal cloud) o **inline base64** (autonomi, file più grandi)?
