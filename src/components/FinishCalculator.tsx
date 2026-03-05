import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FinishRow {
  id: string
  description: string
  finish: string
  thickness: string   // cm
  side1: string       // cm
  side2: string       // cm
  pieces: string
  fixedQuote: string  // €
  varQuote: string    // €
  pctAdj: string      // %
  packagingRate: string // €/mq
  profileRate: string  // €/ml
}

const emptyRow = (): FinishRow => ({
  id: crypto.randomUUID(),
  description: "",
  finish: "",
  thickness: "3",
  side1: "",
  side2: "",
  pieces: "1",
  fixedQuote: "",
  varQuote: "",
  pctAdj: "0",
  packagingRate: "13",
  profileRate: "0",
})

const parseNum = (v: string) => {
  const n = parseFloat(v.replace(",", "."))
  return isNaN(n) ? 0 : n
}

const fmt = (n: number) =>
  n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function calcRow(row: FinishRow) {
  const sp = parseNum(row.thickness)
  const l1 = parseNum(row.side1)
  const l2 = parseNum(row.side2)
  const pz = Math.max(1, Math.round(parseNum(row.pieces)))
  const qf = parseNum(row.fixedQuote)
  const qv = parseNum(row.varQuote)
  const pct = parseNum(row.pctAdj)
  const packRate = parseNum(row.packagingRate)
  const profRate = parseNum(row.profileRate)

  const mqMod = (l1 * l2) / 10000
  const mqTot = mqMod * pz
  const listinoMq = qf + qv + (qv * pct / 100)
  const totCeram = listinoMq * mqTot
  const kg = l1 * l2 * sp * 0.003 * pz
  const totImba = packRate * mqTot
  const totProf = profRate > 0 ? profRate * 3 : 0 // profile cost (per ml * 3 default)
  const importoModulo = totCeram + totImba + totProf
  const importoRiga = importoModulo

  return { mqMod, mqTot, listinoMq, totCeram, kg, totImba, totProf, importoRiga }
}

export function FinishCalculator() {
  const [rows, setRows] = useState<FinishRow[]>([emptyRow()])
  const { toast } = useToast()

  const updateRow = (id: string, field: keyof FinishRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, emptyRow()])

  const removeRow = (id: string) => {
    if (rows.length <= 1) return
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const duplicateRow = (id: string) => {
    const src = rows.find(r => r.id === id)
    if (!src) return
    setRows(prev => [...prev, { ...src, id: crypto.randomUUID() }])
  }

  const results = useMemo(() => rows.map(r => ({ id: r.id, ...calcRow(r) })), [rows])

  const grandTotal = useMemo(() => results.reduce((s, r) => s + r.importoRiga, 0), [results])
  const totalMq = useMemo(() => results.reduce((s, r) => s + r.mqTot, 0), [results])
  const totalKg = useMemo(() => results.reduce((s, r) => s + r.kg, 0), [results])

  const copyResults = () => {
    const lines = rows.map((row, i) => {
      const r = results[i]
      return `${row.description || "Riga " + (i + 1)} | ${row.finish} | ${row.side1}×${row.side2}×${row.thickness}cm | ${r.mqTot.toFixed(2)} mq | €${fmt(r.importoRiga)}`
    })
    lines.push(`\nTOTALE: €${fmt(grandTotal)} | ${totalMq.toFixed(2)} mq | ${totalKg.toFixed(0)} kg`)
    navigator.clipboard.writeText(lines.join("\n"))
    toast({ title: "Copiato negli appunti" })
  }

  return (
    <div className="space-y-4">
      {rows.map((row, idx) => {
        const r = results[idx]
        return (
          <Card key={row.id} className="relative">
            <CardContent className="p-4 space-y-3">
              {/* Row header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">RIGA {idx + 1}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicateRow(row.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {rows.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeRow(row.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Description + Finish */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Descrizione</label>
                  <Input value={row.description} onChange={e => updateRow(row.id, "description", e.target.value)} placeholder="es. Top cucina" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Finitura / Colore</label>
                  <Input value={row.finish} onChange={e => updateRow(row.id, "finish", e.target.value)} placeholder="es. Deep Orange" className="h-8 text-sm" />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Lato 1 (cm)</label>
                  <Input value={row.side1} onChange={e => updateRow(row.id, "side1", e.target.value)} placeholder="95" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Lato 2 (cm)</label>
                  <Input value={row.side2} onChange={e => updateRow(row.id, "side2", e.target.value)} placeholder="95" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Spess. (cm)</label>
                  <Input value={row.thickness} onChange={e => updateRow(row.id, "thickness", e.target.value)} placeholder="3" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Nr. Pezzi</label>
                  <Input value={row.pieces} onChange={e => updateRow(row.id, "pieces", e.target.value)} placeholder="1" className="h-8 text-sm" />
                </div>
              </div>

              {/* Pricing inputs */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Quota Fissa €</label>
                  <Input value={row.fixedQuote} onChange={e => updateRow(row.id, "fixedQuote", e.target.value)} placeholder="50" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Quota Var. €</label>
                  <Input value={row.varQuote} onChange={e => updateRow(row.id, "varQuote", e.target.value)} placeholder="25" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">% +/-</label>
                  <Input value={row.pctAdj} onChange={e => updateRow(row.id, "pctAdj", e.target.value)} placeholder="0" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Imba. €/mq</label>
                  <Input value={row.packagingRate} onChange={e => updateRow(row.id, "packagingRate", e.target.value)} placeholder="13" className="h-8 text-sm" />
                </div>
              </div>

              {/* Calculated results */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Mq</div>
                  <div className="text-sm font-semibold">{r.mqTot.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">€/mq</div>
                  <div className="text-sm font-semibold">€{fmt(r.listinoMq)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Kg</div>
                  <div className="text-sm font-semibold">{r.kg.toFixed(0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Totale</div>
                  <div className="text-sm font-bold text-primary">€{fmt(r.importoRiga)}</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="flex gap-3 text-[10px] text-muted-foreground justify-center">
                <span>Ceram: €{fmt(r.totCeram)}</span>
                <span>Imba: €{fmt(r.totImba)}</span>
                {r.totProf > 0 && <span>Prof: €{fmt(r.totProf)}</span>}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Add row button */}
      <Button variant="outline" onClick={addRow} className="w-full gap-2">
        <Plus className="h-4 w-4" /> Aggiungi riga
      </Button>

      {/* Grand total */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Mq Totali</div>
              <div className="text-lg font-bold">{totalMq.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Peso Totale</div>
              <div className="text-lg font-bold">{totalKg.toFixed(0)} kg</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Totale</div>
              <div className="text-lg font-bold text-primary">€{fmt(grandTotal)}</div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={copyResults} className="w-full mt-3 gap-2">
            <Copy className="h-3.5 w-3.5" /> Copia riepilogo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
