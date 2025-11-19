import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Edit, Trash2, Plus, Search, FileDown, Copy, Upload, Download } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { usePdfGenerator } from "@/hooks/usePdfGenerator"
import { useToast } from "@/hooks/use-toast"
import { QuoteSchema } from "@/lib/validation"

interface Quote {
  number: string
  client: {
    name: string
    company: string
    email?: string
    phone?: string
    address?: string
  }
  totalAmount: number
  status: string
  createdAt: string
  sections?: any[]
  discount?: number
  taxRate?: number
  risks?: any[]
}

const Quotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { generatePdf } = usePdfGenerator()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    // Carica preventivi dal localStorage
    const savedQuotes = JSON.parse(localStorage.getItem('quotes') || '[]')
    setQuotes(savedQuotes)
  }, [])

  const filteredQuotes = quotes.filter(quote => 
    quote.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Raggruppa preventivi per mese
  const groupedQuotes = filteredQuotes.reduce((groups: { [key: string]: Quote[] }, quote) => {
    const date = new Date(quote.createdAt)
    const monthYear = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    if (!groups[monthYear]) {
      groups[monthYear] = []
    }
    groups[monthYear].push(quote)
    return groups
  }, {})

  // Ordina i preventivi all'interno di ogni gruppo dal più recente al più vecchio
  Object.keys(groupedQuotes).forEach(month => {
    groupedQuotes[month].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  })

  // Ordina i mesi dal più recente al più vecchio
  const sortedMonths = Object.keys(groupedQuotes).sort((a, b) => {
    const dateA = new Date(groupedQuotes[a][0].createdAt)
    const dateB = new Date(groupedQuotes[b][0].createdAt)
    return dateB.getTime() - dateA.getTime()
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bozza':
        return 'bg-muted text-muted-foreground'
      case 'inviato':
        return 'bg-success text-success-foreground'
      case 'approvato':
        return 'bg-success text-success-foreground'
      case 'in attesa':
        return 'bg-warning text-warning-foreground'
      case 'rifiutato':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const updateQuoteStatus = (quoteNumber: string, newStatus: string) => {
    const updatedQuotes = quotes.map(q => 
      q.number === quoteNumber ? { ...q, status: newStatus } : q
    )
    setQuotes(updatedQuotes)
    localStorage.setItem('quotes', JSON.stringify(updatedQuotes))
  }

  const deleteQuote = (quoteNumber: string) => {
    const updatedQuotes = quotes.filter(q => q.number !== quoteNumber)
    setQuotes(updatedQuotes)
    localStorage.setItem('quotes', JSON.stringify(updatedQuotes))
  }

  const duplicateQuote = (quote: Quote) => {
    console.log('Duplicating quote:', quote)
    
    // Genera un nuovo numero preventivo
    const newNumber = `PREV-${Date.now()}`
    
    // Crea una copia profonda del preventivo
    const duplicatedQuote: Quote = {
      ...quote,
      number: newNumber,
      createdAt: new Date().toISOString(),
      status: 'Bozza',
      sections: quote.sections ? JSON.parse(JSON.stringify(quote.sections)) : [],
      risks: quote.risks ? JSON.parse(JSON.stringify(quote.risks)) : []
    }

    console.log('New duplicated quote:', duplicatedQuote)

    // Aggiunge il nuovo preventivo e salva
    const updatedQuotes = [...quotes, duplicatedQuote]
    console.log('Updated quotes array:', updatedQuotes)
    
    setQuotes(updatedQuotes)
    localStorage.setItem('quotes', JSON.stringify(updatedQuotes))
    
    console.log('Quote duplicated successfully')
  }

  const handleGeneratePdf = async (quote: Quote) => {
    try {
      await generatePdf({
        quoteNumber: quote.number,
        client: quote.client,
        sections: quote.sections || [],
        totalAmount: quote.totalAmount
      })
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la generazione del PDF. Riprova più tardi.",
        variant: "destructive"
      })
    }
  }

  const exportQuote = (quote: Quote) => {
    const dataStr = JSON.stringify(quote, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${quote.number}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importQuote = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        // Validate the imported quote
        const validationResult = QuoteSchema.safeParse(importedData)
        
        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          ).join(', ')
          
          toast({
            title: "Errore Validazione",
            description: `Il preventivo importato non è valido: ${errorMessages.substring(0, 100)}...`,
            variant: "destructive"
          })
          return
        }

        const importedQuote = validationResult.data as Quote
        
        // Verifica se il preventivo esiste già
        const existingQuote = quotes.find(q => q.number === importedQuote.number)
        if (existingQuote) {
          if (!confirm(`Il preventivo ${importedQuote.number} esiste già. Vuoi sovrascriverlo?`)) {
            return
          }
          // Sovrascrivi il preventivo esistente
          const updatedQuotes = quotes.map(q => 
            q.number === importedQuote.number ? importedQuote as Quote : q
          )
          setQuotes(updatedQuotes)
          localStorage.setItem('quotes', JSON.stringify(updatedQuotes))
        } else {
          // Aggiungi il nuovo preventivo
          const updatedQuotes = [...quotes, importedQuote as Quote]
          setQuotes(updatedQuotes)
          localStorage.setItem('quotes', JSON.stringify(updatedQuotes))
        }
        
        toast({
          title: "Preventivo Importato",
          description: "Il preventivo è stato importato con successo",
        })
      } catch (error) {
        toast({
          title: "Errore",
          description: "Errore durante l'importazione del preventivo. Verifica che il file sia corretto.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
    
    // Reset input per permettere di caricare lo stesso file più volte
    event.target.value = ''
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Preventivi</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci tutti i tuoi preventivi
          </p>
        </div>
        <div className="flex gap-2">
          <label htmlFor="import-quote">
            <Button variant="outline" asChild>
              <span className="cursor-pointer gap-2">
                <Upload className="h-4 w-4" />
                Importa
              </span>
            </Button>
          </label>
          <input
            id="import-quote"
            type="file"
            accept=".json"
            onChange={importQuote}
            className="hidden"
          />
          <Link to="/new-quote">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Preventivo
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per cliente, azienda o numero preventivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale Preventivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bozze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => q.status === 'Bozza').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inviati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {quotes.filter(q => q.status === 'Inviato').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              € {quotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Preventivi</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {quotes.length === 0 
                  ? "Nessun preventivo trovato. Crea il tuo primo preventivo!" 
                  : "Nessun preventivo corrisponde ai criteri di ricerca."}
              </p>
              {quotes.length === 0 && (
                <Link to="/new-quote" className="mt-4 inline-block">
                  <Button>Crea Primo Preventivo</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedMonths.map((month) => (
                <div key={month} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground capitalize sticky top-0 bg-background py-2">
                    {month}
                  </h3>
                  <div className="space-y-4">
                    {groupedQuotes[month].map((quote) => (
                      <div key={quote.number} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{quote.number}</p>
                            <Select
                              value={quote.status}
                              onValueChange={(value) => updateQuoteStatus(quote.number, value)}
                            >
                              <SelectTrigger className="w-[120px] h-6">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bozza">Bozza</SelectItem>
                                <SelectItem value="Inviato">Inviato</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {quote.client.name} {quote.client.company && `• ${quote.client.company}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(quote.createdAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-success">
                              € {quote.totalAmount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <div className="flex items-center justify-between">
                                    <DialogTitle>Dettagli Preventivo {quote.number}</DialogTitle>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleGeneratePdf(quote)}
                                      className="gap-2"
                                    >
                                      <FileDown className="h-4 w-4" />
                                      Esporta PDF
                                    </Button>
                                  </div>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Cliente</h4>
                                      <p>{quote.client.name}</p>
                                      {quote.client.company && <p>{quote.client.company}</p>}
                                      {quote.client.email && <p>{quote.client.email}</p>}
                                      {quote.client.phone && <p>{quote.client.phone}</p>}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Dettagli</h4>
                                      <p>Numero: {quote.number}</p>
                                      <p>Data: {new Date(quote.createdAt).toLocaleDateString('it-IT')}</p>
                                      <p>Stato: <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge></p>
                                      <p className="text-lg font-bold text-success">Totale: € {quote.totalAmount?.toFixed(2) || '0.00'}</p>
                                    </div>
                                  </div>
                                  {quote.sections && quote.sections.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Prodotti</h4>
                                      <div className="space-y-2">
                                        {quote.sections.map((section: any, index: number) => (
                                          <div key={index} className="border rounded p-2">
                                            <p className="font-medium">{section.productName}</p>
                                            <p className="text-sm text-muted-foreground">
                                              Categoria: {section.productCategory} | Unità: {section.productUnit}
                                            </p>
                                            <p>Quantità: {section.quantity} | Prezzo: € {section.price}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate('/new-quote', { state: { editQuote: quote } })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGeneratePdf(quote)}
                              title="Esporta PDF"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => exportQuote(quote)}
                              title="Esporta JSON"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => duplicateQuote(quote)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteQuote(quote.number)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Quotes