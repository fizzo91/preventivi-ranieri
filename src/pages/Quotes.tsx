import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Link } from "react-router-dom"
import { Plus, Search, FileDown, FileJson } from "lucide-react"
import { usePdfGenerator } from "@/hooks/usePdfGenerator"
import { useToast } from "@/hooks/use-toast"
import { useQuotes, useUpdateQuoteStatus, useDeleteQuote, useCreateQuote } from "@/hooks/useQuotes"
import { useCalculations } from "@/hooks/useCalculations"
import { LoadingSpinner } from "@/components/shared"
import { QuoteStatsBar } from "@/components/quotes/QuoteStatsBar"
import { QuoteListItem } from "@/components/quotes/QuoteListItem"
import { groupQuotesByMonth } from "@/utils/quoteHelpers"
import { exportQuoteJson, exportAllQuotesJson } from "@/utils/exportUtils"

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: quotes = [], isLoading } = useQuotes()
  const deleteQuote = useDeleteQuote()
  const createQuote = useCreateQuote()
  const { generatePdf, generateSyntheticPdf } = usePdfGenerator()
  const { data: allCalculations = [] } = useCalculations()
  const { toast } = useToast()

  const filteredQuotes = quotes.filter(quote =>
    quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.client_company && quote.client_company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const { groups: groupedQuotes, sortedMonths } = groupQuotesByMonth(filteredQuotes)

  const handleDeleteQuote = async (quoteId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo preventivo?")) {
      await deleteQuote.mutateAsync(quoteId)
    }
  }

  const handleDuplicateQuote = async (quote: any) => {
    await createQuote.mutateAsync({
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
      notes: quote.notes,
      enamel_data: quote.enamel_data || null,
    })
    toast({ title: "Preventivo Duplicato", description: "Il preventivo è stato duplicato con successo" })
  }

  const buildQuotePayload = (quote: any) => ({
    quoteNumber: quote.quote_number,
    client: { name: quote.client_name, company: quote.client_company || '', email: quote.client_email || '', phone: quote.client_phone || '', address: quote.client_address || '' },
    sections: quote.sections || [],
    totalAmount: quote.total_amount,
    enamelData: quote.enamel_data || null,
  })

  const handleGeneratePdf = async (quote: any) => {
    try {
      const payload = buildQuotePayload(quote)
      const quoteCalcs = allCalculations.filter(c => c.quote_id === quote.id)
      await generatePdf({
        ...payload,
        calculations: quoteCalcs.map(c => ({
          expression: c.expression,
          result: c.result,
          note: c.note,
          created_at: c.created_at,
        })),
      })
    } catch {
      toast({ title: "Errore", description: "Errore durante la generazione del PDF.", variant: "destructive" })
    }
  }

  const handleGenerateSyntheticPdf = async (quote: any) => {
    try {
      await generateSyntheticPdf(buildQuotePayload(quote))
    } catch {
      toast({ title: "Errore", description: "Errore durante la generazione del PDF sintetico.", variant: "destructive" })
    }
  }

  const handleExportJson = (quote: any) => {
    exportQuoteJson(quote)
    toast({ title: "Export completato", description: "Il preventivo è stato esportato in JSON" })
  }

  const handleExportAllJson = () => {
    exportAllQuotesJson(quotes)
    toast({ title: "Export completato", description: `${quotes.length} preventivi esportati in JSON` })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Preventivi</h1>
          <p className="text-muted-foreground mt-1">Gestisci tutti i tuoi preventivi</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2"><FileDown className="h-4 w-4" />Esporta</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportAllJson} disabled={quotes.length === 0}>
                <FileJson className="h-4 w-4 mr-2" />Esporta tutti (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/new-quote">
            <Button className="gap-2"><Plus className="h-4 w-4" />Nuovo Preventivo</Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca per cliente, azienda o numero preventivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <QuoteStatsBar quotes={quotes} />

      <Card>
        <CardHeader><CardTitle>Elenco Preventivi</CardTitle></CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {quotes.length === 0 ? "Nessun preventivo trovato. Crea il tuo primo preventivo!" : "Nessun preventivo corrisponde ai criteri di ricerca."}
              </p>
              {quotes.length === 0 && (
                <Link to="/new-quote" className="mt-4 inline-block"><Button>Crea Primo Preventivo</Button></Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedMonths.map((month) => (
                <div key={month} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground capitalize sticky top-0 bg-background py-2">{month}</h3>
                  <div className="space-y-4">
                    {groupedQuotes[month].map((quote) => (
                      <QuoteListItem
                        key={quote.id}
                        quote={quote}
                        onDuplicate={handleDuplicateQuote}
                        onDelete={handleDeleteQuote}
                        onGeneratePdf={handleGeneratePdf}
                        onGenerateSyntheticPdf={handleGenerateSyntheticPdf}
                        onExportJson={handleExportJson}
                        isDuplicating={createQuote.isPending}
                        isDeleting={deleteQuote.isPending}
                      />
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
