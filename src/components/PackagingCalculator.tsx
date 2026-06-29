import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Upload, FileDown, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Piece {
  id: number
  desc: string
  dett: string
  l1: number
  l2: number
  sp: number
  qty: number
  pid?: string
  pcod?: string
}

interface PackedItem {
  label: string
  lung: number
  larg: number
  sp: number
  peso: number
}

interface Imballo {
  num: number
  pezzi: PackedItem[]
  pesoAcc: number
  maxLung: number
  maxLarg: number
  lp: number
  ap: number
  wp: number
  cod: string
  fumig: boolean
  tetto: boolean
  pesoMax: number
}

const COSTI: Record<string, number> = {
  PE80: 115, PE140: 160, PC80: 175, PC140: 230,
  BN80: 235, BN140: 320, BNX80: 285, BNX140: 415,
}
const LABEL: Record<string, string> = {
  PE80: "Cassa econ. ≤80cm", PE140: "Cassa econ. ≤140cm",
  PC80: "Cassa chiusa ≤80cm", PC140: "Cassa chiusa ≤140cm",
  BN80: "Bundle 130–170 ≤80cm", BN140: "Bundle 130–170 ≤140cm",
  BNX80: "Bundle >170 ≤80cm", BNX140: "Bundle >170 >80cm",
}

const su10 = (v: number) => Math.ceil(v / 10) * 10
const densityFor = (sp: number) => Math.round(sp) * 30
const codice = (lung: number, alt: number) => {
  if (alt > 140) return "BNX140"
  const v = alt <= 80 ? "80" : "140"
  if (lung <= 120) return "PC" + v
  if (lung <= 170) return "BN" + v
  return "BNX" + v
}
const costo = (i: Imballo) =>
  (COSTI[i.cod] || 0) + (i.fumig ? 60 : 0) + (i.tetto ? 35 : 0)

let rowCounter = 0
const nextId = () => ++rowCounter

export function PackagingCalculator() {
  const { toast } = useToast()
  const [tab, setTab] = useState("importa")
  const [pieces, setPieces] = useState<Piece[]>([
    { id: nextId(), desc: "Top", dett: "deep marsala", l1: 125.5, l2: 31.2, sp: 5, qty: 1 },
    { id: nextId(), desc: "Top", dett: "deep marsala", l1: 90.5, l2: 17.2, sp: 5, qty: 1 },
    { id: nextId(), desc: "Top", dett: "deep marsala", l1: 125.5, l2: 113.4, sp: 5, qty: 3 },
  ])
  const [pesoMax, setPesoMax] = useState(950)
  const [profilo, setProfilo] = useState(1)
  const [fumigDefault, setFumigDefault] = useState(false)
  const [imballi, setImballi] = useState<Imballo[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addRow = (p: Partial<Piece> = {}) =>
    setPieces((prev) => [
      ...prev,
      { id: nextId(), desc: "", dett: "", l1: 0, l2: 0, sp: 5, qty: 1, ...p },
    ])

  const updateRow = (id: number, patch: Partial<Piece>) =>
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const delRow = (id: number) => setPieces((prev) => prev.filter((p) => p.id !== id))

  const clearAll = () => setPieces([])

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buf), { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" })

      let headerIdx = -1
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].map((c) => String(c).toUpperCase().replace(/[\s\n.]+/g, ""))
        if (r.some((c) => c.includes("LATO1")) && r.some((c) => c.includes("SP"))) {
          headerIdx = i
          break
        }
      }
      if (headerIdx < 0) {
        toast({ title: "Intestazioni non trovate", description: "Servono colonne LATO 1, LATO 2, SP.", variant: "destructive" })
        return
      }
      const hdr = rows[headerIdx].map((c: any) => String(c).toUpperCase().replace(/[\s\n.]+/g, ""))
      const fi = (...kws: string[]) => {
        for (const k of kws) {
          const i = hdr.findIndex((h: string) => h.includes(k))
          if (i >= 0) return i
        }
        return -1
      }
      const cRep = fi("REP"), cDesc = fi("DESCRIZ"), cDett = fi("DETT"), cFinit = fi("FINIT")
      const cSp = fi("SPCM", "SP"), cL1 = fi("LATO1"), cL2 = fi("LATO2"), cNr = fi("NRPZ", "NR")
      const cId = fi("ID"), cCod = fi("CODPZ", "COD")

      const out: Piece[] = []
      let skip = 0
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i]
        const rep = String(r[cRep] || "").trim().toUpperCase()
        if (!rep.startsWith("CER")) continue
        const finit = parseFloat(String(r[cFinit] || "").trim())
        if (!isNaN(finit) && finit === -3) { skip++; continue }
        const l1 = parseFloat(r[cL1]) || 0
        const l2 = parseFloat(r[cL2]) || 0
        const sp = parseFloat(r[cSp]) || 0
        const nr = parseInt(r[cNr]) || 1
        if (l1 <= 0 || l2 <= 0 || sp <= 0) continue
        out.push({
          id: nextId(),
          desc: String(r[cDesc] || "").trim() || "Pezzo",
          dett: String(r[cDett] || "").trim(),
          pid: cId >= 0 ? String(r[cId] || "").trim() : "",
          pcod: cCod >= 0 ? String(r[cCod] || "").trim() : "",
          l1, l2, sp, qty: nr,
        })
      }
      if (!out.length) {
        toast({ title: "Nessun pezzo valido trovato", variant: "destructive" })
        return
      }
      setPieces(out)
      setTab("pezzi")
      toast({
        title: `${out.length} pezzi importati`,
        description: skip > 0 ? `${skip} esclusi (FINIT=-3)` : `da ${file.name}`,
      })
    } catch (err: any) {
      toast({ title: "Errore lettura file", description: err.message, variant: "destructive" })
    }
  }

  const calcola = () => {
    const valid = pieces.filter((p) => p.l1 > 0 && p.l2 > 0)
    if (!valid.length) {
      toast({ title: "Inserisci almeno un pezzo valido", variant: "destructive" })
      setTab("pezzi")
      return
    }
    const items: PackedItem[] = []
    valid.forEach((r) => {
      for (let i = 0; i < r.qty; i++) {
        const lung = Math.max(r.l1, r.l2)
        const larg = Math.min(r.l1, r.l2)
        const area = (lung / 100) * (larg / 100)
        const idPart = r.pid ? `ID ${r.pid}` : ""
        const codPart = r.pcod || ""
        const descPart = r.desc + (r.dett ? ` (${r.dett})` : "")
        const labelMain = idPart || codPart
          ? [idPart, codPart].filter(Boolean).join(" ")
          : descPart
        items.push({
          label: `${labelMain} ${lung}x${larg} sp.${r.sp}cm`,
          lung, larg, sp: r.sp, peso: area * densityFor(r.sp),
        })
      }
    })
    items.sort((a, b) => b.lung - a.lung || b.larg - a.larg)

    const packs: Omit<Imballo, "num" | "lp" | "ap" | "wp" | "cod" | "fumig" | "tetto" | "pesoMax">[] = []
    let curr: typeof packs[number] | null = null
    items.forEach((item) => {
      if (!curr || curr.pesoAcc + item.peso > pesoMax) {
        if (curr) packs.push(curr)
        curr = { pezzi: [], pesoAcc: 0, maxLung: 0, maxLarg: 0 }
      }
      curr.pezzi.push(item)
      curr.pesoAcc += item.peso
      curr.maxLung = Math.max(curr.maxLung, item.lung)
      curr.maxLarg = Math.max(curr.maxLarg, item.larg)
    })
    if (curr && curr.pezzi.length) packs.push(curr)

    const result: Imballo[] = packs.map((imb, idx) => {
      const lp = su10(imb.maxLung + 20)
      const ap = su10(imb.maxLarg + 30)
      const spMed = imb.pezzi.reduce((s, p) => s + p.sp, 0) / imb.pezzi.length
      const slot80 = Math.max(1, Math.floor(80 / (spMed + 2 * profilo)))
      return {
        ...imb,
        num: idx + 1,
        lp, ap,
        wp: imb.pezzi.length <= slot80 ? 80 : 100,
        cod: codice(lp, ap),
        fumig: fumigDefault,
        tetto: false,
        pesoMax,
      }
    })
    setImballi(result)
    setTab("risultati")
  }

  const toggleOpt = (idx: number, key: "fumig" | "tetto", value: boolean) =>
    setImballi((prev) => prev?.map((i, k) => (k === idx ? { ...i, [key]: value } : i)) || null)

  const scaricaPDF = () => {
    if (!imballi) return
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pw = 210, lm = 18, rm = 18, cw = pw - lm - rm
    const oggi = new Date().toLocaleDateString("it-IT")
    const totP = imballi.reduce((s, i) => s + i.pezzi.length, 0)
    const totW = imballi.reduce((s, i) => s + i.pesoAcc, 0)
    const totC = imballi.reduce((s, i) => s + costo(i), 0)

    let y = 18
    doc.setTextColor(26, 23, 20)
    doc.setFont("helvetica", "bold"); doc.setFontSize(18)
    doc.text("Imballi Pietra Lavica", lm, y); y += 6
    doc.setTextColor(150, 144, 138); doc.setFont("helvetica", "normal"); doc.setFontSize(8)
    doc.text(`Riepilogo del ${oggi}  ·  ${imballi.length} imballi  ·  ${totP} pezzi  ·  ${totW.toFixed(0)} kg`, lm, y)
    y += 5
    doc.setDrawColor(26, 23, 20); doc.setLineWidth(0.5); doc.line(lm, y, pw - rm, y); y += 8

    imballi.forEach((imb, idx) => {
      const c = costo(imb)
      const opts: string[] = []
      if (imb.fumig) opts.push("fumig.")
      if (imb.tetto) opts.push("tetto")
      const pTxt = imb.pezzi.map((p) => p.label).join("  ")
      const pLines = doc.splitTextToSize(pTxt, cw - 9)
      const rowH = 6 + pLines.length * 3.8 + 3
      if (y + rowH > 278) { doc.addPage(); y = 18 }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 246, 243)
        doc.rect(lm - 2, y - 3.5, cw + 4, rowH, "F")
      }
      doc.setTextColor(26, 23, 20); doc.setFont("helvetica", "bold"); doc.setFontSize(9)
      doc.text(String(imb.num), lm, y)
      doc.text(imb.cod, lm + 9, y)
      doc.setFont("helvetica", "normal")
      doc.text(`${imb.lp} x ${imb.wp} x ${imb.ap}`, lm + 30, y)
      doc.text(String(imb.pezzi.length), lm + 88, y, { align: "right" })
      doc.text(`${imb.pesoAcc.toFixed(0)} kg`, lm + 110, y, { align: "right" })
      doc.setTextColor(140, 134, 128); doc.setFontSize(8)
      doc.text(opts.join(", ") || "—", lm + 113, y)
      doc.setTextColor(26, 23, 20); doc.setFont("helvetica", "bold"); doc.setFontSize(9)
      doc.text(`€ ${c.toLocaleString("it-IT")}`, pw - rm, y, { align: "right" })
      y += 4.5
      doc.setTextColor(160, 154, 148); doc.setFont("helvetica", "normal"); doc.setFontSize(7)
      pLines.forEach((line: string) => {
        if (y > 282) { doc.addPage(); y = 18 }
        doc.text(line, lm + 9, y); y += 3.8
      })
      y += 3
    })

    if (y > 272) { doc.addPage(); y = 18 }
    y += 2
    doc.setDrawColor(26, 23, 20); doc.setLineWidth(0.4); doc.line(lm, y, pw - rm, y); y += 6
    doc.setTextColor(120, 114, 108); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5)
    doc.text("Totale imballi", lm, y)
    doc.setTextColor(26, 23, 20); doc.setFont("helvetica", "bold"); doc.setFontSize(12)
    doc.text(`€ ${totC.toLocaleString("it-IT")}`, pw - rm, y, { align: "right" })

    doc.save(`imballi_${oggi.replace(/\//g, "-")}.pdf`)
  }

  const totQty = pieces.reduce((s, p) => s + (p.qty || 0), 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Imballi Pietra Lavica</h2>
        <p className="text-xs text-muted-foreground">
          Calcolo automatico bancali · densità 3000 kg/m³
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="importa">① Importa</TabsTrigger>
          <TabsTrigger value="pezzi">② Pezzi</TabsTrigger>
          <TabsTrigger value="calcola">③ Calcola</TabsTrigger>
          <TabsTrigger value="risultati">④ Risultati</TabsTrigger>
        </TabsList>

        <TabsContent value="importa" className="space-y-3">
          <Card>
            <CardContent
              className="p-6 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">Carica la distinta pezzi</div>
              <p className="text-xs text-muted-foreground mt-1">
                Trascina <strong>.xlsx</strong> o clicca per selezionare
              </p>
              <p className="text-[11px] text-muted-foreground mt-2">
                Legge righe REP=CER · esclude FINIT=-3 · prende max(LATO1,LATO2) come lunghezza
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                  e.target.value = ""
                }}
              />
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Puoi anche inserire i pezzi a mano nella scheda <strong>② Pezzi</strong>.
          </p>
        </TabsContent>

        <TabsContent value="pezzi" className="space-y-3">
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Peso max (kg)</Label>
                  <Input type="number" value={pesoMax} onChange={(e) => setPesoMax(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs">Profilo (cm/lato)</Label>
                  <Input type="number" step="0.5" value={profilo} onChange={(e) => setProfilo(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs">Fumigatura</Label>
                  <Select value={fumigDefault ? "1" : "0"} onValueChange={(v) => setFumigDefault(v === "1")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Non inclusa</SelectItem>
                      <SelectItem value="1">Inclusa (+€60)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Lista pezzi{" "}
              {pieces.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pieces.length} righe</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addRow()}>
                <Plus className="h-4 w-4 mr-1" /> aggiungi
              </Button>
              <Button size="sm" variant="ghost" onClick={clearAll}>svuota</Button>
            </div>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 w-8">#</th>
                  <th className="p-2">Descrizione</th>
                  <th className="p-2">Finitura</th>
                  <th className="p-2 w-16">L1 cm</th>
                  <th className="p-2 w-16">L2 cm</th>
                  <th className="p-2 w-14">Sp.</th>
                  <th className="p-2 w-14">Qta</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {pieces.map((p, i) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-1 text-muted-foreground text-center">{i + 1}</td>
                    <td className="p-1"><Input className="h-7 text-xs" value={p.desc} onChange={(e) => updateRow(p.id, { desc: e.target.value })} /></td>
                    <td className="p-1"><Input className="h-7 text-xs" value={p.dett} onChange={(e) => updateRow(p.id, { dett: e.target.value })} /></td>
                    <td className="p-1"><Input className="h-7 text-xs" type="number" value={p.l1 || ""} onChange={(e) => updateRow(p.id, { l1: parseFloat(e.target.value) || 0 })} /></td>
                    <td className="p-1"><Input className="h-7 text-xs" type="number" value={p.l2 || ""} onChange={(e) => updateRow(p.id, { l2: parseFloat(e.target.value) || 0 })} /></td>
                    <td className="p-1">
                      <Select value={String(Math.round(p.sp))} onValueChange={(v) => updateRow(p.id, { sp: parseInt(v) })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1"><Input className="h-7 text-xs" type="number" value={p.qty} onChange={(e) => updateRow(p.id, { qty: parseInt(e.target.value) || 1 })} /></td>
                    <td className="p-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delRow(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setTab("calcola")}>Vai a Calcola →</Button>
          </div>
        </TabsContent>

        <TabsContent value="calcola" className="space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">Pronto per il calcolo</div>
                <p className="text-xs text-muted-foreground">
                  {pieces.length > 0
                    ? `${pieces.length} tipologie · ${totQty} pezzi totali`
                    : "Inserisci i pezzi prima di procedere."}
                </p>
              </div>
              <Button onClick={calcola} disabled={pieces.length === 0}>
                <Play className="h-4 w-4 mr-1" /> Calcola imballi
              </Button>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            💡 Pezzi ordinati per lunghezza decrescente · Lung. pallet = lung. max + 20 cm · Alt. pallet = larg. max + 30 cm
          </p>
        </TabsContent>

        <TabsContent value="risultati" className="space-y-3">
          {!imballi ? (
            <p className="text-sm text-muted-foreground">
              Premi <strong>Calcola imballi</strong> nella scheda ③ per vedere i risultati.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: imballi.reduce((s, i) => s + i.pezzi.length, 0), l: "Pezzi" },
                  { v: `${imballi.reduce((s, i) => s + i.pesoAcc, 0).toFixed(0)} kg`, l: "Peso" },
                  { v: imballi.length, l: "Imballi" },
                  { v: `€ ${imballi.reduce((s, i) => s + costo(i), 0).toLocaleString("it-IT")}`, l: "Costo" },
                ].map((m, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 text-center">
                      <div className="font-bold text-lg">{m.v}</div>
                      <div className="text-[11px] text-muted-foreground">{m.l}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {imballi.map((imb, idx) => {
                const c = costo(imb)
                const warn = imb.pesoAcc > imb.pesoMax * 0.95
                return (
                  <Card key={idx}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{imb.cod}</span>
                          <span className="text-xs text-muted-foreground">#{imb.num}</span>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-[10px]">{LABEL[imb.cod]}</Badge>
                          {warn && <Badge variant="destructive" className="text-[10px]">⚠ vicino al limite</Badge>}
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <div><span className="text-muted-foreground">Dim. pallet: </span><strong>{imb.lp} × {imb.wp} × {imb.ap} cm</strong></div>
                        <div><span className="text-muted-foreground">Pezzi: </span><strong>{imb.pezzi.length}</strong> · <span className="text-muted-foreground">Peso: </span><strong>{imb.pesoAcc.toFixed(0)} kg</strong></div>
                      </div>
                      <div className="text-[11px] text-muted-foreground border-t pt-2">
                        {imb.pezzi.map((p, i) => <div key={i}>{p.label}</div>)}
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <div className="flex gap-3 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox checked={imb.fumig} onCheckedChange={(v) => toggleOpt(idx, "fumig", !!v)} />
                            Fumig. (+€60)
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <Checkbox checked={imb.tetto} onCheckedChange={(v) => toggleOpt(idx, "tetto", !!v)} />
                            Tetto (+€35)
                          </label>
                        </div>
                        <div className="font-bold">€ {c.toLocaleString("it-IT")}</div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <div className="flex items-center justify-between border-t pt-3">
                <div className="text-sm font-medium">Totale progetto</div>
                <div className="text-lg font-bold">
                  € {imballi.reduce((s, i) => s + costo(i), 0).toLocaleString("it-IT")}
                </div>
              </div>

              <Button onClick={scaricaPDF} variant="outline" className="w-full">
                <FileDown className="h-4 w-4 mr-2" /> Scarica PDF riepilogo
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
