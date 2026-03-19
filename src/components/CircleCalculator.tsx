import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("it-IT", { minimumFractionDigits: 4, maximumFractionDigits: 4 })

const fmt2 = (n: number) =>
  n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const parseNum = (v: string) => {
  const n = parseFloat(v.replace(",", "."))
  return isNaN(n) ? 0 : n
}

interface ResultRow {
  label: string
  value: string
  rawValue: number
}

export function CircleCalculator() {
  const [diameter, setDiameter] = useState("")
  const [radius, setRadius] = useState("")
  const [activeField, setActiveField] = useState<"diameter" | "radius">("diameter")
  const { toast } = useToast()

  const results = useMemo((): ResultRow[] | null => {
    let rMm: number
    if (activeField === "diameter") {
      rMm = parseNum(diameter) / 2
    } else {
      rMm = parseNum(radius)
    }
    if (rMm <= 0) return null

    const dMm = rMm * 2
    const circumferenceMm = 2 * Math.PI * rMm

    // Inscribing rectangle: d × d
    const rectAreaMm2 = dMm * dMm
    // Enlarged rectangle: (d+100) × (d+100) — 50mm extra per lato
    const rectEnlargedMm2 = (dMm + 100) * (dMm + 100)

    // Convert to meters
    const circumferenceMl = circumferenceMm / 1000
    const rectAreaMq = rectAreaMm2 / 1_000_000
    const rectEnlargedMq = rectEnlargedMm2 / 1_000_000

    return [
      { label: "Diametro", value: `${fmt2(dMm)} mm`, rawValue: dMm },
      { label: "Raggio", value: `${fmt2(rMm)} mm`, rawValue: rMm },
      { label: "Circonferenza", value: `${fmt(circumferenceMl)} ml`, rawValue: circumferenceMl },
      { label: "Area rettangolo", value: `${fmt(rectAreaMq)} mq`, rawValue: rectAreaMq },
      { label: "Area maggiorata (+50mm/lato)", value: `${fmt(rectEnlargedMq)} mq`, rawValue: rectEnlargedMq },
    ]
  }, [diameter, radius, activeField])

  const handleDiameterChange = (value: string) => {
    setDiameter(value)
    setActiveField("diameter")
    const d = parseNum(value)
    if (d > 0) setRadius(fmt2(d / 2))
    else setRadius("")
  }

  const handleRadiusChange = (value: string) => {
    setRadius(value)
    setActiveField("radius")
    const r = parseNum(value)
    if (r > 0) setDiameter(fmt2(r * 2))
    else setDiameter("")
  }

  const copyValue = (row: ResultRow) => {
    navigator.clipboard.writeText(row.rawValue.toFixed(4).replace(".", ","))
    toast({ title: `${row.label} copiato`, description: row.value })
  }

  const copyAll = () => {
    if (!results) return
    const text = results.map(r => `${r.label}: ${r.value}`).join("\n")
    navigator.clipboard.writeText(text)
    toast({ title: "Tutti i risultati copiati" })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Input fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Diametro (mm)</label>
              <Input
                value={diameter}
                onChange={(e) => handleDiameterChange(e.target.value)}
                placeholder="es. 500"
                className="h-9 text-sm"
                type="text"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Raggio (mm)</label>
              <Input
                value={radius}
                onChange={(e) => handleRadiusChange(e.target.value)}
                placeholder="es. 250"
                className="h-9 text-sm"
                type="text"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Results */}
          {results ? (
            <div className="space-y-2 pt-3 border-t border-border">
              {results.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 group"
                >
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.label}</div>
                    <div className="text-sm font-bold text-foreground">{row.value}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-60 group-hover:opacity-100"
                    onClick={() => copyValue(row)}
                    title={`Copia ${row.label}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              <Button variant="secondary" size="sm" onClick={copyAll} className="w-full mt-2 gap-2">
                <Copy className="h-3.5 w-3.5" /> Copia tutto
              </Button>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-6">
              Inserisci diametro o raggio in mm per calcolare
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground space-y-1">
            <div className="font-semibold text-xs mb-1">Formule</div>
            <div>Circonferenza = π × d (risultato in ml)</div>
            <div>Area = π × r² (risultato in mq)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
