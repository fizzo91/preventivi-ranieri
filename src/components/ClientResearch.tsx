import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Globe, MapPin, Palette, Instagram, Users, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ClientInfo {
  name: string
  geographic_area: string | null
  website: string | null
  interest_area: string | null
  instagram_id: string | null
  instagram_followers: string | null
}

export const ClientResearch = () => {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ClientInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (query.trim().length < 2) {
      toast({ title: "Inserisci almeno 2 caratteri", variant: "destructive" })
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke("client-research", {
        body: { query: query.trim() },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)
      if (data?.success && data?.data) {
        setResult(data.data)
      } else {
        setError("Nessuna informazione trovata")
      }
    } catch (e: any) {
      setError(e.message || "Errore nella ricerca")
      toast({ title: "Errore", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fields = result
    ? [
        { icon: Users, label: "Nome", value: result.name },
        { icon: MapPin, label: "Area Geografica", value: result.geographic_area },
        { icon: Globe, label: "Sito Web", value: result.website, isLink: true },
        { icon: Palette, label: "Area di Interesse", value: result.interest_area },
        { icon: Instagram, label: "Instagram", value: result.instagram_id ? `@${result.instagram_id}` : null, link: result.instagram_id ? `https://instagram.com/${result.instagram_id}` : undefined },
        { icon: Users, label: "Follower IG", value: result.instagram_followers, note: "Dato stimato, potrebbe non essere aggiornato" },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="client-query">Nome Azienda / Cliente</Label>
        <div className="flex gap-2">
          <Input
            id="client-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="es. Salvatori, Antolini, Mapei..."
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} size="icon" className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            {fields.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <f.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{f.label}</div>
                  {f.value ? (
                    f.isLink || f.link ? (
                      <a
                        href={f.link || (f.value.startsWith("http") ? f.value : `https://${f.value}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {f.value}
                      </a>
                    ) : (
                      <div className="text-sm font-medium">{f.value}</div>
                    )}
                    {f.note && f.value && (
                      <div className="text-xs text-muted-foreground italic mt-0.5">{f.note}</div>
                    )
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Non trovato</div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
