

## Piano di Implementazione

### 1. Rinominare le sezioni con formato ID.01, ID.02, ...

**Situazione attuale:** La prima sezione si chiama "Progetto Principale", le successive "Sezione 2", "Sezione 3", ecc.

**Modifiche:**
- In `src/hooks/useSectionManager.ts`: cambiare il nome iniziale da `"Progetto Principale"` a `"ID.01"` e la funzione `addSection` per generare `"ID.02"`, `"ID.03"`, ecc. (basato sulla posizione corrente).
- In `src/hooks/useSectionManager.ts` → `duplicateSection`: il nome della copia segue la numerazione progressiva (es. `"ID.03"` se ci sono già 2 sezioni), non `"... (Copia)"`.
- In `src/hooks/useSectionManager.ts` → `loadFromTemplate`: stessa logica per i template caricati.
- Il campo nome resta editabile, quindi l'utente potrà sempre personalizzarlo.

### 2. Creare una guida d'uso

**Approccio:** Aggiungere una nuova pagina `/guide` accessibile dalla sidebar con una guida completa che spiega:
- Come creare un preventivo (sezioni, prodotti, rischi, smalto, calcolatore pietra)
- Come gestire prodotti e catalogo
- Come usare la calcolatrice collegata al preventivo
- Come esportare/stampare il PDF con foglio calcoli
- Come gestire i template di sezione
- Come funzionano i tag, complessità e rischio

**File da creare/modificare:**
- Nuovo: `src/pages/Guide.tsx` — pagina con accordion/sezioni espandibili
- `src/App.tsx` — aggiungere rotta `/guide`
- `src/components/app-sidebar.tsx` — aggiungere voce "Guida" nella sidebar

### 3. Verificare che tutti i prodotti siano selezionabili nei preventivi

**Analisi:** Il Combobox usa `option.label` (il nome del prodotto) come valore di ricerca con il componente `Command` (cmdk). Il matching è fuzzy sul `label`. Non ci sono filtri per categoria nel selettore prodotti del preventivo, quindi tutti i prodotti dovrebbero essere disponibili.

**Possibile problema:** Il componente `CommandList` di cmdk ha un limite di rendering virtuale. Se ci sono molti prodotti, alcuni potrebbero non apparire nella lista. Anche il matching fuzzy potrebbe non trovare prodotti con nomi particolari (caratteri speciali, numeri).

**Azioni:**
- Verificare nel database quanti prodotti ci sono e se qualcuno ha nomi problematici
- Testare il Combobox con l'elenco completo
- Se necessario, aggiungere un filtro per categoria nel selettore prodotti del preventivo per facilitare la ricerca
- Aumentare il limite di `CommandList` se necessario (aggiungere prop `cmdk-list-sizer` o rimuovere virtualizzazione)

### Dettagli tecnici

**File coinvolti:**
| File | Modifica |
|------|----------|
| `src/hooks/useSectionManager.ts` | Numerazione sezioni ID.01, ID.02... |
| `src/utils/quoteCalculations.ts` | Aggiornare `createEmptySection` se serve |
| `src/pages/Guide.tsx` | Nuova pagina guida |
| `src/App.tsx` | Rotta `/guide` |
| `src/components/app-sidebar.tsx` | Voce sidebar "Guida" |
| `src/components/ui/combobox.tsx` | Eventuale fix per prodotti non trovabili |

