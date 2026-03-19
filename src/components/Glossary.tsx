import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface GlossaryTerm {
  term: string
  definition: string
}

interface GlossaryCategory {
  name: string
  terms: GlossaryTerm[]
}

const GLOSSARY_DATA: GlossaryCategory[] = [
  {
    name: "Materiali",
    terms: [
      { term: "Marmo", definition: "Roccia metamorfica composta principalmente di calcite, utilizzata per rivestimenti, pavimentazioni e scultura. Sensibile agli acidi." },
      { term: "Granito", definition: "Roccia ignea intrusiva molto dura e resistente, composta da quarzo, feldspato e mica. Ideale per piani cucina e pavimenti ad alto traffico." },
      { term: "Travertino", definition: "Roccia sedimentaria calcarea caratterizzata da porosità naturale. Usata per rivestimenti interni ed esterni." },
      { term: "Onice", definition: "Varietà di calcite traslucida, spesso retroilluminata per effetti decorativi. Molto pregiata e delicata." },
      { term: "Quarzite", definition: "Roccia metamorfica composta quasi interamente da quarzo. Estremamente dura e resistente agli agenti chimici." },
      { term: "Ardesia", definition: "Roccia metamorfica a grana fine, facilmente sfaldabile in lastre sottili. Usata per coperture, pavimenti e rivestimenti." },
      { term: "Pietra serena", definition: "Arenaria grigio-azzurra tipica della tradizione toscana, usata per elementi architettonici e pavimentazioni." },
      { term: "Pietra di Luserna", definition: "Gneiss lamellare piemontese, resistente al gelo e all'usura, ideale per esterni e pavimentazioni." },
      { term: "Agglomerato", definition: "Materiale composito ottenuto da frammenti di pietra naturale legati con resine. Più uniforme e meno costoso della pietra naturale." },
      { term: "Sinterizzato", definition: "Lastra ceramica ottenuta per sinterizzazione ad altissima temperatura. Resistente a graffi, UV e macchie." },
    ],
  },
  {
    name: "Lavorazioni",
    terms: [
      { term: "Taglio a disco", definition: "Taglio effettuato con disco diamantato su sega a ponte o a bandiera. Produce un taglio netto e preciso." },
      { term: "Taglio a waterjet", definition: "Taglio con getto d'acqua ad altissima pressione miscelata con abrasivo. Permette tagli curvilinei e sagomature complesse." },
      { term: "Fresatura", definition: "Lavorazione meccanica per creare scanalature, profili e sagomature sulla superficie o sui bordi della pietra." },
      { term: "Bisellatura", definition: "Smussatura angolare del bordo di una lastra, tipicamente a 45° per giunzioni a spigolo vivo o effetti estetici." },
      { term: "Toro", definition: "Profilo arrotondato convesso applicato ai bordi di piani e davanzali. Può essere semplice o doppio." },
      { term: "Sguscia", definition: "Profilo concavo applicato ai bordi, opposto al toro. Spesso usato come raccordo tra piano e alzata." },
      { term: "Incollaggio", definition: "Unione di lastre o elementi tramite adesivi epossidici o poliestere. Fondamentale per spessori maggiorati e composizioni." },
      { term: "Rinforzo", definition: "Applicazione di rete in fibra di vetro o barre sul retro delle lastre per aumentare la resistenza meccanica." },
      { term: "Scanso", definition: "Ribassatura o scavo praticato nella pietra per alloggiare altri elementi (es. lavello, piano cottura)." },
      { term: "Foro", definition: "Perforazione circolare nella lastra per rubinetti, scarichi o passaggio impianti." },
    ],
  },
  {
    name: "Finiture superficiali",
    terms: [
      { term: "Lucidatura", definition: "Finitura a specchio ottenuta con abrasivi progressivamente più fini. Esalta il colore e la venatura della pietra." },
      { term: "Levigatura", definition: "Finitura liscia ma opaca (satinata), ottenuta fermando il processo di lucidatura prima dello stadio finale." },
      { term: "Bocciardatura", definition: "Finitura rugosa ottenuta con martello a punte (bocciarda), conferisce un aspetto rustico e antiscivolo." },
      { term: "Fiammatura", definition: "Finitura ottenuta esponendo la superficie a fiamma diretta, che fa scoppiare i cristalli superficiali creando una texture ruvida." },
      { term: "Spazzolatura", definition: "Finitura ottenuta con spazzole abrasive che crea una superficie morbida al tatto, leggermente ondulata." },
      { term: "Sabbiatura", definition: "Finitura ottenuta proiettando sabbia ad alta pressione, crea una superficie uniformemente ruvida." },
      { term: "Rigatura", definition: "Finitura con solchi paralleli sulla superficie, ottenuta con utensili a punta. Effetto decorativo e antiscivolo." },
      { term: "Spacco naturale", definition: "Finitura che mantiene la superficie naturale di rottura della pietra, senza alcuna lavorazione meccanica." },
      { term: "Acidatura", definition: "Trattamento con acido che opacizza la superficie del marmo creando un effetto 'leather' o anticato." },
      { term: "Engobbio", definition: "Rivestimento ceramico sottile applicato sulla superficie prima della cottura per modificare colore o texture." },
    ],
  },
  {
    name: "Misure e specifiche",
    terms: [
      { term: "Spessore", definition: "Misura della sezione trasversale della lastra. Spessori comuni: 1 cm, 2 cm, 3 cm. Influisce su peso, resistenza e costo." },
      { term: "Formato", definition: "Dimensioni della lastra in lunghezza × larghezza. I formati standard variano per materiale e produttore." },
      { term: "Marmetta", definition: "Piastrella di pietra naturale di dimensioni standard (es. 30×30, 40×40, 60×60 cm)." },
      { term: "Lastra grezza", definition: "Lastra di pietra tagliata dal blocco, non ancora rifinita. Base per tutte le lavorazioni successive." },
      { term: "Massello", definition: "Elemento di pietra pieno (non lastra), di spessore elevato, usato per scalini, soglie, davanzali." },
      { term: "Copertina", definition: "Elemento di finitura superiore per muretti, parapetti e setti, con profilo sagomato per lo scolo dell'acqua." },
      { term: "Zoccolino / Battiscopa", definition: "Elemento lineare di finitura alla base delle pareti, tipicamente alto 7-10 cm." },
      { term: "Soglia", definition: "Elemento orizzontale posto alla base di porte e finestre, spesso con gocciolatoio." },
      { term: "Davanzale", definition: "Elemento esterno sotto la finestra con pendenza e gocciolatoio per allontanare l'acqua." },
      { term: "Gocciolatoio", definition: "Scanalatura sotto il bordo esterno di davanzali e soglie che impedisce all'acqua di risalire sulla muratura." },
    ],
  },
  {
    name: "Trattamenti e protezione",
    terms: [
      { term: "Idrorepellente", definition: "Trattamento che riduce l'assorbimento d'acqua della pietra senza alterarne l'aspetto. Da rinnovare periodicamente." },
      { term: "Oleorepellente", definition: "Trattamento che protegge la pietra da macchie di olio e grasso. Spesso combinato con idrorepellente." },
      { term: "Antimacchia", definition: "Trattamento protettivo che penetra nei pori della pietra impedendo l'assorbimento di liquidi macchianti." },
      { term: "Ravvivante", definition: "Prodotto che intensifica il colore naturale della pietra, conferendo un effetto 'bagnato' permanente." },
      { term: "Stuccatura", definition: "Riempimento di fori, crepe o giunzioni con stucco epossidico o poliestere, colorato in tinta con la pietra." },
      { term: "Resinatura", definition: "Applicazione di resina epossidica sulla superficie o sul retro della lastra per consolidarla e riempire microporosità." },
    ],
  },
]

export function Glossary() {
  const [search, setSearch] = useState("")

  const filtered = GLOSSARY_DATA.map((cat) => ({
    ...cat,
    terms: cat.terms.filter(
      (t) =>
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.definition.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.terms.length > 0)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca nel glossario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nessun termine trovato per "{search}"
        </p>
      ) : (
        <Accordion type="multiple" defaultValue={GLOSSARY_DATA.map((c) => c.name)}>
          {filtered.map((cat) => (
            <AccordionItem key={cat.name} value={cat.name}>
              <AccordionTrigger className="text-sm font-semibold">
                {cat.name}
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({cat.terms.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {cat.terms.map((t) => (
                    <div key={t.term}>
                      <dt className="font-medium text-sm text-foreground">{t.term}</dt>
                      <dd className="text-sm text-muted-foreground mt-0.5">{t.definition}</dd>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
