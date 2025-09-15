import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Eye, Edit, Trash2, Plus, Search } from "lucide-react"
import { Link } from "react-router-dom"

interface Quote {
  number: string
  client: {
    name: string
    company: string
  }
  totalAmount: number
  status: string
  createdAt: string
}

const Quotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [searchTerm, setSearchTerm] = useState("")

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const deleteQuote = (quoteNumber: string) => {
    const updatedQuotes = quotes.filter(q => q.number !== quoteNumber)
    setQuotes(updatedQuotes)
    localStorage.setItem('quotes', JSON.stringify(updatedQuotes))
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
        <Link to="/new-quote">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Preventivo
          </Button>
        </Link>
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
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.filter(q => q.status === 'In attesa').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approvati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {quotes.filter(q => q.status === 'Approvato').length}
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
            <div className="space-y-4">
              {filteredQuotes.map((quote) => (
                <div key={quote.number} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{quote.number}</p>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
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
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Quotes