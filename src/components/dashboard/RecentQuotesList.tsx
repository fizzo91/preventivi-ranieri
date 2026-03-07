import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import type { Quote } from "@/hooks/useQuotes"

interface RecentQuotesListProps {
  quotes: Quote[]
}

export const RecentQuotesList = ({ quotes }: RecentQuotesListProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Preventivi Recenti</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {quotes.length > 0 ? (
          quotes.map((quote) => (
            <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">{quote.quote_number}</p>
                <p className="text-sm text-muted-foreground">
                  {quote.client_name} {quote.client_company && `• ${quote.client_company}`}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-semibold text-success">€ {quote.total_amount?.toFixed(2) || '0.00'}</p>
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
)
