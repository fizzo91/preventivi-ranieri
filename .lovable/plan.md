

## Piano: Ristrutturazione pagina Impostazioni → Profilo Utente

### Obiettivo
Trasformare la pagina Impostazioni in una pagina profilo personale con: foto profilo, cambio password, statistiche e logout. I dati aziendali e la gestione tag restano nella stessa pagina ma riorganizzati.

### Modifiche

**1. Creare bucket storage `avatars`** (migrazione SQL)
- Bucket pubblico per le foto profilo
- RLS: utenti autenticati possono caricare/aggiornare/eliminare solo i propri file (path basato su `auth.uid()`)

**2. Ristrutturare `src/pages/Settings.tsx`**
- **Header profilo** in cima: avatar circolare con upload/cambio foto (click per selezionare file), nome utente, email, pulsante Logout
- Upload foto: salva nel bucket `avatars`, aggiorna campo `logo` nel profilo con l'URL pubblico
- **Sezioni sotto** (nell'ordine):
  1. Dati Azienda (come ora)
  2. Gestione Tag (come ora)
  3. Sicurezza / Cambio Password (come ora)
  4. Statistiche Dati (come ora)
- Pulsante **Logout** ben visibile nell'header del profilo

**3. Aggiornare `src/contexts/AuthContext.tsx`**
- Aggiungere campo `avatar_url` al tipo Profile (opzionale, possiamo usare il campo `logo` già esistente)

### Dettagli tecnici

| File | Modifica |
|------|----------|
| Migrazione SQL | Creare bucket `avatars` + policy RLS |
| `src/pages/Settings.tsx` | Aggiungere sezione avatar con upload, pulsante logout, riorganizzare layout |
| `src/lib/fileValidation.ts` | Riutilizzare validazione esistente per immagini |

**Upload avatar**: validazione magic bytes (JPEG/PNG/WebP), max 2MB, upload a `avatars/{user_id}/avatar.{ext}`, salvataggio URL pubblico nel campo `logo` della tabella `profiles`.

**Logout**: usa `signOut()` già disponibile da `useAuth()`, con redirect a `/auth`.

