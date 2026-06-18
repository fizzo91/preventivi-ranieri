# Ristrutturazione sito e gestione prodotti

## Diagnosi del problema "preventivi senza prodotti"

Analisi sul DB (273 preventivi, 2.971 righe):

- **580 righe in 60 preventivi** hanno un `productId` che non esiste più in `products` (es. `excel-1758015628757-4`, residui di un import Excel).
- **34 righe** non hanno alcun `productId` (voci manuali / placeholder Pietra).
- Lo snapshot (`productName`, `price`, `category`, `unit`) **è già salvato nel JSON** della sezione: quindi il dato non è perso davvero, ma:
  - In `NewQuote.tsx` il Combobox riceve `value={item.productId}` e cerca tra `productOptions`. Se il prodotto è stato cancellato o aveva un id "excel-…" non più in tabella, il campo appare **vuoto** anche se il nome è in JSON.
  - PDF, lista preventivi e dashboard leggono dallo snapshot → lì il prodotto si vede.

Conseguenza: la "perdita" è di **collegamento**, non di dati. Va risolta a due livelli: rendere lo snapshot la fonte di verità per la visualizzazione, e ricostruire i prodotti mancanti.

---

## Obiettivi della ristrutturazione

1. **Mai più perdere il riferimento prodotto** in un preventivo storico.
2. Introdurre **categorie + sottocategorie** ai prodotti.
3. **Riorganizzare navigazione** del sito e ridisegnare la pagina Prodotti.
4. Migliorare l'integrazione prodotti ↔ sezioni preventivo (ricerca, suggerimenti, voci manuali).

---

## Fase 1 — Modello dati prodotti (priorità: prima i dati)

### 1.1 Recupero storico (one-shot, prima di ogni modifica schema)

- Estrarre dagli items dei preventivi tutte le combinazioni uniche `(productName, category, unit, price)` con `productId` orfano o vuoto.
- Reinserirle in `products` come prodotti "archiviati" (vedi `archived` sotto), assegnandogli un nuovo `id` UUID.
- Riassegnare nei `sections.items` dei preventivi il nuovo `productId` corrispondente (match per nome + unit + categoria).
- Operazione **idempotente** e per-utente (`user_id`), eseguita via migration di sola DML.

### 1.2 Nuovo schema `products`

Colonne aggiunte:

- `category_id uuid` → FK a `product_categories`
- `subcategory_id uuid` → FK a `product_subcategories`
- `code text` (codice interno opzionale, indice unico per `(user_id, code)`)
- `archived boolean default false` (mai cancellare: si archivia per non rompere preventivi)
- `notes text`

La colonna testuale `category` resta come fallback di compatibilità ma viene marcata come legacy.

### 1.3 Nuove tabelle

```text
product_categories(id, user_id, name, sort_order, created_at, updated_at)
product_subcategories(id, user_id, category_id, name, sort_order, created_at, updated_at)
```

- RLS standard per-utente (`auth.uid() = user_id`).
- GRANT a `authenticated` + `service_role`.
- Seed iniziale: derivare categorie dai valori distinti già presenti in `products.category` per ogni utente.

### 1.4 Protezione storico

- `useProducts.deleteProduct` non cancella più: imposta `archived = true`.
- La lista prodotti mostra di default solo non archiviati, con toggle "Mostra archiviati".

---

## Fase 2 — Integrazione prodotti ↔ preventivi

### 2.1 Snapshot come fonte di verità

In `NewQuote.tsx`, il Combobox prodotto va modificato così:

- Se `item.productId` non si trova in `productOptions` ma `item.productName` esiste → mostrare comunque il nome (badge "prodotto archiviato/non in listino") invece di mostrare vuoto.
- Opzione "Ricollega a prodotto attuale" nel menu della riga, per associare manualmente un prodotto vivo.

### 2.2 Voci manuali esplicite

- Permettere righe **senza** `productId` come "voce libera" (nome + prezzo + unità digitati a mano), già supportate dal modello ma rese esplicite in UI con un pulsante "Aggiungi voce libera" accanto a "Aggiungi prodotto".

### 2.3 Ricerca migliorata

- Ricerca prodotto filtrabile per categoria/sottocategoria nel Combobox.
- Mantiene la logica "recenti prima" già esistente.

---

## Fase 3 — Pagina Prodotti (UI/UX)

- Sidebar sinistra con albero **Categorie → Sottocategorie** (conteggio prodotti per nodo).
- Lista centrale: filtri rapidi (categoria, archiviati on/off), ricerca testuale, ordinamento prezzo/nome/aggiornati.
- `ProductForm` aggiornato con select Categoria + Sottocategoria (dipendente) e campo Codice.
- Azione bulk: spostare N prodotti in una (sotto)categoria.
- Pagina dedicata `Settings → Categorie prodotti` per CRUD categorie/sottocategorie.

---

## Fase 4 — Navigazione del sito

Riorganizzazione sidebar in **3 gruppi**:

```text
Operatività
  - Dashboard
  - Preventivi
  - Nuovo preventivo
  - Clienti

Anagrafiche
  - Prodotti
  - Categorie prodotti
  - Galleria immagini
  - Archivio descrizioni

Strumenti
  - Tutti i tool (/tools)
  - Guida
  - Impostazioni
```

Nessuna route eliminata: solo raggruppamento + label in `app-sidebar.tsx`.

---

## Ordine di esecuzione consigliato

1. **Backup automatico** del DB (export JSON di `quotes` e `products`) prima di toccare nulla.
2. Migration di **recupero storico** (Fase 1.1) — solo DML, nessuna modifica schema.
3. Migration **schema nuovo** (Fase 1.2 + 1.3) con seed categorie.
4. Codice: archivia-invece-di-cancella, snapshot come fonte di verità (Fase 1.4 + 2.1 + 2.2).
5. UI Prodotti + Categorie (Fase 3).
6. Riorganizzazione sidebar (Fase 4).

---

## Dettagli tecnici

- **File toccati (stima):** `src/hooks/useProducts.ts`, `src/hooks/useCategories.ts` (nuovo), `src/pages/Products.tsx`, `src/components/products/ProductForm.tsx`, `src/components/products/ProductCard.tsx`, `src/pages/NewQuote.tsx`, `src/hooks/useSectionManager.ts`, `src/components/app-sidebar.tsx`, `src/types/index.ts`.
- **Nessuna modifica** richiesta su `sections` JSON: lo snapshot esistente è già sufficiente. Si aggiunge solo logica di rendering di fallback.
- **Migrazioni Supabase:** 2 migrazioni (recupero dati, schema+RLS+grants+seed) + 0 modifiche a `auth/storage`.
- **Compatibilità preventivi vecchi:** garantita perché lo snapshot è già nel JSON e i productId orfani vengono ricreati come prodotti archiviati.

---

## Domande aperte prima di partire

1. Vuoi che il recupero storico crei i prodotti come **archiviati** (non appaiono nei nuovi preventivi) o **attivi** (ritornano selezionabili)?
2. Le **categorie** devono essere **condivise** tra utenti o **per-utente** (come ora)?
3. Per il **codice prodotto** interno: lo usi già altrove (es. PDF) o lo introduciamo da zero?
