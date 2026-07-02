import { useState, useEffect, useRef } from "react"
import { Copy, Sparkles, Loader2, Image as ImageIcon, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { validateImageFile } from "@/lib/fileValidation"

export function DescriptionAssistant() {
  const [sectionName, setSectionName] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [storedDescriptions, setStoredDescriptions] = useState("")
  const [descCount, setDescCount] = useState(0)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchDescriptions = async () => {
      const { data, error } = await supabase.from("quotes").select("sections")
      if (error || !data) return
      const descriptions: string[] = []
      for (const quote of data) {
        const sections = quote.sections as any[]
        if (!Array.isArray(sections)) continue
        for (const section of sections) {
          if (section.description && typeof section.description === "string" && section.description.trim()) {
            descriptions.push(`${section.name || "Sezione"}: ${section.description.trim()}`)
          }
        }
      }
      const unique = [...new Set(descriptions)]
      setDescCount(unique.length)
      setStoredDescriptions(unique.slice(0, 30).join("\n\n"))
    }
    fetchDescriptions()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validation = await validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error || "File non valido")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(reader.result as string)
    reader.onerror = () => toast.error("Errore nella lettura del file")
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageDataUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const copyOne = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Descrizione copiata!")
  }

  const copyAll = () => {
    if (!results.length) return
    navigator.clipboard.writeText(results.join("\n"))
    toast.success(`${results.length} descrizioni copiate!`)
  }

  const updateResult = (i: number, v: string) => {
    setResults((prev) => prev.map((r, idx) => (idx === i ? v : r)))
  }

  const handleGenerate = async () => {
    if (!sectionName.trim() && !imageDataUrl) {
      toast.error("Inserisci una descrizione o carica un'immagine")
      return
    }
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: {
          sectionName: sectionName.trim(),
          existingDescriptions: storedDescriptions,
          imageDataUrl: imageDataUrl || undefined,
        },
      })
      if (error) throw error
      // Support new (descriptions[]) and legacy ({description}) responses
      const arr: string[] = Array.isArray(data?.descriptions)
        ? data.descriptions.filter((s: unknown) => typeof s === "string" && s.trim())
        : data?.description
        ? [String(data.description).trim()]
        : []
      if (!arr.length) throw new Error("Nessuna descrizione generata")
      setResults(arr)
      toast.success(arr.length > 1 ? `${arr.length} descrizioni generate!` : "Descrizione generata!")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Errore nella generazione")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Genera con AI
        </h3>
        <p className="text-xs text-muted-foreground">
          L'AI analizzerà {descCount > 0 ? `${descCount} descrizioni` : "le descrizioni"} dai tuoi preventivi. Puoi caricare uno screenshot per generare una descrizione RLS per ogni elemento visibile.
        </p>

        {/* Image upload */}
        <div className="space-y-2">
          <Label className="text-xs">Immagine (opzionale)</Label>
          {imageDataUrl ? (
            <div className="relative rounded-lg border border-border overflow-hidden bg-background">
              <img src={imageDataUrl} alt="Preview" className="w-full max-h-48 object-contain" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Carica screenshot (JPG/PNG/WEBP, max 5MB)
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className="space-y-2">
          <div>
            <Label className="text-xs">
              Descrizione generica {imageDataUrl ? "(opzionale — hint aggiuntivo)" : ""}
            </Label>
            <Input
              placeholder="es. Tavolo top in pietra lavica smaltata Deep"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading} size="sm" className="w-full">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : imageDataUrl ? (
              <ImageIcon className="h-4 w-4 mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {imageDataUrl ? "Analizza immagine e genera" : "Genera descrizione"}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">
              {results.length > 1 ? `Risultati (${results.length})` : "Risultato"}
            </Label>
            {results.length > 1 && (
              <Button onClick={copyAll} size="sm" variant="outline">
                <Copy className="h-3 w-3 mr-1" />
                Copia tutte
              </Button>
            )}
          </div>
          {results.map((r, i) => (
            <div key={i} className="space-y-2">
              <Textarea
                value={r}
                onChange={(e) => updateResult(i, e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button onClick={() => copyOne(r)} size="sm" variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copia
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
