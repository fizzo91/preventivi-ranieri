import { Button } from "@/components/ui/button"
import { Edit, Trash2, Copy } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { QuoteDetailDialog } from "./QuoteDetailDialog"
import type { Quote } from "@/hooks/useQuotes"

interface QuoteListItemProps {
  quote: Quote
  onDuplicate: (quote: Quote) => void
  onDelete: (id: string) => void
  onGeneratePdf: (quote: Quote) => void
  onExportJson: (quote: Quote) => void
  isDuplicating: boolean
  isDeleting: boolean
}

export const QuoteListItem = ({
  quote, onDuplicate, onDelete, onGeneratePdf, onExportJson, isDuplicating, isDeleting
}: QuoteListItemProps) => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-1 flex-1">
        <p className="font-medium">{quote.quote_number}</p>
        <p className="text-sm text-muted-foreground">
          {quote.client_name} {quote.client_company && `• ${quote.client_company}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(quote.date).toLocaleDateString('it-IT')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-success">
            € {quote.total_amount?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="flex gap-2">
          <QuoteDetailDialog quote={quote} onGeneratePdf={onGeneratePdf} onExportJson={onExportJson} />
          <Button variant="outline" size="sm" onClick={() => navigate('/new-quote', { state: { editQuote: quote } })}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDuplicate(quote)} disabled={isDuplicating}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(quote.id)} disabled={isDeleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
