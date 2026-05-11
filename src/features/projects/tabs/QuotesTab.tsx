import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, FileText, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjectQuotes } from "@/hooks/useProjects"
import { useQuotes, useUpdateQuote } from "@/hooks/useQuotes"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import type { Project } from "@/hooks/useProjects"

export const QuotesTab = ({ project }: { project: Project }) => {
  const navigate = useNavigate()
  const { data: quotes = [], isLoading } = useProjectQuotes(project.id)
  const { data: allQuotes = [] } = useQuotes()
  const updateQuote = useUpdateQuote()
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("")

  const unlinkedQuotes = allQuotes.filter((q: any) => !q.project_id)

  const handleLink = async () => {
    if (!selectedQuoteId) return
    await updateQuote.mutateAsync({
      id: selectedQuoteId,
      project_id: project.id,
    } as any)
    setSelectedQuoteId("")
    setLinkDialogOpen(false)
  }

  const handleUnlink = (quoteId: string) => {
    if (!window.confirm("Scollegare questo preventivo dal progetto?")) return
    updateQuote.mutate({ id: quoteId, project_id: null } as any)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setLinkDialogOpen(true)} className="gap-2">
          <Link2 className="h-4 w-4" /> Collega esistente
        </Button>
        <Button
          onClick={() => navigate(`/new-quote?projectId=${project.id}`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Nuovo preventivo
        </Button>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nessun preventivo collegato"
          description="Crea un nuovo preventivo o collega uno esistente a questo progetto."
        />
      ) : (
        <div className="space-y-2">
          {quotes.map((q: any) => (
            <Card key={q.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <Link to={`/new-quote?edit=${q.id}`} className="font-medium hover:underline">
                    {q.quote_number}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {q.client_name} · {new Date(q.date).toLocaleDateString("it-IT")} · €{" "}
                    {Number(q.total_amount).toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleUnlink(q.id)}>
                    Scollega
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collega preventivo esistente</DialogTitle>
          </DialogHeader>
          {unlinkedQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun preventivo disponibile da collegare.
            </p>
          ) : (
            <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un preventivo" />
              </SelectTrigger>
              <SelectContent>
                {unlinkedQuotes.map((q: any) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.quote_number} — {q.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleLink} disabled={!selectedQuoteId}>
              Collega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
