import { useState, useMemo } from "react"
import { Plus, Trash2, ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { useOrdiniAcquisto, type OdaRiga, type OrdineAcquisto } from "@/hooks/useOrdiniAcquisto"
import { useFornitori } from "@/hooks/useFornitori"
import { formatCurrency, formatDate } from "@/utils/formatting"
import type { Project } from "@/hooks/useProjects"

const STATI = [
  "Costi da confermare presso i fornitori",
  "Confermato",
  "Annullato",
] as const

const emptyRiga = (): OdaRiga => ({ descrizione: "", quantita: 1, prezzo_unitario: 0 })

export const OrdiniAcquistoTab = ({ project }: { project: Project }) => {
  const { list, create, remove } = useOrdiniAcquisto(project.id)
  const { list: fornitoriQ } = useFornitori()
  const [open, setOpen] = useState(false)
  const [fornitoreId, setFornitoreId] = useState<string>("")
  const [fornitoreSearch, setFornitoreSearch] = useState("")
  const [stato, setStato] = useState<string>(STATI[0])
  const [note, setNote] = useState("")
  const [righe, setRighe] = useState<OdaRiga[]>([emptyRiga()])

  const fornitori = fornitoriQ.data ?? []
  const fornitoriFiltered = useMemo(() => {
    const q = fornitoreSearch.toLowerCase().trim()
    if (!q) return fornitori
    return fornitori.filter(
      (f) =>
        f.ragione_sociale.toLowerCase().includes(q) ||
        (f.categoria ?? "").toLowerCase().includes(q)
    )
  }, [fornitori, fornitoreSearch])

  const totale = righe.reduce((s, r) => s + (Number(r.quantita) || 0) * (Number(r.prezzo_unitario) || 0), 0)

  const reset = () => {
    setFornitoreId("")
    setFornitoreSearch("")
    setStato(STATI[0])
    setNote("")
    setRighe([emptyRiga()])
  }

  const updateRiga = (i: number, patch: Partial<OdaRiga>) =>
    setRighe((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  const handleSave = async () => {
    await create.mutateAsync({
      progetto_id: project.id,
      fornitore_id: fornitoreId || null,
      stato,
      note: note || null,
      righe,
    })
    setOpen(false)
    reset()
  }

  const ordini = list.data ?? []

  if (list.isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo ordine di acquisto
        </Button>
      </div>

      {ordini.length === 0 ? (
        <EmptyState icon={ShoppingCart} message="Nessun ordine di acquisto per questo progetto." />
      ) : (
        <div className="space-y-2">
          {ordini.map((o: OrdineAcquisto) => {
            const tot = (o.righe ?? []).reduce(
              (s, r) => s + Number(r.quantita) * Number(r.prezzo_unitario), 0
            )
            return (
              <Card key={o.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{o.numero_oda_formatted}</span>
                      <Badge variant={o.stato === "Confermato" ? "default" : o.stato === "Annullato" ? "destructive" : "secondary"}>
                        {o.stato}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {o.fornitore?.ragione_sociale ?? "—"} · {formatDate(o.created_at)} · {formatCurrency(tot)}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (window.confirm(`Eliminare ${o.numero_oda_formatted}?`)) remove.mutate(o.id)
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo ordine di acquisto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fornitore</Label>
              <Input
                placeholder="Cerca fornitore..."
                value={fornitoreSearch}
                onChange={(e) => setFornitoreSearch(e.target.value)}
              />
              <Select value={fornitoreId} onValueChange={setFornitoreId}>
                <SelectTrigger><SelectValue placeholder="Seleziona fornitore" /></SelectTrigger>
                <SelectContent>
                  {fornitoriFiltered.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Nessun fornitore</div>
                  ) : fornitoriFiltered.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.ragione_sociale}{f.categoria ? ` — ${f.categoria}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={stato} onValueChange={setStato}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATI.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Righe d'ordine</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setRighe((r) => [...r, emptyRiga()])} className="gap-2">
                  <Plus className="h-4 w-4" /> Aggiungi riga
                </Button>
              </div>
              <div className="space-y-2">
                {righe.map((r, i) => {
                  const tot = (Number(r.quantita) || 0) * (Number(r.prezzo_unitario) || 0)
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-5">
                        {i === 0 && <Label className="text-xs">Descrizione</Label>}
                        <Input value={r.descrizione} onChange={(e) => updateRiga(i, { descrizione: e.target.value })} />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        {i === 0 && <Label className="text-xs">Quantità</Label>}
                        <Input type="number" value={r.quantita} onChange={(e) => updateRiga(i, { quantita: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        {i === 0 && <Label className="text-xs">Prezzo unit.</Label>}
                        <Input type="number" value={r.prezzo_unitario} onChange={(e) => updateRiga(i, { prezzo_unitario: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-3 md:col-span-2 text-right text-sm font-medium">
                        {i === 0 && <Label className="text-xs block text-left">Totale</Label>}
                        {formatCurrency(tot)}
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setRighe((rs) => rs.filter((_, idx) => idx !== i))} disabled={righe.length === 1}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end pt-2 border-t">
                <span className="text-base font-semibold">Totale: {formatCurrency(totale)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={create.isPending || !fornitoreId}>
              {create.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
