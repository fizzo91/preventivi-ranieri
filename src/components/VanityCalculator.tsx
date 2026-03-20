import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/utils/formatting"

// Benchmark: 1200x500x130, 1 vasca
const BENCH = { l: 1200, p: 500, h: 130, dt: 900, em: 1070 }

type Lavorazione = "standard" | "sagomato" | "5assi"

interface Result {
  dimensioni: string
  lavorazione: string
  vasche: number
  dtMin: number
  dtMax: number
  dtRec: number
  emMin: number
  emMax: number
  emRec: number
}

function calcVanity(
  lunghezza: number,
  profondita: number,
  altezza: number,
  vasche: 1 | 2,
  lavorazione: Lavorazione,
  hasBordoParticolare: boolean
): Result {
  // --- Scaling dimensionale ---
  const deltaL = (lunghezza - BENCH.l) / BENCH.l
  const scalL = 1 + deltaL * (20 / 30) // +30% lungh → +20% prezzo

  let scalPMin = 1, scalPMax = 1
  if (profondita > BENCH.p) {
    const ratio = (profondita - BENCH.p) / BENCH.p
    scalPMin = 1 + ratio * 0.5  // ~5%
    scalPMax = 1 + ratio * 1.0  // ~10%
  }

  let scalHMin = 1, scalHMax = 1
  if (altezza > BENCH.h) {
    const ratio = (altezza - BENCH.h) / BENCH.h
    scalHMin = 1 + ratio * 0.77 // ~10%
    scalHMax = 1 + ratio * 1.92 // ~25%
  } else if (altezza < BENCH.h) {
    const ratio = (BENCH.h - altezza) / BENCH.h
    scalHMin = 1 - ratio * 0.77 // ~-10%
    scalHMax = 1 - ratio * 0.38 // ~-5%
  }

  // --- Vasche ---
  const vascheMin = vasche === 2 ? 1.30 : 1
  const vascheMax = vasche === 2 ? 1.40 : 1

  // --- Complessità (non additiva) ---
  let compMin = 1, compMax = 1
  switch (lavorazione) {
    case "sagomato":
      compMin = 1.15; compMax = 1.25; break
    case "5assi":
      compMin = 1.30; compMax = 1.60; break
  }
  if (hasBordoParticolare) {
    // Combinazione non lineare: media ponderata
    compMin = compMin * 1.15 // attenuato
    compMax = compMax * 1.25
  }

  // --- Calcolo base ---
  const factorMin = scalL * scalPMin * scalHMin * vascheMin * compMin
  const factorMax = scalL * scalPMax * scalHMax * vascheMax * compMax

  // DT
  let dtMin = BENCH.dt * factorMin
  let dtMax = BENCH.dt * factorMax

  // EM - base più caro su standard, più competitivo su 5 assi
  let emMin = BENCH.em * factorMin
  let emMax = BENCH.em * factorMax

  if (lavorazione === "5assi") {
    // EM più competitivo: -5 a -10%
    emMin *= 0.90
    emMax *= 0.95
  }

  // Arrotonda a 10€
  const r10 = (v: number) => Math.round(v / 10) * 10
  dtMin = r10(dtMin)
  dtMax = r10(dtMax)
  emMin = r10(emMin)
  emMax = r10(emMax)

  // Prezzo consigliato: media pesata verso il 60%
  const dtRec = r10(dtMin + (dtMax - dtMin) * 0.6)
  const emRec = r10(emMin + (emMax - emMin) * 0.6)

  const lavLabel = lavorazione === "5assi" ? "5 Assi" : lavorazione === "sagomato" ? "Sagomato" : "Standard"

  return {
    dimensioni: `${lunghezza} × ${profondita} × ${altezza}`,
    lavorazione: lavLabel + (hasBordoParticolare ? " + Bordo" : ""),
    vasche,
    dtMin, dtMax, dtRec,
    emMin, emMax, emRec,
  }
}

export function VanityCalculator() {
  const [lunghezza, setLunghezza] = useState(1200)
  const [profondita, setProfondita] = useState(500)
  const [altezza, setAltezza] = useState(130)
  const [vasche, setVasche] = useState<1 | 2>(1)
  const [lavorazione, setLavorazione] = useState<Lavorazione>("standard")
  const [bordoParticolare, setBordoParticolare] = useState(false)
  const [note, setNote] = useState("")
  const [result, setResult] = useState<Result | null>(null)

  const handleCalcola = () => {
    if (lunghezza <= 0 || profondita <= 0 || altezza <= 0) return
    setResult(calcVanity(lunghezza, profondita, altezza, vasche, lavorazione, bordoParticolare))
  }

  const fmt = (v: number) => formatCurrency(v)

  return (
    <div className="space-y-5">
      {/* Dimensioni */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dimensioni (mm)</Label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Lunghezza</Label>
            <Input type="number" value={lunghezza || ""} min={100} step={10}
              onChange={(e) => setLunghezza(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Profondità</Label>
            <Input type="number" value={profondita || ""} min={100} step={10}
              onChange={(e) => setProfondita(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Altezza</Label>
            <Input type="number" value={altezza || ""} min={10} step={5}
              onChange={(e) => setAltezza(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Vasche */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vasche</Label>
        <RadioGroup value={String(vasche)} onValueChange={(v) => setVasche(Number(v) as 1 | 2)} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="1" id="v1" />
            <Label htmlFor="v1" className="text-sm cursor-pointer">1 vasca</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="2" id="v2" />
            <Label htmlFor="v2" className="text-sm cursor-pointer">2 vasche</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Lavorazione */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lavorazione</Label>
        <RadioGroup value={lavorazione} onValueChange={(v) => setLavorazione(v as Lavorazione)} className="flex flex-wrap gap-4">
          {([["standard", "Standard"], ["sagomato", "Sagomato"], ["5assi", "5 Assi"]] as const).map(([val, lab]) => (
            <div key={val} className="flex items-center gap-2">
              <RadioGroupItem value={val} id={`lav-${val}`} />
              <Label htmlFor={`lav-${val}`} className="text-sm cursor-pointer">{lab}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Bordo particolare */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="bordo"
          checked={bordoParticolare}
          onChange={(e) => setBordoParticolare(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor="bordo" className="text-sm cursor-pointer">Bordo particolare / fronte a vista</Label>
      </div>

      {/* Note */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Note (opzionale)</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Bordi, finiture, dettagli..." />
      </div>

      <Button onClick={handleCalcola} className="w-full">Calcola Stima</Button>

      {/* Risultato */}
      {result && (
        <div className="space-y-3 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Vanity</TableHead>
                <TableHead className="text-xs">Dimensioni</TableHead>
                <TableHead className="text-xs">Lavorazione</TableHead>
                <TableHead className="text-xs text-center">Vasche</TableHead>
                <TableHead className="text-xs text-right">DT (€)</TableHead>
                <TableHead className="text-xs text-right">EM (€)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm font-medium">Vanity</TableCell>
                <TableCell className="text-sm">{result.dimensioni}</TableCell>
                <TableCell className="text-sm">{result.lavorazione}</TableCell>
                <TableCell className="text-sm text-center">{result.vasche}</TableCell>
                <TableCell className="text-sm text-right font-semibold">{fmt(result.dtRec)}</TableCell>
                <TableCell className="text-sm text-right font-semibold">{fmt(result.emRec)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="font-semibold text-foreground">DT — Di Tonno</div>
              <div className="text-muted-foreground">Intervallo: {fmt(result.dtMin)} – {fmt(result.dtMax)}</div>
              <div className="text-foreground font-medium">Consigliato: {fmt(result.dtRec)}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="font-semibold text-foreground">EM — Euromarmi</div>
              <div className="text-muted-foreground">Intervallo: {fmt(result.emMin)} – {fmt(result.emMax)}</div>
              <div className="text-foreground font-medium">Consigliato: {fmt(result.emRec)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
