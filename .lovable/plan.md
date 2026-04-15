

## Piano: Miglioramento Reset Password

### Problema attuale
L'errore "Auth session missing" indica che il flusso di reset password non funziona. Il bug principale: nella pagina `/auth?mode=reset`, il redirect `if (session && mode !== "update")` si esegue **prima** che l'`useEffect` imposti `mode` su `"update"`, causando un redirect immediato a `/` e perdendo la sessione di recovery.

### Soluzione

**1. Creare una pagina dedicata `/reset-password`** (nuova rotta pubblica)
- Separare completamente il flusso di aggiornamento password dal login
- La pagina intercetta l'evento `PASSWORD_RECOVERY` da `onAuthStateChange`
- Validazione password robusta: minimo 8 caratteri, almeno una maiuscola, un numero, un carattere speciale
- Indicatore visivo della forza password (debole/media/forte)
- Toggle mostra/nascondi password
- Dopo il successo, redirect al login con messaggio di conferma

**2. Aggiornare AuthContext**
- Il `resetPassword` usa `redirectTo: window.location.origin + '/reset-password'` (invece di `/auth?mode=reset`)

**3. Aggiornare Auth.tsx**
- Rimuovere la modalità "update" e tutta la logica `mode=reset` dal URL
- Semplificare: solo login + recupera password

**4. Aggiornare App.tsx**
- Aggiungere rotta pubblica `/reset-password`

**5. Aggiungere cambio password nelle Impostazioni**
- Sezione "Sicurezza" nella pagina Settings con form per cambiare password (password attuale non richiesta da Supabase, ma nuova + conferma con stesse regole di validazione)

### Regole validazione password
- Minimo 8 caratteri
- Almeno una lettera maiuscola
- Almeno un numero
- Almeno un carattere speciale (!@#$%^&*)
- Indicatore visivo: rosso (debole), giallo (media), verde (forte)

### File coinvolti
| File | Modifica |
|------|----------|
| `src/pages/ResetPassword.tsx` | Nuova pagina dedicata |
| `src/pages/Auth.tsx` | Rimuovere modalità update |
| `src/contexts/AuthContext.tsx` | Aggiornare redirectTo |
| `src/App.tsx` | Aggiungere rotta `/reset-password` |
| `src/pages/Settings.tsx` | Aggiungere sezione cambio password |

