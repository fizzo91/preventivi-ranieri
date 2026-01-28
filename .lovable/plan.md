

## Piano: Galleria Multimediale Progetti

### Panoramica
Creare una nuova pagina "Galleria" che mostra tutte le immagini caricate nelle sezioni dei preventivi. Questo permette di consultare rapidamente se un progetto è già stato quotato, visualizzando le immagini associate e i relativi preventivi.

---

### Layout della Galleria

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Galleria Progetti                                   [Cerca immagini...]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │              │  │              │  │              │  │              │    │
│  │  [IMMAGINE]  │  │  [IMMAGINE]  │  │  [IMMAGINE]  │  │  [IMMAGINE]  │    │
│  │              │  │              │  │              │  │              │    │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤    │
│  │ PREV-001     │  │ SARTOGO      │  │ FAB 487/26   │  │ FRA 732/26   │    │
│  │ Mario Rossi  │  │              │  │ Ferlin Int.  │  │ HUGO TORO    │    │
│  │ € 1,500.00   │  │ € 536.81     │  │ € 3,224.99   │  │ € 1,016.00   │    │
│  │ [Apri Prev.] │  │ [Apri Prev.] │  │ [Apri Prev.] │  │ [Apri Prev.] │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐                                        │
│  │              │  │              │                                        │
│  │  [IMMAGINE]  │  │  [IMMAGINE]  │                                        │
│  │              │  │              │                                        │
│  └──────────────┘  └──────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Funzionalità

1. **Estrazione immagini**: Scansiona tutti i preventivi e raccoglie le immagini `chartImage` dalle sezioni
2. **Griglia responsive**: Layout a griglia 4 colonne (desktop), 2 colonne (tablet), 1 colonna (mobile)
3. **Card immagine**: Ogni card mostra:
   - Immagine in anteprima (cliccabile per ingrandire)
   - Numero preventivo
   - Nome cliente
   - Totale preventivo
   - Pulsante per aprire/modificare il preventivo
4. **Ricerca**: Campo di ricerca per filtrare per numero preventivo o nome cliente
5. **Lightbox**: Click sull'immagine apre una modale con l'immagine a dimensione piena
6. **Navigazione**: Nuova voce "Galleria" nel menu laterale

---

### Modifiche Tecniche

#### 1. Nuova Pagina `src/pages/Gallery.tsx`

Componente che:
- Usa l'hook `useQuotes()` esistente per recuperare tutti i preventivi
- Estrae le immagini dalle sezioni (campo `chartImage`)
- Renderizza una griglia di card con anteprime
- Implementa ricerca e filtro
- Include lightbox per visualizzazione ingrandita

#### 2. Aggiornamento Menu Laterale `src/components/app-sidebar.tsx`

Aggiungere nuova voce:
```typescript
{ title: "Galleria", url: "/gallery", icon: Image }
```

#### 3. Aggiornamento Router `src/App.tsx`

Aggiungere nuova route:
```typescript
<Route path="/gallery" element={<Gallery />} />
```

---

### Struttura Dati Immagini

Per ogni immagine estratta, creiamo un oggetto con queste informazioni:

```typescript
interface GalleryImage {
  imageUrl: string           // URL dell'immagine dal chartImage
  sectionName: string        // Nome della sezione
  sectionDescription: string // Descrizione della sezione
  quoteId: string           // ID del preventivo
  quoteNumber: string       // Numero preventivo
  clientName: string        // Nome cliente
  totalAmount: number       // Totale preventivo
}
```

---

### File da Creare/Modificare

| File | Azione |
|------|--------|
| `src/pages/Gallery.tsx` | Creare nuova pagina galleria |
| `src/components/app-sidebar.tsx` | Aggiungere voce menu "Galleria" |
| `src/App.tsx` | Aggiungere route `/gallery` |

---

### Note Implementative

- Utilizza componenti UI esistenti (Card, Dialog per lightbox)
- Stile coerente con il resto dell'applicazione
- Nessuna modifica al database necessaria (i dati esistono già)
- Le immagini sono già pubbliche nel bucket `section-charts`
- La ricerca filtra per numero preventivo e nome cliente

