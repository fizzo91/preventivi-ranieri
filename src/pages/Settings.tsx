import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Save, Download, Upload, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CompanySettings {
  companyName: string
  address: string
  phone: string
  email: string
  website: string
  vatNumber: string
  taxCode: string
  notes: string
  logo: string
}

const Settings = () => {
  const { toast } = useToast()
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    vatNumber: "",
    taxCode: "",
    notes: "",
    logo: ""
  })

  useEffect(() => {
    // Carica impostazioni dal localStorage
    const savedSettings = JSON.parse(localStorage.getItem('companySettings') || '{}')
    setSettings(prev => ({...prev, ...savedSettings}))
  }, [])

  const saveSettings = () => {
    localStorage.setItem('companySettings', JSON.stringify(settings))
    toast({
      title: "Impostazioni Salvate",
      description: "Le impostazioni dell'azienda sono state aggiornate",
    })
  }

  const exportData = () => {
    const data = {
      settings,
      quotes: JSON.parse(localStorage.getItem('quotes') || '[]'),
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      clients: JSON.parse(localStorage.getItem('clients') || '[]'),
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `preventivi-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Backup Esportato",
      description: "Il backup dei dati è stato scaricato con successo",
    })
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (data.settings) localStorage.setItem('companySettings', JSON.stringify(data.settings))
        if (data.quotes) localStorage.setItem('quotes', JSON.stringify(data.quotes))
        if (data.products) localStorage.setItem('products', JSON.stringify(data.products))
        if (data.clients) localStorage.setItem('clients', JSON.stringify(data.clients))
        
        if (data.settings) setSettings(data.settings)
        
        toast({
          title: "Backup Importato",
          description: "I dati sono stati ripristinati con successo. Ricarica la pagina per vedere le modifiche.",
        })
      } catch (error) {
        toast({
          title: "Errore Importazione",
          description: "Il file selezionato non è valido",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  const clearAllData = () => {
    if (window.confirm("Sei sicuro di voler cancellare tutti i dati? Questa operazione non può essere annullata.")) {
      localStorage.removeItem('quotes')
      localStorage.removeItem('products') 
      localStorage.removeItem('clients')
      localStorage.removeItem('companySettings')
      
      setSettings({
        companyName: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        vatNumber: "",
        taxCode: "",
        notes: "",
        logo: ""
      })
      
      toast({
        title: "Dati Cancellati",
        description: "Tutti i dati sono stati rimossi dal sistema",
      })
    }
  }

  const dataStats = {
    quotes: JSON.parse(localStorage.getItem('quotes') || '[]').length,
    products: JSON.parse(localStorage.getItem('products') || '[]').length,
    clients: JSON.parse(localStorage.getItem('clients') || '[]').length
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">
          Configura l'azienda e gestisci i dati dell'applicazione
        </p>
      </div>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Dati Azienda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Ragione Sociale</Label>
              <Input
                id="company-name"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                placeholder="La Mia Azienda S.r.l."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat-number">Partita IVA</Label>
              <Input
                id="vat-number"
                value={settings.vatNumber}
                onChange={(e) => setSettings({...settings, vatNumber: e.target.value})}
                placeholder="IT12345678901"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-code">Codice Fiscale</Label>
              <Input
                id="tax-code"
                value={settings.taxCode}
                onChange={(e) => setSettings({...settings, taxCode: e.target.value})}
                placeholder="12345678901"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Sito Web</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => setSettings({...settings, website: e.target.value})}
                placeholder="www.miaazienda.it"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input
                id="company-email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                placeholder="info@miaazienda.it"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefono</Label>
              <Input
                id="company-phone"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-address">Indirizzo</Label>
            <Textarea
              id="company-address"
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
              placeholder="Via Roma 123, 00100 Roma (RM)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-notes">Note Aziendali</Label>
            <Textarea
              id="company-notes"
              value={settings.notes}
              onChange={(e) => setSettings({...settings, notes: e.target.value})}
              placeholder="Note che appariranno sui preventivi..."
              rows={4}
            />
          </div>

          <Button onClick={saveSettings} className="gap-2">
            <Save className="h-4 w-4" />
            Salva Impostazioni
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestione Dati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{dataStats.quotes}</div>
              <div className="text-sm text-muted-foreground">Preventivi</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-success">{dataStats.products}</div>
              <div className="text-sm text-muted-foreground">Prodotti</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-warning">{dataStats.clients}</div>
              <div className="text-sm text-muted-foreground">Clienti</div>
            </div>
          </div>

          {/* Export/Import */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Backup e Ripristino</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Esporta tutti i tuoi dati per creare un backup o importa dati da un file precedente.
              </p>
              <div className="flex gap-4">
                <Button onClick={exportData} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Esporta Backup
                </Button>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button variant="outline" className="gap-2" onClick={() => document.getElementById('import-file')?.click()}>
                    <Upload className="h-4 w-4" />
                    Importa Backup
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">Zona Pericolosa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cancella definitivamente tutti i dati dall'applicazione. Questa operazione non può essere annullata.
              </p>
              <Button onClick={clearAllData} variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Cancella Tutti i Dati
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings