import { useState, useCallback, useMemo } from "react"
import { Plus, Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

/* ───────── types ───────── */
interface PieceRow {
  id: number
  descrizione: string
  finitura_colore: string
  lato1: number
  lato2: number
  spessore: number
  listino: number
  finitura_code: number
  nr_pezzi: number
  percentuale: number
  prof_euro_ml: number | null // null = use default
  altre_um: string
  altre_qta: number
  altre_costo: number
}

const defaultRow = (id: number): PieceRow => ({
  id,
  descrizione: "",
  finitura_colore: "",
  lato1: 0,
  lato2: 0,
  spessore: 2,
  listino: 0,
  finitura_code: 0,
  nr_pezzi: 1,
  percentuale: 0,
  prof_euro_ml: null,
  altre_um: "",
  altre_qta: 0,
  altre_costo: 0,
})

/* ───────── calc helpers ───────── */
function getDefaultProfiloEuroMl(spessore: number): number {
  if (spessore === 2) return 1.3
  if (spessore === 3) return 2.3
  if (spessore === 4) return 4.0
  return 4.2
}

function calcRow(r: PieceRow) {
  const mq_modulo = (r.lato1 * r.lato2) / 10000
  const quota_fissa =
    80 - r.listino * 25 + r.spessore * 20 + (r.finitura_code * 30 - r.listino * r.finitura_code * 10)
  const quota_var =
    mq_modulo * 45 + r.finitura_code * 5 + mq_modulo * r.finitura_code * r.listino * 15
  const listino_mq = (quota_fissa + quota_var) * (1 + r.percentuale / 100)
  const mq_tot = r.nr_pezzi * mq_modulo
  const totale_ceramica = mq_tot * listino_mq
  const kg = 30 * r.spessore * mq_tot
  const imballaggio_mq = 5 + r.spessore * 2 + mq_modulo * 3
  const tot_imballaggio = imballaggio_mq * mq_tot
  const prof_ml = r.prof_euro_ml ?? getDefaultProfiloEuroMl(r.spessore)
  const tot_profilo = ((r.lato1 + r.lato2) * 2) / 100 * prof_ml * r.nr_pezzi
  const costo_altre = r.altre_qta * r.altre_costo
  const totale_riga = totale_ceramica + tot_imballaggio + tot_profilo + costo_altre

  return {
    mq_modulo,
    quota_fissa,
    quota_var,
    listino_mq,
    mq_tot,
    totale_ceramica,
    kg,
    imballaggio_mq,
    tot_imballaggio,
    prof_ml,
    tot_profilo,
    costo_altre,
    totale_riga,
  }
}

/* ───────── formatters ───────── */
const fmtEur = (v: number) =>
  v.toLocaleString("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 })
const fmtMq = (v: number) =>
  v.toLocaleString("it-IT", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
const fmtNum = (v: number, d = 2) =>
  v.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d })

/* ───────── component ───────── */
export function EnamelCostCalculator() {
  const { toast } = useToast()
  const [rows, setRows] = useState<PieceRow[]>([defaultRow(1)])
  const [expandedRow, setExpandedRow] = useState<number | null>(0)
  const [nextId, setNextId] = useState(2)

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, defaultRow(nextId)])
    setExpandedRow(rows.length)
    setNextId((n) => n + 1)
  }, [nextId, rows.length])

  const removeRow = useCallback(
    (idx: number) => {
      if (rows.length <= 1) return
      setRows((prev) => prev.filter((_, i) => i !== idx))
    },
    [rows.length]
  )

  const updateRow = useCallback(
    (idx: number, field: keyof PieceRow, value: string | number | null) => {
      setRows((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
      )
    },
    []
  )

  const calculations = useMemo(() => rows.map(calcRow), [rows])

  const summary = useMemo(() => {
    const mqTotali = calculations.reduce((s, c) => s + c.mq_tot, 0)
    const totaleGenerale = calculations.reduce((s, c) => s + c.totale_riga, 0)
    const totalePezzi = rows.reduce((s, r) => s + r.nr_pezzi, 0)
    const totaleCadauno = totalePezzi > 0 ? totaleGenerale / totalePezzi : 0
    return { mqTotali, totaleGenerale, totaleCadauno, totalePezzi }
  }, [calculations, rows])

  const copyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(value)
    toast({ title: `${label} copiato`, duration: 1500 })
  }

  /* ── number input helper ── */
  const numInput = (
    idx: number,
    field: keyof PieceRow,
    label: string,
    opts?: { step?: string; placeholder?: string; min?: string }
  ) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        className="h-8 text-sm"
        value={(rows[idx][field] as number) || ""}
        step={opts?.step || "1"}
        min={opts?.min}
        placeholder={opts?.placeholder}
        onChange={(e) =>
          updateRow(idx, field, e.target.value === "" ? 0 : parseFloat(e.target.value))
        }
      />
    </div>
  )

  /* ── calculated field chip ── */
  const calcChip = (label: string, value: string, copyVal?: string) => (
    <div className="flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1.5 text-xs">
      <span className="text-muted-foreground whitespace-nowrap">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
      {copyVal && (
        <button
          onClick={() => copyValue(label, copyVal)}
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Copia"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card flex-shrink-0">
        <h2 className="text-lg font-bold text-foreground">Calcolatore Costi Smalto</h2>
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "pezzo" : "pezzi"} · {fmtEur(summary.totaleGenerale)}
        </p>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {rows.map((row, idx) => {
          const c = calculations[idx]
          const isExpanded = expandedRow === idx

          return (
            <div
              key={row.id}
              className="border rounded-xl bg-card shadow-sm overflow-hidden"
            >
              {/* Row header (always visible) */}
              <button
                onClick={() => setExpandedRow(isExpanded ? null : idx)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {row.descrizione || "Nuovo pezzo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.lato1}×{row.lato2} cm · {fmtMq(c.mq_modulo)} mq · {fmtEur(c.totale_riga)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {rows.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRow(idx)
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Row body (collapsible) */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t">
                  {/* Descrizione & Finitura colore */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Descrizione pezzo</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="es. top libera installazione"
                        value={row.descrizione}
                        onChange={(e) => updateRow(idx, "descrizione", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Finitura e colore</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="es. deep orange"
                        value={row.finitura_colore}
                        onChange={(e) => updateRow(idx, "finitura_colore", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Dimensions & selects */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {numInput(idx, "lato1", "Lato 1 (cm)")}
                    {numInput(idx, "lato2", "Lato 2 (cm)")}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Spessore (cm)</Label>
                      <Select
                        value={String(row.spessore)}
                        onValueChange={(v) => updateRow(idx, "spessore", parseInt(v))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 cm</SelectItem>
                          <SelectItem value="3">3 cm</SelectItem>
                          <SelectItem value="4">4 cm</SelectItem>
                          <SelectItem value="5">5+ cm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Listino</Label>
                      <Select
                        value={String(row.listino)}
                        onValueChange={(v) => updateRow(idx, "listino", parseInt(v))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 (standard)</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Finitura code, pezzi, %, profilo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Finitura</Label>
                      <Select
                        value={String(row.finitura_code)}
                        onValueChange={(v) => updateRow(idx, "finitura_code", parseInt(v))}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-3">-3 (prima smalt.)</SelectItem>
                          <SelectItem value="0">0 (standard)</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {numInput(idx, "nr_pezzi", "Nr. Pezzi", { min: "1" })}
                    {numInput(idx, "percentuale", "% +/-", { step: "0.5", placeholder: "0" })}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Prof. €/ml{" "}
                        <span className="text-[10px] text-muted-foreground/70">
                          (def. {fmtNum(getDefaultProfiloEuroMl(row.spessore))})
                        </span>
                      </Label>
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        step="0.1"
                        placeholder={fmtNum(getDefaultProfiloEuroMl(row.spessore))}
                        value={row.prof_euro_ml ?? ""}
                        onChange={(e) =>
                          updateRow(
                            idx,
                            "prof_euro_ml",
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Altre produzioni */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">UM (altre prod.)</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="ml, pz..."
                        value={row.altre_um}
                        onChange={(e) => updateRow(idx, "altre_um", e.target.value)}
                      />
                    </div>
                    {numInput(idx, "altre_qta", "Q.tà", { step: "0.01" })}
                    {numInput(idx, "altre_costo", "Costo × un.", { step: "0.01" })}
                  </div>

                  {/* Calculated values */}
                  <div className="rounded-lg bg-muted/30 border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Valori calcolati
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {calcChip("Mq modulo", fmtMq(c.mq_modulo), c.mq_modulo.toFixed(4).replace(".", ","))}
                      {calcChip("Listino €/mq", fmtEur(c.listino_mq), c.listino_mq.toFixed(2))}
                      {calcChip("Mq totali", fmtMq(c.mq_tot), c.mq_tot.toFixed(4).replace(".", ","))}
                      {calcChip("Ceramica", fmtEur(c.totale_ceramica), c.totale_ceramica.toFixed(2))}
                      {calcChip("Kg", fmtNum(c.kg, 1), c.kg.toFixed(1))}
                      {calcChip("Imb. €/mq", fmtEur(c.imballaggio_mq), c.imballaggio_mq.toFixed(2))}
                      {calcChip("Tot. imb.", fmtEur(c.tot_imballaggio), c.tot_imballaggio.toFixed(2))}
                      {calcChip("Tot. profilo", fmtEur(c.tot_profilo), c.tot_profilo.toFixed(2))}
                      {c.costo_altre > 0 &&
                        calcChip("Altre prod.", fmtEur(c.costo_altre), c.costo_altre.toFixed(2))}
                    </div>
                    <div className="pt-2 border-t flex items-center gap-2">
                      {calcChip(
                        "TOTALE RIGA",
                        fmtEur(c.totale_riga),
                        c.totale_riga.toFixed(2)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={addRow}
        >
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Pezzo
        </Button>
      </div>

      {/* Summary footer */}
      <div className="border-t bg-card px-4 py-3 flex-shrink-0 space-y-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Mq Totali</p>
            <p className="text-sm font-bold text-foreground">{fmtMq(summary.mqTotali)}</p>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Totale</p>
            <p className="text-sm font-bold text-primary">{fmtEur(summary.totaleGenerale)}</p>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-medium">
              × Cadauno ({summary.totalePezzi} pz)
            </p>
            <p className="text-sm font-bold text-foreground">{fmtEur(summary.totaleCadauno)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
