import { PageHeader } from "@/components/shared"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, FileText, Package, Calculator, Printer, Tags, LayoutTemplate, Palette } from "lucide-react"

const sections = [
  {
    id: "preventivi",
    icon: FileText,
    title: "Creare un Preventivo",
    content: `
**1. Nuovo Preventivo**
Dalla sidebar clicca su "Nuovo Preventivo". Compila i dati del cliente (nome, email, telefono, indirizzo, azienda) e le informazioni del preventivo (numero, data, validità, note).

**2. Sezioni**
Ogni preventivo è composto da una o più sezioni, numerate automaticamente (ID.01, ID.02, …). Puoi:
- **Aggiungere** una sezione con il pulsante "+"
- **Duplicare** una sezione esistente (l'icona copia)
- **Eliminare** una sezione (solo se ce ne sono almeno due)
- **Rinominare** ogni sezione liberamente

**3. Articoli (Items)**
In ogni sezione aggiungi articoli selezionando un prodotto dal catalogo tramite il menu a tendina. Per ogni articolo puoi specificare quantità, prezzo unitario e unità di misura. Il totale si calcola automaticamente.

**4. Rischi**
Aggiungi voci di rischio a ogni sezione. Ogni rischio ha una percentuale e può essere applicato a un singolo articolo o al totale della sezione.

**5. Engobbio e Finitura**
Campi opzionali per aggiungere costi aggiuntivi alla sezione.

**6. Immagine**
Puoi caricare un'immagine (es. disegno tecnico o bozzetto) per ogni sezione.

**7. Salvare**
Clicca "Salva Preventivo" per salvare. Puoi anche modificare preventivi esistenti dalla pagina Preventivi.
    `,
  },
  {
    id: "prodotti",
    icon: Package,
    title: "Gestione Prodotti",
    content: `
**Catalogo Prodotti**
Dalla pagina "Prodotti" puoi gestire il tuo catalogo completo.

- **Aggiungere** un nuovo prodotto: nome, categoria, prezzo DT, prezzo EM, unità di misura e descrizione
- **Modificare** prodotti esistenti
- **Eliminare** prodotti non più necessari
- **Cercare** per nome o filtrare per categoria

Quando crei un preventivo, tutti i prodotti del catalogo sono disponibili nel selettore. Usa la barra di ricerca per trovare velocemente il prodotto desiderato.
    `,
  },
  {
    id: "calcolatrice",
    icon: Calculator,
    title: "Calcolatrice e Calcolatore Pietra",
    content: `
**Calcolatrice Scientifica**
Disponibile nella pagina "Strumenti", la calcolatrice supporta operazioni matematiche avanzate. I calcoli possono essere salvati e collegati a un preventivo specifico.

**Calcolatore Pietra**
All'interno di ogni sezione del preventivo puoi aprire il Calcolatore Pietra. Inserisci le dimensioni e lo spessore per calcolare automaticamente i mq totali e il costo. Il risultato viene aggiunto come articolo "PIETRA SP. XX" nella sezione.

**Calcolatore Smalto**
Calcola i costi di smaltatura basandoti su parametri come superficie, tipo di smalto e numero di passate.
    `,
  },
  {
    id: "stampa",
    icon: Printer,
    title: "Stampa e PDF",
    content: `
**Generare il PDF**
Dalla pagina di dettaglio di un preventivo, clicca su "Stampa PDF". Il PDF include:
- Intestazione con i dati della tua azienda (configurabili nelle Impostazioni)
- Dati del cliente
- Tutte le sezioni con articoli, rischi, engobbio e finitura
- Totale generale
- Eventuali immagini allegate

**Foglio Calcoli**
Il PDF include automaticamente un foglio calcoli (come uno scontrino) con il riepilogo dettagliato di tutti i costi per sezione.

**Note e Condizioni**
Le note inserite nel preventivo vengono riportate nel PDF.
    `,
  },
  {
    id: "template",
    icon: LayoutTemplate,
    title: "Template di Sezione",
    content: `
**Salvare un Template**
Quando hai configurato una sezione con gli articoli e i rischi desiderati, puoi salvarla come template per riutilizzarla in futuro.

**Caricare un Template**
Al momento della creazione di un nuovo preventivo, puoi caricare un template salvato. Verrà aggiunta una nuova sezione precompilata con gli articoli del template.

I template salvano: articoli, tag, livello di complessità e rischio.
    `,
  },
  {
    id: "tag",
    icon: Tags,
    title: "Tag, Complessità e Rischio",
    content: `
**Tag**
Ogni sezione può avere dei tag (es. "bagno", "cucina", "esterno"). I tag ti aiutano a categorizzare e filtrare i tuoi preventivi nella dashboard.

**Complessità (C)**
Assegna un livello da 1 a 4 per indicare la complessità del lavoro. Questo valore è puramente informativo e non influenza i calcoli.

**Rischio (R)**
Assegna un livello da 1 a 4 per indicare il livello di rischio. Come la complessità, è un indicatore visivo per le tue analisi.

Questi indicatori sono visibili nella dashboard per analisi e statistiche.
    `,
  },
  {
    id: "galleria",
    icon: Palette,
    title: "Galleria e Descrizioni",
    content: `
**Galleria**
La pagina Galleria ti permette di visualizzare e gestire le immagini caricate nei preventivi.

**Descrizioni**
La pagina Descrizioni offre un assistente AI che ti aiuta a generare descrizioni professionali per i tuoi prodotti e servizi. Inserisci un prompt e ricevi suggerimenti di testo.
    `,
  },
  {
    id: "impostazioni",
    icon: BookOpen,
    title: "Impostazioni",
    content: `
**Profilo Azienda**
Nelle Impostazioni configura:
- Nome azienda
- Logo (visibile nel PDF)
- Indirizzo, telefono, email
- Partita IVA e codice fiscale
- Sito web

Questi dati vengono utilizzati nell'intestazione dei PDF generati.
    `,
  },
]

export default function Guide() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Guida d'Uso"
        description="Scopri come utilizzare tutte le funzionalità dell'applicazione"
      />

      <Card>
        <CardContent className="pt-6">
          <Accordion type="multiple" className="w-full">
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none pl-8 whitespace-pre-line">
                    {section.content.trim().split('\n').map((line, i) => {
                      const trimmed = line.trim()
                      if (!trimmed) return <br key={i} />
                      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                        return <h4 key={i} className="font-semibold text-foreground mt-3 mb-1">{trimmed.slice(2, -2)}</h4>
                      }
                      if (trimmed.startsWith('- **')) {
                        const match = trimmed.match(/^- \*\*(.+?)\*\*(.*)$/)
                        if (match) {
                          return <p key={i} className="ml-4 mb-1">• <strong>{match[1]}</strong>{match[2]}</p>
                        }
                      }
                      if (trimmed.startsWith('- ')) {
                        return <p key={i} className="ml-4 mb-1">• {trimmed.slice(2)}</p>
                      }
                      return <p key={i} className="mb-1 text-muted-foreground">{trimmed}</p>
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
