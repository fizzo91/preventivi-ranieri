
# Piano: Sistema di Suggerimenti Lavorazioni Basato sulla Memoria

## Panoramica
Quando aggiungi un prodotto (specialmente una "PIETRA"), il sistema analizzerà i preventivi passati e suggerirà automaticamente le lavorazioni che hai usato più frequentemente insieme a quel prodotto.

## Come Funzionerà

Quando selezioni un prodotto, apparirà un pannello con i suggerimenti:

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Lavorazioni suggerite per "Pietra Liscia Sp. 50 mm"      │
├─────────────────────────────────────────────────────────────┤
│ ☐ 2° taglio su 5 cm           (usato 12 volte)  [+ Aggiungi]│
│ ☐ R2-R5 s/s su 5 cm           (usato 10 volte)  [+ Aggiungi]│
│ ☐ sagomatura su 5 cm          (usato 8 volte)   [+ Aggiungi]│
│ ☐ TORO su 5 cm                (usato 5 volte)   [+ Aggiungi]│
├─────────────────────────────────────────────────────────────┤
│ [Aggiungi selezionati] [Ignora]                             │
└─────────────────────────────────────────────────────────────┘
```

## Modifiche Tecniche

### 1. Nuovo Hook: `useProductSuggestions.ts`

Creeremo un nuovo hook che analizza i preventivi storici per trovare associazioni tra prodotti:

- Scansiona tutti i preventivi dell'utente
- Per ogni sezione, identifica quali prodotti appaiono insieme
- Calcola la frequenza di co-occorrenza
- Restituisce le lavorazioni più frequentemente associate a un dato prodotto

La logica principale:
- Quando un prodotto è nella stessa sezione di altri prodotti, crea un'associazione
- Prioritizza le lavorazioni (categoria "LAVORAZIONE" o "LAVORAZIONI") rispetto ad altri tipi
- Ordina per frequenza di utilizzo

### 2. Nuovo Componente: `ProductSuggestions.tsx`

Un componente UI che mostra i suggerimenti quando un prodotto viene selezionato:

- Appare sotto l'item appena selezionato
- Mostra le lavorazioni suggerite con checkbox
- Permette di aggiungere singolarmente o in batch
- Si nasconde dopo 5 secondi di inattività o quando l'utente clicca "Ignora"

### 3. Modifiche a `NewQuote.tsx`

- Integrare il componente suggerimenti nel flusso di selezione prodotto
- Aggiungere stato per tracciare quale item ha suggerimenti attivi
- Implementare funzione per aggiungere rapidamente le lavorazioni suggerite

## File da Creare/Modificare

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/hooks/useProductSuggestions.ts` | Nuovo | Hook per calcolare le associazioni prodotto-lavorazioni |
| `src/components/ProductSuggestions.tsx` | Nuovo | Componente UI per mostrare i suggerimenti |
| `src/pages/NewQuote.tsx` | Modifica | Integrare il sistema di suggerimenti |

## Logica di Analisi

Il sistema analizzerà i preventivi così:

1. Per ogni preventivo, per ogni sezione:
   - Estrae tutti i prodotti presenti
   - Per ogni prodotto, registra quali altri prodotti appaiono nella stessa sezione
   
2. Crea una mappa di associazioni:
   - Chiave: ID prodotto principale
   - Valore: Lista di prodotti associati con frequenza

3. Filtra per mostrare solo lavorazioni:
   - Categoria contiene "LAVORAZIONE" o "LAVORAZIONI"
   - Ordina per frequenza decrescente
   - Mostra massimo 5-6 suggerimenti

## Esempio di Output

Se selezioni "Pietra Liscia Sp. 50 mm" e nei preventivi passati l'hai usata:
- 12 volte con "2° taglio su 5 cm"
- 10 volte con "R2-R5 s/s su 5 cm"
- 8 volte con "sagomatura su 5 cm"

Il sistema mostrerà questi suggerimenti in ordine di frequenza.

## Vantaggi

- Risparmio di tempo nella creazione preventivi
- Riduzione errori (non dimentichi lavorazioni comuni)
- Apprendimento automatico dalle tue abitudini
- Interfaccia non invasiva (suggerimenti opzionali)
