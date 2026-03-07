import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, FileDown, FileJson } from "lucide-react"
import { getStatusColor } from "@/utils/quoteHelpers"
import type { Quote } from "@/hooks/useQuotes"

interface QuoteDetailDialogProps {
  quote: Quote
  onGeneratePdf: (quote: Quote) => void
  onExportJson: (quote: Quote) => void
}

export const QuoteDetailDialog = ({ quote, onGeneratePdf, onExportJson }: QuoteDetailDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm">
        <Eye className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle>Dettagli Preventivo {quote.quote_number}</DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onGeneratePdf(quote)} className="gap-2">
              <FileDown className="h-4 w-4" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExportJson(quote)} className="gap-2">
              <FileJson className="h-4 w-4" />JSON
            </Button>
          </div>
        </div>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Cliente</h4>
            <p>{quote.client_name}</p>
            {quote.client_company && <p>{quote.client_company}</p>}
            {quote.client_email && <p>{quote.client_email}</p>}
            {quote.client_phone && <p>{quote.client_phone}</p>}
          </div>
          <div>
            <h4 className="font-semibold">Dettagli</h4>
            <p>Numero: {quote.quote_number}</p>
            <p>Data: {new Date(quote.date).toLocaleDateString('it-IT')}</p>
            <p>Stato: <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge></p>
            <p className="text-lg font-bold text-success">Totale: € {quote.total_amount?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        {quote.sections && Array.isArray(quote.sections) && (quote.sections as any[]).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Sezioni</h4>
            <div className="space-y-2">
              {(quote.sections as any[]).map((section: any, index: number) => (
                <div key={index} className="border rounded p-2">
                  <p className="font-medium">{section.name}</p>
                  {section.items && section.items.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {section.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex}>
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
)
