import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Save, X, Plus, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useQuotes } from "@/hooks/useQuotes"
import { useProducts } from "@/hooks/useProducts"
import { useClients } from "@/hooks/useClients"
import { useTags } from "@/hooks/useTags"
import { LoadingSpinner, StatCard } from "@/components/shared"

const Settings = () => {
  const { toast } = useToast()
  const { profile, updateProfile } = useAuth()
  const { data: quotes = [] } = useQuotes()
  const { data: products = [] } = useProducts()
  const { data: clients = [] } = useClients()
  const { tags: suggestedTags, addTag, removeTag: removeTagFromList, resetToDefaults } = useTags()
  const [newTag, setNewTag] = useState("")
  const [settings, setSettings] = useState({
    company_name: "", address: "", phone: "", website: "", vat_number: "", tax_code: "", notes: ""
  })

  useEffect(() => {
    if (profile) {
      setSettings({
        company_name: profile.company_name || "", address: profile.address || "",
        phone: profile.phone || "", website: profile.website || "",
        vat_number: profile.vat_number || "", tax_code: profile.tax_code || "",
        notes: profile.notes || ""
      })
    }
  }, [profile])

  const saveSettings = async () => {
    try {
      await updateProfile(settings)
      toast({ title: "Impostazioni Salvate", description: "Le impostazioni dell'azienda sono state aggiornate" })
    } catch {
      toast({ title: "Errore", description: "Si è verificato un errore durante il salvataggio", variant: "destructive" })
    }
  }

  if (!profile) return <LoadingSpinner />

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">Configura l'azienda e visualizza le statistiche dei dati</p>
      </div>

      {/* Company Settings */}
      <Card>
        <CardHeader><CardTitle>Dati Azienda</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Ragione Sociale</Label>
              <Input id="company-name" value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} placeholder="La Mia Azienda S.r.l." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat-number">Partita IVA</Label>
              <Input id="vat-number" value={settings.vat_number} onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })} placeholder="IT12345678901" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-code">Codice Fiscale</Label>
              <Input id="tax-code" value={settings.tax_code} onChange={(e) => setSettings({ ...settings, tax_code: e.target.value })} placeholder="12345678901" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Sito Web</Label>
              <Input id="website" value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })} placeholder="www.miaazienda.it" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input id="company-email" type="email" value={profile.email} disabled className="bg-muted cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">L'email è collegata al tuo account e non può essere modificata qui</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefono</Label>
              <Input id="company-phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+39 123 456 7890" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Indirizzo</Label>
            <Textarea id="company-address" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Via Roma 123, 00100 Roma (RM)" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-notes">Note Aziendali</Label>
            <Textarea id="company-notes" value={settings.notes} onChange={(e) => setSettings({ ...settings, notes: e.target.value })} placeholder="Note che appariranno sui preventivi..." rows={4} />
          </div>
          <Button onClick={saveSettings} className="gap-2"><Save className="h-4 w-4" />Salva Impostazioni</Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Tag Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestione Tag</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetToDefaults} className="gap-1 text-xs"><RotateCcw className="h-3 w-3" />Ripristina default</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-sm py-1 px-3">
                {tag}
                <button type="button" onClick={() => removeTagFromList(tag)} className="hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); if (newTag.trim()) { addTag(newTag); setNewTag("") } }
            }} placeholder="Aggiungi nuovo tag..." className="max-w-xs" />
            <Button variant="outline" size="icon" onClick={() => { if (newTag.trim()) { addTag(newTag); setNewTag("") } }}><Plus className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Questi tag saranno disponibili come suggerimenti quando crei le sezioni dei preventivi.</p>
        </CardContent>
      </Card>

      <Separator />

      {/* Data Statistics */}
      <Card>
        <CardHeader><CardTitle>Statistiche Dati</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Preventivi" value={quotes.length} className="text-primary" />
            <StatCard title="Prodotti" value={products.length} className="text-success" />
            <StatCard title="Clienti" value={clients.length} className="text-warning" />
          </div>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">I tuoi dati sono sincronizzati in tempo reale e accessibili da qualsiasi dispositivo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
