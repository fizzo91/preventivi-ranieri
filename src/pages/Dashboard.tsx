import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"

const Dashboard = () => {
  const { data: quotes = [], isLoading } = useQuotes()

  // Ordina i preventivi dal più recente al più vecchio e prende i primi 10
  const recentQuotes = useMemo(() => 
    [...quotes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
    [quotes]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <Link to="/new-quote">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Preventivo
          </Button>
        </Link>
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Preventivi Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuotes.length > 0 ? (
              recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{quote.quote_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.client_name} {quote.client_company && `• ${quote.client_company}`}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-success">
                      € {quote.total_amount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">{quote.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nessun preventivo disponibile. Crea il tuo primo preventivo!
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link to="/quotes">
              <Button variant="outline">Vedi Tutti i Preventivi</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
