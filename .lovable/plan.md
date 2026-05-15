## Obiettivo

Centralizzare ogni creazione attorno al **Progetto**. Preventivi, Scope e Trattativa esistono solo come tab di un progetto. La sidebar riflette questa gerarchia.

## 1. Sidebar — `src/components/app-sidebar.tsx`

Rimuovere le voci:
- "Nuovo Preventivo" (`/new-quote`)
- "Preventivi" (`/quotes`)

Trasformare "Progetti" in voce espandibile (`SidebarMenuSub`):
- Click sul label → naviga a `/projects` (lista progetti).
- Le 3 sotto-voci (Project Scope, Preventivo, Trattativa) **compaiono solo quando l'utente è dentro un progetto** (`/projects/:id`). Estraggo l'`id` da `useParams` o da un match su `useLocation().pathname`.
- Ogni sotto-voce è un `NavLink` a `/projects/:id?tab=scope|quotes|trattativa`, con `isActive` basato sul `tab` corrente.
- Quando si esce dal progetto le sotto-voci scompaiono.

## 2. Dashboard — `src/pages/Dashboard.tsx`

- Sostituire il bottone "+ Nuovo Preventivo" con "+ Nuovo Progetto" che apre il `ProjectFormDialog` (riusato da `/projects`). Al salvataggio reindirizza a `/projects/:id?tab=scope`.
- Lasciare invariato il resto (statistiche, charts, RecentQuotesList).

## 3. Routing — `src/App.tsx`

- Mantenere `/quotes`, `/new-quote`, `/quotes/:id` come rotte funzionanti (deep-link, link da dashboard recenti, edit di un preventivo esistente). **Non rimosse**, solo non più esposte in sidebar — evita di rompere i link esistenti e la pagina di edit preventivo.

## 4. Creazione preventivo dentro un progetto

`QuotesTab` (già esistente) deve essere l'unico punto d'ingresso visibile per creare un nuovo preventivo: verifico che il bottone "Nuovo preventivo" lì dentro pre-imposti `project_id`. Se il flusso oggi rimanda a `/new-quote`, mantengo la navigazione passando `?project_id=:id` (già supportato).

## 5. File toccati

- `src/components/app-sidebar.tsx` — rimozione voci, voce Progetti espandibile con sotto-voci condizionate alla rotta.
- `src/pages/Dashboard.tsx` — CTA "+ Nuovo Progetto" + dialog.
- Nessuna modifica al DB, ai PDF, agli hook.

## 6. Dettagli tecnici sidebar

```
Progetti                       (link /projects)
  └─ visibile solo se path = /projects/:id
     ├─ Project Scope          ?tab=scope
     ├─ Preventivo             ?tab=quotes
     └─ Trattativa             ?tab=trattativa
```

Implementazione con `SidebarMenuSub`/`SidebarMenuSubItem` di shadcn, mostrati condizionalmente con `useMatch("/projects/:id")`.