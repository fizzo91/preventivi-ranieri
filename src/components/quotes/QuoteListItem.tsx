import { Button } from "@/components/ui/button"
import { Edit, Trash2, Copy, FileDown, FileText, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { QuoteDetailDialog } from "./QuoteDetailDialog"
import { useAuth } from "@/contexts/AuthContext"
import type { Quote } from "@/hooks/useQuotes"

interface QuoteListItemProps {
  quote: Quote
  onDuplicate: (quote: Quote) => void
  onDelete: (id: string) => void
  onGeneratePdf: (quote: Quote) => void
  onGenerateSyntheticPdf: (quote: Quote) => void
  onExportJson: (quote: Quote) => void
  isDuplicating: boolean
  isDeleting: boolean
}

export const QuoteListItem = ({
  quote, onDuplicate, onDelete, onGeneratePdf, onGenerateSyntheticPdf, onExportJson, isDuplicating, isDeleting
}: QuoteListItemProps) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isOwner = user?.id === quote.user_id

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-1 flex-1">
        <p className="font-medium">{quote.quote_number}</p>
        <p className="text-sm text-muted-foreground">
          {quote.client_name} {quote.client_company && `• ${quote.client_company}`}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(quote.date).toLocaleDateString('it-IT')}</span>
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
            <User className="h-3 w-3" />
            {quote.owner_name || 'Utente'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-success">
            € {quote.total_amount?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="flex gap-2">
          <QuoteDetailDialog quote={quote} onGeneratePdf={onGeneratePdf} onGenerateSyntheticPdf={onGenerateSyntheticPdf} onExportJson={onExportJson} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onGeneratePdf(quote)}>
                <FileDown className="h-4 w-4 mr-2" />PDF Completo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateSyntheticPdf(quote)}>
                <FileText className="h-4 w-4 mr-2" />PDF Sintetico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isOwner && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/new-quote', { state: { editQuote: quote } })}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDuplicate(quote)} disabled={isDuplicating}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(quote.id)} disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
