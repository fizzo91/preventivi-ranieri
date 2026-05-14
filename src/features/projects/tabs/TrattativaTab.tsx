import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, Save, Trash2 } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useTrattativa, useSaveTrattativa, type TrattativaData, type TrattativaRiga } from "@/hooks/useTrattativa"
import { useFornitori } from "@/hooks/useFornitori"
import { useProjectQuotes } from "@/hooks/useProjects"
import type { Project } from "@/hooks/useProjects"

const newRiga = (): TrattativaRiga => ({
  id: crypto.randomUUID(),
  descrizione: "",
  quantita: 1,
  prezzo_unitario: 0,
  fornitore_id: null,
  note: "",
})

const emptyData: TrattativaData = { righe: [], data_trattativa: "", note: "" }

export const TrattativaTab = ({ project }: { project: Project }) => {
  const { data: tratt, isLoading } = useTrattativa(project.id)
  const save = useSaveTrattativa(project.id)
  const { list: fornitoriQuery } = useFornitori()
  const fornitori = fornitoriQuery.data ?? []
  const { data: quotes = [] } = useProjectQuotes(project.id)

  const [data, setData] = useState<TrattativaData>(emptyData)

  useEffect(() => {
    if (tratt?.data) {
      setData({
        data_trattativa: tratt.data.data_trattativa || "",
        note: tratt.data.note || "",
        righe: Array.isArray(tratt.data.righe) ? tratt.data.righe : [],
      })
    }
  }, [tratt])

  const totalePreventivi = quotes.reduce(
    (s: number, q: any) => s + Number(q.total_amount || 0),
    0,
  )
  const totaleTrattativa = data.righe.reduce(
    (s, r) => s + Number(r.quantita || 0) * Number(r.prezzo_unitario || 0),
    0,
  )
  const pctDiff = totalePreventivi > 0
    ? ((totaleTrattativa - totalePreventivi) / totalePreventivi) * 100
    : null

  const updateRiga = (id: string, field: keyof TrattativaRiga, value: any) =>
    setData((d) => ({
      ...d,
      righe: d.righe.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }))

  const addRiga = () => setData((d) => ({ ...d, righe: [...d.righe, newRiga()] }))
  const removeRiga = (id: string) =>
    setData((d) => ({ ...d, righe: d.righe.filter((r) => r.id !== id) }))

  if (isLoading) return <LoadingSpinner />

  const diffBadgeVariant = pctDiff === null
    ? "secondary"
    : pctDiff < 0 ? "default" : "destructive"
  const diffLabel = pctDiff === null
    ? "Nessun preventivo"
    : `${pctDiff > 0 ? "+" : ""}${pctDiff.toFixed(1)}% vs preventivo`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline">Preventivi: € {totalePreventivi.toFixed(2)}</Badge>
          <Badge variant="outline">Trattativa: € {totaleTrattativa.toFixed(2)}</Badge>
          <Badge variant={diffBadgeVariant as any}>{diffLabel}</Badge>
        </div>
        <Button
          onClick={() => save.mutate({ id: tratt?.id, data })}
          disabled={save.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" /> Salva
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Riferimenti</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data-tratt">Data trattativa</Label>
            <Input
              id="data-tratt"
              type="date"
              value={data.data_trattativa || ""}
              onChange={(e) => setData({ ...data, data_trattativa: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="note-tratt">Note</Label>
            <Textarea
              id="note-tratt"
              rows={3}
              value={data.note || ""}
              onChange={(e) => setData({ ...data, note: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Righe negoziate</CardTitle>
          <Button onClick={addRiga} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Aggiungi riga
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.righe.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Nessuna riga. Aggiungi le voci negoziate con i fornitori.
            </p>
          )}
          {data.righe.map((r) => {
            const tot = Number(r.quantita || 0) * Number(r.prezzo_unitario || 0)
            return (
              <div key={r.id} className="grid grid-cols-12 gap-2 items-end border rounded-lg p-3">
                <div className="col-span-12 md:col-span-4 space-y-1">
                  <Label className="text-xs">Descrizione</Label>
                  <Input
                    value={r.descrizione}
                    onChange={(e) => updateRiga(r.id, "descrizione", e.target.value)}
                  />
                </div>
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs">Fornitore</Label>
                  <Select
                    value={r.fornitore_id || "__none"}
                    onValueChange={(v) => updateRiga(r.id, "fornitore_id", v === "__none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— nessuno —</SelectItem>
                      {fornitori.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.ragione_sociale}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 md:col-span-1 space-y-1">
                  <Label className="text-xs">Q.tà</Label>
                  <Input
                    type="number"
                    value={r.quantita}
                    onChange={(e) => updateRiga(r.id, "quantita", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs">Prezzo unit.</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={r.prezzo_unitario}
                    onChange={(e) => updateRiga(r.id, "prezzo_unitario", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3 md:col-span-1 space-y-1">
                  <Label className="text-xs">Totale</Label>
                  <div className="text-sm font-semibold py-2">€ {tot.toFixed(2)}</div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => removeRiga(r.id)} aria-label="Rimuovi">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="col-span-12 space-y-1">
                  <Label className="text-xs">Note</Label>
                  <Input
                    value={r.note || ""}
                    onChange={(e) => updateRiga(r.id, "note", e.target.value)}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
