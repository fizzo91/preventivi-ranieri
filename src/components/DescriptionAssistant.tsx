import { useState, useEffect } from "react"
import { Copy, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

export function DescriptionAssistant() {
  const [sectionName, setSectionName] = useState("")
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [storedDescriptions, setStoredDescriptions] = useState("")
  const [descCount, setDescCount] = useState(0)

  // Fetch all section descriptions from user's quotes on mount
  useEffect(() => {
    const fetchDescriptions = async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("sections")

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

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    toast.success("Descrizione copiata!")
  }

  const handleGenerate = async () => {
    if (!sectionName.trim()) {
      toast.error("Inserisci una descrizione generica")
      return
    }
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: {
          sectionName: sectionName.trim(),
          existingDescriptions: storedDescriptions,
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
        <p className="text-xs text-muted-foreground">
          L'AI analizzerà {descCount > 0 ? `${descCount} descrizioni` : "le descrizioni"} dai tuoi preventivi per generare testi coerenti.
        </p>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Descrizione generica</Label>
            <Input
              placeholder="es. Tavolo top in pietra lavica smaltata Deep"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
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
