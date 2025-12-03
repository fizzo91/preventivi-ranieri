import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Edit, Trash2, Plus, Search, FileDown, Copy, Loader2, FileJson } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Link, useNavigate } from "react-router-dom"
import { usePdfGenerator } from "@/hooks/usePdfGenerator"
import { useToast } from "@/hooks/use-toast"
import { useQuotes, useUpdateQuoteStatus, useDeleteQuote, useCreateQuote } from "@/hooks/useQuotes"

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: quotes = [], isLoading } = useQuotes()
  const updateQuoteStatus = useUpdateQuoteStatus()
  const deleteQuote = useDeleteQuote()
  const createQuote = useCreateQuote()
  const { generatePdf } = usePdfGenerator()
  const { toast } = useToast()
  const navigate = useNavigate()

  const filteredQuotes = quotes.filter(quote => 
    quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.client_company && quote.client_company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Raggruppa preventivi per mese
  const groupedQuotes = filteredQuotes.reduce((groups: { [key: string]: any[] }, quote) => {
    const date = new Date(quote.date)
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
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  })

  // Ordina i mesi dal più recente al più vecchio
  const sortedMonths = Object.keys(groupedQuotes).sort((a, b) => {
    const dateA = new Date(groupedQuotes[a][0].date)
    const dateB = new Date(groupedQuotes[b][0].date)
    return dateB.getTime() - dateA.getTime()
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
      case 'bozza':
        return 'bg-muted text-muted-foreground'
      case 'sent':
      case 'inviato':
        return 'bg-success text-success-foreground'
      case 'approved':
      case 'approvato':
        return 'bg-success text-success-foreground'
      case 'pending':
      case 'in attesa':
        return 'bg-warning text-warning-foreground'
      case 'rejected':
      case 'rifiutato':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: string) => {
    await updateQuoteStatus.mutateAsync({ id: quoteId, status: newStatus })
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo preventivo?")) {
      await deleteQuote.mutateAsync(quoteId)
    }
  }

  const handleDuplicateQuote = async (quote: any) => {
    const newQuote = {
      quote_number: `PREV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      validity_days: quote.validity_days,
      client_id: quote.client_id,
      client_name: quote.client_name,
      client_email: quote.client_email,
      client_phone: quote.client_phone,
      client_company: quote.client_company,
      client_address: quote.client_address,
      client_vat_number: quote.client_vat_number,
      client_fiscal_code: quote.client_fiscal_code,
      sections: quote.sections,
      total_amount: quote.total_amount,
      status: 'draft',
      payment_terms: quote.payment_terms,
      notes: quote.notes
    }
    
    await createQuote.mutateAsync(newQuote)
    toast({
      title: "Preventivo Duplicato",
      description: "Il preventivo è stato duplicato con successo"
    })
  }

  const handleGeneratePdf = async (quote: any) => {
    try {
      await generatePdf({
        quoteNumber: quote.quote_number,
        client: {
          name: quote.client_name,
          company: quote.client_company || '',
          email: quote.client_email || '',
          phone: quote.client_phone || '',
          address: quote.client_address || ''
        },
        sections: quote.sections || [],
        totalAmount: quote.total_amount
      })
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la generazione del PDF. Riprova più tardi.",
        variant: "destructive"
      })
    }
  }

  const handleExportJson = (quote: any) => {
    const dataStr = JSON.stringify(quote, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `preventivo-${quote.quote_number}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export completato",
      description: "Il preventivo è stato esportato in JSON"
    })
  }

  const handleExportAllJson = () => {
    const dataStr = JSON.stringify(quotes, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `preventivi-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export completato",
      description: `${quotes.length} preventivi esportati in JSON`
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Preventivi</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestisci tutti i tuoi preventivi
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Esporta</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportAllJson} disabled={quotes.length === 0}>
                <FileJson className="h-4 w-4 mr-2" />
                Esporta tutti (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/new-quote" className="flex-1 sm:flex-none">
            <Button className="gap-2 w-full">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuovo Preventivo</span>
              <span className="sm:hidden">Nuovo</span>
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
              {quotes.filter(q => q.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inviati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {quotes.filter(q => q.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              € {quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0).toFixed(2)}
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
                      <div key={quote.id} className="flex flex-col gap-4 p-4 border rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                              <p className="font-medium">{quote.quote_number}</p>
                              <Select
                                value={quote.status}
                                onValueChange={(value) => handleUpdateQuoteStatus(quote.id, value)}
                              >
                                <SelectTrigger className="w-full md:w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Bozza</SelectItem>
                                  <SelectItem value="sent">Inviato</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {quote.client_name} {quote.client_company && `• ${quote.client_company}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(quote.date).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-3">
                            <p className="font-semibold text-success whitespace-nowrap">
                              € {quote.total_amount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Dettagli
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <div className="flex flex-col gap-3">
                                  <DialogTitle>
                                    Preventivo {quote.quote_number}
                                  </DialogTitle>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleGeneratePdf(quote)}
                                      className="gap-2"
                                    >
                                      <FileDown className="h-4 w-4" />
                                      PDF
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleExportJson(quote)}
                                      className="gap-2"
                                    >
                                      <FileJson className="h-4 w-4" />
                                      JSON
                                    </Button>
                                  </div>
                                </div>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold">Cliente</h4>
                                    <div className="text-sm space-y-1">
                                      <p className="font-medium">{quote.client_name}</p>
                                      {quote.client_company && <p className="text-muted-foreground">{quote.client_company}</p>}
                                      {quote.client_email && <p className="text-muted-foreground">{quote.client_email}</p>}
                                      {quote.client_phone && <p className="text-muted-foreground">{quote.client_phone}</p>}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-semibold">Dettagli</h4>
                                    <div className="text-sm space-y-1">
                                      <p><span className="text-muted-foreground">Numero:</span> {quote.quote_number}</p>
                                      <p><span className="text-muted-foreground">Data:</span> {new Date(quote.date).toLocaleDateString('it-IT')}</p>
                                      <p className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Stato:</span>
                                        <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge>
                                      </p>
                                      <p className="text-lg font-bold text-success pt-1">
                                        Totale: € {quote.total_amount?.toFixed(2) || '0.00'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {quote.sections && Array.isArray(quote.sections) && quote.sections.length > 0 && (
                                  <div className="border-t pt-3">
                                    <h4 className="font-semibold text-sm sm:text-base mb-2">Sezioni</h4>
                                    <div className="space-y-2">
                                      {quote.sections.map((section: any, index: number) => (
                                        <div key={index} className="border rounded p-2 sm:p-3">
                                          <p className="font-medium text-xs sm:text-sm">{section.name}</p>
                                          {section.items && section.items.length > 0 && (
                                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-2 space-y-1">
                                              {section.items.map((item: any, itemIndex: number) => (
                                                <div key={itemIndex} className="break-words">
                                                  {item.productName}: {item.quantity} {item.unit} x €{item.price}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                                <span>•••</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate('/new-quote', { state: { editQuote: quote } })}>
                                <Edit className="h-4 w-4 mr-2" />
                                <span className="text-xs sm:text-sm">Modifica</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGeneratePdf(quote)}>
                                <FileDown className="h-4 w-4 mr-2" />
                                <span className="text-xs sm:text-sm">Scarica PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportJson(quote)}>
                                <FileJson className="h-4 w-4 mr-2" />
                                <span className="text-xs sm:text-sm">Esporta JSON</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateQuote(quote)}>
                                <Copy className="h-4 w-4 mr-2" />
                                <span className="text-xs sm:text-sm">Duplica</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteQuote(quote.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span className="text-xs sm:text-sm">Elimina</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
