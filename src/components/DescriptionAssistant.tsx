import { useState } from "react"
import { Copy, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

const TEMPLATES: { category: string; templates: string[] }[] = [
  {
    category: "Fornitura e posa",
    templates: [
      "Fornitura e posa in opera di rivestimento in {materiale} {finitura}, spessore {spessore} cm, compreso taglio, lavorazione bordi e sigillatura giunti.",
      "Fornitura e posa in opera di pavimentazione in {materiale} {finitura} formato {formato}, posato a colla su massetto, compresa stuccatura e pulizia finale.",
      "Fornitura e posa in opera di top cucina in {materiale} {finitura}, spessore {spessore} cm, completo di foro lavello, foro rubinetto e bisellatura bordi a vista.",
    ],
  },
  {
    category: "Lavorazioni speciali",
    templates: [
      "Lavorazione di taglio a misura, fresatura profilo {profilo} sui bordi a vista e lucidatura/levigatura delle superfici lavorate.",
      "Esecuzione di fori, scansi e sagomature per alloggiamento apparecchiature, compresi sfridi e lavorazioni accessorie.",
      "Incollaggio e rinforzo di lastre per formazione spessore maggiorato da {spessore_da} a {spessore_a} cm, con rete in fibra di vetro.",
    ],
  },
  {
    category: "Trattamenti",
    templates: [
      "Trattamento protettivo idro-oleorepellente su tutte le superfici in pietra naturale, applicato in due mani a rullo/pennello.",
      "Stuccatura e resinatura di fessurazioni e porosità naturali con resina epossidica bicomponente in tinta.",
      "Levigatura e rilucidatura in opera di pavimentazione esistente in {materiale}, con abrasivi diamantati a grana progressiva.",
    ],
  },
  {
    category: "Elementi architettonici",
    templates: [
      "Fornitura e posa di soglie/davanzali in {materiale} {finitura}, spessore {spessore} cm, con gocciolatoio fresato e bordi lavorati.",
      "Fornitura e posa di zoccolini/battiscopa in {materiale} {finitura}, altezza {altezza} cm, con bordo superiore arrotondato.",
      "Fornitura e posa di scalini in {materiale} {finitura} formato pedata + alzata, con bordo antiscivolo e profilo toro.",
    ],
  },
]

export function DescriptionAssistant() {
  const [sectionName, setSectionName] = useState("")
  const [existingDescriptions, setExistingDescriptions] = useState("")
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleTemplateClick = (template: string) => {
    setResult(template)
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    toast.success("Descrizione copiata!")
  }

  const handleGenerate = async () => {
    if (!sectionName.trim()) {
      toast.error("Inserisci il nome della sezione")
      return
    }
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: {
          sectionName: sectionName.trim(),
          existingDescriptions: existingDescriptions.trim(),
        },
      })
      if (error) throw error
      if (data?.description) {
        setResult(data.description)
        toast.success("Descrizione generata!")
      }
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Errore nella generazione")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* AI Generation */}
      <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Genera con AI
        </h3>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Nome sezione</Label>
            <Input
              placeholder="es. Top cucina in marmo Calacatta"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Descrizioni esistenti (opzionale, per coerenza)</Label>
            <Textarea
              placeholder="Incolla qui le descrizioni delle altre sezioni del preventivo per mantenere uno stile coerente..."
              value={existingDescriptions}
              onChange={(e) => setExistingDescriptions(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading} size="sm" className="w-full">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Genera descrizione
          </Button>
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Template predefiniti</h3>
        {TEMPLATES.map((cat) => (
          <div key={cat.category}>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{cat.category}</p>
            <div className="space-y-1.5">
              {cat.templates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplateClick(tpl)}
                  className="w-full text-left text-xs p-2.5 rounded-md border border-border bg-background hover:bg-accent transition-colors leading-relaxed"
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-2 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <Label className="text-xs font-semibold">Risultato</Label>
          <Textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={4}
          />
          <Button onClick={handleCopy} size="sm" variant="outline" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copia descrizione
          </Button>
        </div>
      )}
    </div>
  )
}
