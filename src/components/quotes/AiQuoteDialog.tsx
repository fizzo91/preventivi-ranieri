import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { Loader2, Trash2, Sparkles, Wand2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/hooks/useProducts"
import type { QuoteSection, QuoteItem } from "@/types/quote"

interface ParsedItem {
  description: string
  quantity: number
  mq: number | null
  matchedProductId: string | null
  confidence: number
}
interface ParsedSection {
  name: string
  description: string
  items: ParsedItem[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  recentProductIds: string[]
  onImport: (sections: QuoteSection[]) => void
  nextSectionNumber: number
}

const EXAMPLE = `Es. Fornitura e posa di rivestimento in pietra lavica smaltata per bagno padronale, 12 mq spessore 2 cm, finitura opaca.
Top lavabo su misura 1,80 x 0,55 m con foro per lavabo sottopiano.
Zoccolino perimetrale 14 ml.`

export function AiQuoteDialog({ open, onOpenChange, products, recentProductIds, onImport, nextSectionNumber }: Props) {
  const { toast } = useToast()
  const [step, setStep] = useState<"input" | "loading" | "preview">("input")
  const [text, setText] = useState("")
  const [sections, setSections] = useState<ParsedSection[]>([])

  const productOptions = products.map(p => ({ value: p.id, label: p.name, unit: p.unit }))

  const reset = () => { setStep("input"); setSections([]) }

  const generate = async () => {
    if (text.trim().length < 20) {
      toast({ title: "Testo troppo corto", description: "Scrivi almeno 20 caratteri.", variant: "destructive" })
      return
    }
    setStep("loading")
    try {
      const { data, error } = await supabase.functions.invoke("quote-from-text", {
        body: { text: text.trim() },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const parsed: ParsedSection[] = Array.isArray(data?.sections) ? data.sections : []
      if (parsed.length === 0) throw new Error("Nessuna voce riconosciuta nel testo")
      setSections(parsed)
      setStep("preview")
    } catch (e: any) {
      toast({ title: "Generazione non riuscita", description: e?.message || "Riprova tra poco", variant: "destructive" })
      setStep("input")
    }
  }

  const updateSection = (si: number, field: keyof ParsedSection, val: any) => {
    setSections(prev => prev.map((s, i) => i === si ? { ...s, [field]: val } : s))
  }
  const updateItem = (si: number, ii: number, field: keyof ParsedItem, val: any) => {
    setSections(prev => prev.map((s, i) => i !== si ? s : {
      ...s, items: s.items.map((it, j) => j === ii ? { ...it, [field]: val } : it)
    }))
  }
  const removeItem = (si: number, ii: number) => {
    setSections(prev => prev.map((s, i) => i !== si ? s : { ...s, items: s.items.filter((_, j) => j !== ii) }))
  }
  const removeSection = (si: number) => setSections(prev => prev.filter((_, i) => i !== si))

  const confirm = () => {
    const ts = Date.now()
    const built: QuoteSection[] = sections
      .filter(s => s.items.length > 0)
      .map((s, si) => {
        const sectionId = `${ts}-ai-${si}`
        const items: QuoteItem[] = s.items.map((it, ii) => {
          const product = it.matchedProductId ? products.find(p => p.id === it.matchedProductId) : null
          const price = product?.price_dt ?? 0
          const quantity = it.quantity || 1
          return {
            id: `${sectionId}-item-${ii}`,
            productId: product?.id || "",
            productName: product?.name || "",
            category: product?.category || "",
            description: it.description,
            quantity,
            price,
            unit: product?.unit || (it.mq != null ? "mq" : ""),
            total: quantity * price,
          }
        })
        const mqTotal = s.items.reduce((sum, it) => sum + (it.mq || 0), 0)
        return {
          id: sectionId,
          name: `ID.${String(nextSectionNumber + si).padStart(2, '0')} — ${s.name}`.slice(0, 80),
          description: s.description || "",
          items,
          risks: [],
          engobbio: 0,
          engobbioBase: 0,
          engobbioRiskPct: 0,
          finitura: 0,
          total: items.reduce((sum, it) => sum + it.total, 0),
          mqTotali: mqTotal > 0 ? mqTotal : undefined,
          euroPerMq: undefined,
          tags: [],
          quantity: 1,
        }
      })
    onImport(built)
    onOpenChange(false)
    setTimeout(reset, 300)
  }

  const totalItems = sections.reduce((s, x) => s + x.items.length, 0)

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(reset, 300) }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> Genera da testo (AI)
          </DialogTitle>
          <DialogDescription>
            Descrivi il lavoro a parole: l'AI crea sezioni e voci abbinandole al prodotto più simile del listino DT.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-3 py-2">
            <Label htmlFor="ai-quote-text">Descrizione del lavoro</Label>
            <Textarea
              id="ai-quote-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE}
              rows={12}
              maxLength={40000}
            />
            <p className="text-xs text-muted-foreground">{text.length} / 40.000 caratteri</p>
          </div>
        )}

        {step === "loading" && (
          <div className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">Generazione in corso…</p>
            <p className="text-sm text-muted-foreground">Analisi del testo e abbinamento prodotti</p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" /> {sections.length} sezioni, {totalItems} voci · verifica gli abbinamenti prima di confermare
            </div>
            {sections.map((s, si) => (
              <div key={si} className="border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-center gap-2">
                  <Input value={s.name} onChange={(e) => updateSection(si, "name", e.target.value)} className="font-semibold" />
                  <Button variant="ghost" size="icon" onClick={() => removeSection(si)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {s.description && (
                  <Textarea value={s.description} onChange={(e) => updateSection(si, "description", e.target.value)} rows={2} className="text-sm" />
                )}
                <div className="space-y-2">
                  {s.items.map((it, ii) => {
                    const lowConfidence = it.confidence < 0.6
                    return (
                      <div
                        key={ii}
                        className={`grid grid-cols-12 gap-2 items-start p-2 border rounded bg-background ${lowConfidence ? "border-destructive/50 bg-destructive/5" : ""}`}
                      >
                        <div className="col-span-12 md:col-span-5 space-y-1">
                          <Label className="text-xs">Descrizione</Label>
                          <Textarea value={it.description} onChange={(e) => updateItem(si, ii, "description", e.target.value)} rows={2} className="text-sm" />
                        </div>
                        <div className="col-span-4 md:col-span-2 space-y-1">
                          <Label className="text-xs">Quantità</Label>
                          <Input type="number" step="0.01" value={it.quantity}
                            onChange={(e) => updateItem(si, ii, "quantity", parseFloat(e.target.value.replace(",", ".")) || 0)} />
                        </div>
                        <div className="col-span-4 md:col-span-1 space-y-1">
                          <Label className="text-xs">MQ</Label>
                          <Input type="number" step="0.01" value={it.mq ?? ""}
                            onChange={(e) => updateItem(si, ii, "mq", e.target.value === "" ? null : parseFloat(e.target.value.replace(",", ".")))} />
                        </div>
                        <div className="col-span-11 md:col-span-3 space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            Prodotto
                            {it.matchedProductId && (
                              <Badge variant={lowConfidence ? "destructive" : "secondary"} className="text-[10px] px-1">
                                {Math.round(it.confidence * 100)}%
                              </Badge>
                            )}
                          </Label>
                          <Combobox
                            options={productOptions}
                            value={it.matchedProductId || ""}
                            placeholder="Voce libera"
                            searchPlaceholder="Cerca prodotto…"
                            recentIds={recentProductIds}
                            onSelect={(v) => updateItem(si, ii, "matchedProductId", v || null)}
                          />
                        </div>
                        <div className="col-span-1 flex justify-end pt-5">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(si, ii)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {step === "preview" ? (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>Modifica testo</Button>
              <Button onClick={confirm} disabled={sections.length === 0}>
                Aggiungi {sections.length} {sections.length === 1 ? "sezione" : "sezioni"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Chiudi</Button>
              <Button onClick={generate} disabled={step === "loading"}>
                {step === "loading" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Genera preventivo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
