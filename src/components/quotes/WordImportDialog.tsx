import { useState, useRef } from "react"
import mammoth from "mammoth/mammoth.browser"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { FileText, Upload, Loader2, Trash2, Sparkles } from "lucide-react"
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

export function WordImportDialog({ open, onOpenChange, products, recentProductIds, onImport, nextSectionNumber }: Props) {
  const { toast } = useToast()
  const [step, setStep] = useState<"upload" | "loading" | "preview">("upload")
  const [fileName, setFileName] = useState("")
  const [sections, setSections] = useState<ParsedSection[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const productOptions = products.map(p => ({ value: p.id, label: p.name, unit: p.unit }))

  const reset = () => {
    setStep("upload"); setFileName(""); setSections([])
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast({ title: "Formato non valido", description: "Carica un file .docx", variant: "destructive" }); return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Max 5MB", variant: "destructive" }); return
    }
    setFileName(file.name)
    setStep("loading")
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Verify zip magic (PK)
      const head = new Uint8Array(arrayBuffer.slice(0, 2))
      if (head[0] !== 0x50 || head[1] !== 0x4b) {
        throw new Error("Il file non è un .docx valido")
      }
      const { value: text } = await mammoth.extractRawText({ arrayBuffer })
      if (!text || text.trim().length < 10) throw new Error("Il documento è vuoto")

      const productsLite = products.map(p => ({
        id: p.id, name: p.name, category: p.category, price: p.price_dt, unit: p.unit
      }))

      const { data, error } = await supabase.functions.invoke("parse-word-quote", {
        body: { text, products: productsLite },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const parsed: ParsedSection[] = Array.isArray(data?.sections) ? data.sections : []
      if (parsed.length === 0) throw new Error("Nessuna sezione riconosciuta nel documento")
      setSections(parsed)
      setStep("preview")
    } catch (e: any) {
      toast({ title: "Errore analisi", description: e?.message || "Impossibile analizzare il documento", variant: "destructive" })
      setStep("upload")
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
  const removeSection = (si: number) => {
    setSections(prev => prev.filter((_, i) => i !== si))
  }

  const confirm = () => {
    const ts = Date.now()
    const built: QuoteSection[] = sections
      .filter(s => s.items.length > 0)
      .map((s, si) => {
        const sectionId = `${ts}-imp-${si}`
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

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(reset, 300) }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Importa da Word
          </DialogTitle>
          <DialogDescription>
            Carica un .docx con descrizioni e quantità: l'AI riconosce sezioni e voci e le abbina ai prodotti del catalogo DT.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="py-8">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:bg-muted/40 transition"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Clicca per caricare un file .docx</p>
              <p className="text-xs text-muted-foreground mt-1">Max 5MB · Solo formato Word</p>
              <input
                ref={inputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Non sai come strutturare il documento?{" "}
              <button
                type="button"
                className="text-primary underline hover:no-underline"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const res = await fetch("/templates/template-preventivo.docx")
                    if (!res.ok) throw new Error(String(res.status))
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = "template-preventivo.docx"
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    setTimeout(() => URL.revokeObjectURL(url), 1000)
                  } catch (err) {
                    toast({ title: "Download non riuscito", description: "Riprova tra poco", variant: "destructive" })
                  }
                }}
              >
                Scarica il template di esempio
              </button>
            </p>
          </div>
        )}

        {step === "loading" && (
          <div className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">Analisi in corso…</p>
            <p className="text-sm text-muted-foreground">{fileName}</p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> {fileName} · {sections.length} sezioni, {sections.reduce((s, x) => s + x.items.length, 0)} voci
            </div>
            {sections.map((s, si) => (
              <div key={si} className="border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    value={s.name}
                    onChange={(e) => updateSection(si, "name", e.target.value)}
                    className="font-semibold"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeSection(si)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {s.description && (
                  <Textarea
                    value={s.description}
                    onChange={(e) => updateSection(si, "description", e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                )}
                <div className="space-y-2">
                  {s.items.map((it, ii) => (
                    <div key={ii} className="grid grid-cols-12 gap-2 items-start p-2 border rounded bg-background">
                      <div className="col-span-12 md:col-span-5 space-y-1">
                        <Label className="text-xs">Descrizione</Label>
                        <Textarea
                          value={it.description}
                          onChange={(e) => updateItem(si, ii, "description", e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 space-y-1">
                        <Label className="text-xs">Quantità</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={it.quantity}
                          onChange={(e) => updateItem(si, ii, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1 space-y-1">
                        <Label className="text-xs">MQ</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={it.mq ?? ""}
                          onChange={(e) => updateItem(si, ii, "mq", e.target.value === "" ? null : parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-11 md:col-span-3 space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          Prodotto
                          {it.matchedProductId && it.confidence > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1">{Math.round(it.confidence * 100)}%</Badge>
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {step === "preview" ? (
            <>
              <Button variant="outline" onClick={reset}>Ricomincia</Button>
              <Button onClick={confirm} disabled={sections.length === 0}>
                Aggiungi {sections.length} {sections.length === 1 ? "sezione" : "sezioni"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Chiudi</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
