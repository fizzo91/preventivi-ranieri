import { useState, useCallback, useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/* ───────── types ───────── */
export interface EnamelPieceRow {
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
  prof_euro_ml: number | null
  altre_um: string
  altre_qta: number
  altre_costo: number
}

const defaultRow = (id: number): EnamelPieceRow => ({
  id,
  descrizione: "",
  finitura_colore: "",
  lato1: 0,
  lato2: 0,
  spessore: 3,
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
function getDefaultProfilo(spessore: number): number {
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
  const prof_ml = r.prof_euro_ml ?? getDefaultProfilo(r.spessore)
  const tot_profilo = ((r.lato1 + r.lato2) * 2) / 100 * prof_ml * r.nr_pezzi
  const costo_corpo = r.altre_qta * r.altre_costo
  const importo_modulo = totale_ceramica / (r.nr_pezzi || 1) + tot_imballaggio / (r.nr_pezzi || 1) + tot_profilo / (r.nr_pezzi || 1) + costo_corpo / (r.nr_pezzi || 1)
  const totale_riga = totale_ceramica + tot_imballaggio + tot_profilo + costo_corpo

  return {
    mq_modulo, quota_fissa, quota_var, listino_mq, mq_tot,
    totale_ceramica, kg, imballaggio_mq, tot_imballaggio,
    prof_ml, tot_profilo, costo_corpo, importo_modulo, totale_riga,
  }
}

/* ───────── formatters ───────── */
const fmtEur = (v: number) => "€ " + v.toFixed(2).replace(".", ",")
const fmtMq = (v: number) => v.toFixed(2).replace(".", ",")
const fmtKg = (v: number) => Math.round(v).toString()

/* ───────── component ───────── */
export function EnamelCostCalculator() {
  const [rows, setRows] = useState<PieceRow[]>([defaultRow(1)])
  const [nextId, setNextId] = useState(2)
  const [sviluppato, setSviluppato] = useState("")

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, defaultRow(nextId)])
    setNextId((n) => n + 1)
  }, [nextId])

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

  /* ── cell styles ── */
  const thCls = "px-1 py-1 text-[9px] font-bold text-center uppercase leading-tight border border-border bg-muted whitespace-nowrap"
  const tdInput = "px-0 py-0 border border-border"
  const tdCalc = "px-1 py-1 text-[10px] text-center border border-border bg-blue-50/60 dark:bg-blue-950/20 font-mono whitespace-nowrap"
  const tdCalcBold = "px-1 py-1 text-[10px] text-center border border-border bg-amber-50/60 dark:bg-amber-950/20 font-mono font-bold whitespace-nowrap"
  const cellInput = "h-6 text-[10px] rounded-none border-0 bg-transparent text-center px-1 font-mono focus-visible:ring-1 focus-visible:ring-primary"
  const selectCls = "h-6 text-[10px] rounded-none border-0 bg-transparent text-center px-0 font-mono appearance-none cursor-pointer focus:ring-1 focus:ring-primary w-full"

  return (
    <div className="flex flex-col h-full max-h-[95vh] bg-background text-foreground">
      {/* Top header */}
      <div className="flex items-center gap-4 px-3 py-2 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-muted-foreground uppercase text-[10px]">Sviluppato da</span>
          <Input
            className="h-6 w-28 text-[10px] rounded-sm font-mono"
            value={sviluppato}
            onChange={(e) => setSviluppato(e.target.value)}
            placeholder="nome"
          />
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={addRow}>
          <Plus className="h-3 w-3" /> Aggiungi riga
        </Button>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse min-w-[1400px] w-full text-foreground">
          <thead>
            {/* Column group headers */}
            <tr>
              <th colSpan={4} className={`${thCls} bg-primary/10`}>Identificazione</th>
              <th colSpan={4} className={`${thCls} bg-emerald-100/60 dark:bg-emerald-950/30`}>Parametri</th>
              <th colSpan={2} className={`${thCls} bg-sky-100/60 dark:bg-sky-950/30`}>Dimensioni (cm)</th>
              <th colSpan={3} className={`${thCls} bg-blue-100/60 dark:bg-blue-950/30`}>Superfici</th>
              <th colSpan={1} className={`${thCls} bg-violet-100/60 dark:bg-violet-950/30`}>Costi base</th>
              <th colSpan={2} className={`${thCls} bg-blue-100/60 dark:bg-blue-950/30`}>Ceramica</th>
              <th className={`${thCls} bg-muted`}>Peso</th>
              <th colSpan={2} className={`${thCls} bg-orange-100/60 dark:bg-orange-950/30`}>Imballaggio</th>
              <th colSpan={4} className={`${thCls} bg-pink-100/60 dark:bg-pink-950/30`}>Altre produzioni</th>
              <th colSpan={2} className={`${thCls} bg-teal-100/60 dark:bg-teal-950/30`}>Profilo</th>
              <th colSpan={2} className={`${thCls} bg-amber-100/60 dark:bg-amber-950/30`}>Totali</th>
              <th className={thCls}></th>
            </tr>
            {/* Column headers */}
            <tr>
              <th className={thCls} style={{ width: 40 }}>REP.</th>
              <th className={thCls} style={{ width: 30 }}>ID</th>
              <th className={thCls} style={{ width: 30 }}>RV</th>
              <th className={thCls} style={{ minWidth: 130 }}>DESCRIZ. PRODUZ.</th>
              <th className={thCls} style={{ width: 40 }}>LISTI&shy;NO</th>
              <th className={thCls} style={{ width: 40 }}>COD. PZ</th>
              <th className={thCls} style={{ width: 35 }}>FINIT.</th>
              <th className={thCls} style={{ minWidth: 110 }}>DETT. PRODUZ.</th>
              <th className={thCls} style={{ width: 40 }}>SP. Cm</th>
              <th className={thCls} style={{ width: 55 }}>LATO 1</th>
              <th className={thCls} style={{ width: 55 }}>LATO 2</th>
              <th className={thCls} style={{ width: 50 }}>Mq MOD.</th>
              <th className={thCls} style={{ width: 35 }}>NR. Pz.</th>
              <th className={thCls} style={{ width: 35 }}>% +/-</th>
              <th className={thCls} style={{ width: 65 }}>LISTINO A Mq</th>
              <th className={thCls} style={{ width: 50 }}>Mq TOT.</th>
              <th className={thCls} style={{ width: 75 }}>TOT. CERAM.</th>
              <th className={thCls} style={{ width: 35 }}>Kg</th>
              <th className={thCls} style={{ width: 55 }}>IMBA. Mq</th>
              <th className={thCls} style={{ width: 65 }}>TOT. IMBA.</th>
              <th className={thCls} style={{ width: 65 }}>ALTRE PROD.</th>
              <th className={thCls} style={{ width: 30 }}>UM</th>
              <th className={thCls} style={{ width: 35 }}>Q.TÀ</th>
              <th className={thCls} style={{ width: 55 }}>COSTO × UN.</th>
              <th className={thCls} style={{ width: 65 }}>COSTO A CORPO</th>
              <th className={thCls} style={{ width: 50 }}>PROF. €/ml</th>
              <th className={thCls} style={{ width: 60 }}>TOT. PROF.</th>
              <th className={thCls} style={{ width: 75 }}>IMP. × MOD.</th>
              <th className={thCls} style={{ width: 75 }}>TOT. RIGA</th>
              <th className={thCls} style={{ width: 28 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const c = calculations[idx]
              const rowId = String(idx + 1).padStart(2, "0")
              return (
                <tr key={row.id} className="hover:bg-muted/20">
                  {/* REP */}
                  <td className={tdCalc}>CER.</td>
                  {/* ID */}
                  <td className={tdCalc}>{String(idx + 1).padStart(2, "0")}</td>
                  {/* RV */}
                  <td className={tdCalc}>1</td>
                  {/* DESCRIZ */}
                  <td className={tdInput}>
                    <Input
                      className={`${cellInput} text-left`}
                      value={row.descrizione}
                      placeholder="descrizione..."
                      onChange={(e) => updateRow(idx, "descrizione", e.target.value)}
                    />
                  </td>
                  {/* LISTINO */}
                  <td className={tdInput}>
                    <select
                      className={selectCls}
                      value={row.listino}
                      onChange={(e) => updateRow(idx, "listino", parseInt(e.target.value))}
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </td>
                  {/* COD. PZ */}
                  <td className={tdInput}>
                    <Input className={cellInput} />
                  </td>
                  {/* FINIT. */}
                  <td className={tdInput}>
                    <select
                      className={selectCls}
                      value={row.finitura_code}
                      onChange={(e) => updateRow(idx, "finitura_code", parseInt(e.target.value))}
                    >
                      <option value={-3}>-3</option>
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </td>
                  {/* DETT. PRODUZ (finitura/colore) */}
                  <td className={tdInput}>
                    <Input
                      className={`${cellInput} text-left`}
                      value={row.finitura_colore}
                      placeholder="finitura..."
                      onChange={(e) => updateRow(idx, "finitura_colore", e.target.value)}
                    />
                  </td>
                  {/* SPESSORE */}
                  <td className={tdInput}>
                    <select
                      className={selectCls}
                      value={row.spessore}
                      onChange={(e) => updateRow(idx, "spessore", parseFloat(e.target.value))}
                    >
                      <option value={2}>2.0</option>
                      <option value={3}>3.0</option>
                      <option value={4}>4.0</option>
                      <option value={5}>5.0</option>
                    </select>
                  </td>
                  {/* LATO 1 */}
                  <td className={tdInput}>
                    <Input
                      type="number"
                      className={cellInput}
                      value={row.lato1 || ""}
                      step="0.1"
                      onChange={(e) => updateRow(idx, "lato1", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    />
                  </td>
                  {/* LATO 2 */}
                  <td className={tdInput}>
                    <Input
                      type="number"
                      className={cellInput}
                      value={row.lato2 || ""}
                      step="0.1"
                      onChange={(e) => updateRow(idx, "lato2", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    />
                  </td>
                  {/* Mq MOD */}
                  <td className={tdCalc}>{fmtMq(c.mq_modulo)}</td>
                  {/* NR PZ */}
                  <td className={tdInput}>
                    <Input
                      type="number"
                      className={cellInput}
                      value={row.nr_pezzi || ""}
                      min="1"
                      onChange={(e) => updateRow(idx, "nr_pezzi", e.target.value === "" ? 1 : parseInt(e.target.value))}
                    />
                  </td>
                  {/* % +/- */}
                  <td className={tdInput}>
                    <Input
                      type="number"
                      className={cellInput}
                      value={row.percentuale || ""}
                      step="0.5"
                      onChange={(e) => updateRow(idx, "percentuale", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    />
                  </td>
                  {/* LISTINO A Mq */}
                  <td className={tdCalcBold}>{fmtEur(c.listino_mq)}</td>
                  {/* Mq TOT */}
                  <td className={tdCalc}>{fmtMq(c.mq_tot)}</td>
                  {/* TOT CERAM */}
                  <td className={tdCalcBold}>{fmtEur(c.totale_ceramica)}</td>
                  {/* Kg */}
                  <td className={tdCalc}>{fmtKg(c.kg)}</td>
                  {/* IMBA Mq */}
                  <td className={tdCalc}>{fmtEur(c.imballaggio_mq)}</td>
                  {/* TOT IMBA */}
                  <td className={tdCalc}>{fmtEur(c.tot_imballaggio)}</td>
                  {/* ALTRE PROD (label) */}
                  <td className={tdInput}>
                    <Input
                      className={`${cellInput} text-left`}
                      placeholder=""
                    />
                  </td>
                  {/* UM */}
                  <td className={tdInput}>
                    <Input
                      className={cellInput}
                      value={row.altre_um}
                      onChange={(e) => updateRow(idx, "altre_um", e.target.value)}
                    />
                  </td>
                  {/* Q.TÀ */}
                  <td className={tdInput}>
                    <Input
                      type="number"
                      className={cellInput}
                      value={row.altre_qta || ""}
                      step="0.01"
                      onChange={(e) => updateRow(idx, "altre_qta", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    />
                  </td>
                  {/* COSTO × UN */}
                  <td className={tdInput}>
                    <Input
                      type="number"
                      className={cellInput}
                      value={row.altre_costo || ""}
                      step="0.01"
                      onChange={(e) => updateRow(idx, "altre_costo", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    />
                  </td>
                  {/* COSTO A CORPO */}
                  <td className={tdCalc}>{c.costo_corpo ? fmtEur(c.costo_corpo) : ""}</td>
                  {/* PROF €/ml */}
                  <td className={tdInput}>
                    <Input
                      type="number"
                      className={cellInput}
                      value={row.prof_euro_ml ?? ""}
                      step="0.1"
                      placeholder={getDefaultProfilo(row.spessore).toFixed(1)}
                      onChange={(e) =>
                        updateRow(idx, "prof_euro_ml", e.target.value === "" ? null : parseFloat(e.target.value))
                      }
                    />
                  </td>
                  {/* TOT PROF */}
                  <td className={tdCalc}>{fmtEur(c.tot_profilo)}</td>
                  {/* IMP × MODULO */}
                  <td className={tdCalcBold}>{fmtEur(c.importo_modulo)}</td>
                  {/* TOT RIGA */}
                  <td className={tdCalcBold}>{fmtEur(c.totale_riga)}</td>
                  {/* Delete */}
                  <td className="px-0 py-0 border border-border text-center">
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}

            {/* Summary row */}
            <tr className="bg-muted/40">
              <td colSpan={15} className="px-1 py-1 border border-border text-right text-[10px] font-bold uppercase text-muted-foreground">
                Mq Tot: {fmtMq(summary.mqTotali)}
              </td>
              <td className={tdCalc}>{fmtMq(summary.mqTotali)}</td>
              <td colSpan={11} className="px-1 py-1 border border-border" />
              <td className="px-1 py-1 border border-border text-[10px] text-right font-bold text-muted-foreground">totale</td>
              <td className={tdCalcBold}>{fmtEur(summary.totaleGenerale)}</td>
              <td className="border border-border" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
