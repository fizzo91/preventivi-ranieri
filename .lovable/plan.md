## Obiettivo

Creare un file Word (`.docx`) di esempio/template che l'utente può scaricare, compilare e ricaricare tramite "Importa da Word". La struttura è ottimizzata per il parser AI di `parse-word-quote` così tutte le sezioni e voci vengono riconosciute automaticamente.

## Struttura del template

Il documento seguirà una convenzione semplice e riconoscibile:

```text
PREVENTIVO – [Nome Cliente / Progetto]

1. TOP CUCINA
Descrizione breve della lavorazione (opzionale, 1 riga).
- Top in pietra lavica spessore 3 cm — 4,5 mq
- Alzatina h.10 cm — 3 ml
- Foro lavello sottotop — 1 pz

2. RIVESTIMENTO BAGNO
- Rivestimento parete doccia — 6 mq
- Piatto doccia su misura — 1 pz

3. PAVIMENTO ESTERNO
- Lastre 60x60 spessore 2 cm — 22 mq
- Battiscopa h.8 cm — 18 ml
```

Regole di compilazione (verranno scritte anche dentro il documento come istruzioni iniziali):

- **Titolo sezione**: riga in MAIUSCOLO oppure numerata (`1.`, `2)`, `A.`). Max 60 caratteri.
- **Descrizione sezione**: riga singola opzionale sotto il titolo, senza trattini.
- **Voci**: una per riga, precedute da `-` o `•`, nel formato  
  `Descrizione voce — quantità unità` (es. `4,5 mq`, `3 ml`, `1 pz`).
- Usare `—` (o `-`) per separare descrizione e quantità.
- I nomi delle voci vicini ai prodotti del catalogo DT verranno matchati automaticamente.

## Cosa creo

- **Nuovo file**: `public/templates/template-preventivo.docx` generato via script `docx` (Node), con:
  - Pagina istruzioni iniziale (come compilare)
  - 3 sezioni di esempio già formattate come sopra
  - Font Arial, titoli sezione H2, elenchi puntati veri (non `\u2022` manuali)
- **Modifica** `src/components/quotes/WordImportDialog.tsx`: aggiungere in cima al dialog un link "Scarica template di esempio" che punta a `/templates/template-preventivo.docx`.

## Fuori scopo

- Nessuna modifica al parser o alla edge function: il template è pensato per la logica già esistente.
- Nessuna variante multipla del template (uno solo, generico).
