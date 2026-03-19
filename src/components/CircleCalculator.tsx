import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fmt = (n: number) =>
  n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const parseNum = (v: string) => {
  const n = parseFloat(v.replace(",", "."))
  return isNaN(n) ? 0 : n
}

export function CircleCalculator() {
  const [diameter, setDiameter] = useState("")
  const [radius, setRadius] = useState("")
  const [activeField, setActiveField] = useState<"diameter" | "radius">("diameter")
  const { toast } = useToast()

  const results = useMemo(() => {
    let r: number
    if (activeField === "diameter") {
      r = parseNum(diameter) / 2
    } else {
      r = parseNum(radius)
    }
    if (r <= 0) return null

    const d = r * 2
    const circumference = 2 * Math.PI * r
    const area = Math.PI * r * r
    // Convert from cm to other units
    const areaMq = area / 10000
    const circumferenceMl = circumference / 100

    return {
      radius: r,
      diameter: d,
      circumference,
      circumferenceMl,
      area,
      areaMq,
    }
  }, [diameter, radius, activeField])

  const handleDiameterChange = (value: string) => {
    setDiameter(value)
    setActiveField("diameter")
    const d = parseNum(value)
    if (d > 0) setRadius(fmt(d / 2))
    else setRadius("")
  }

  const handleRadiusChange = (value: string) => {
    setRadius(value)
    setActiveField("radius")
    const r = parseNum(value)
    if (r > 0) setDiameter(fmt(r * 2))
    else setDiameter("")
  }

  const copyResults = () => {
    if (!results) return
    const text = [
      `Diametro: ${fmt(results.diameter)} cm`,
      `Raggio: ${fmt(results.radius)} cm`,
      `Circonferenza: ${fmt(results.circumference)} cm (${fmt(results.circumferenceMl)} ml)`,
      `Area: ${fmt(results.area)} cm² (${fmt(results.areaMq)} mq)`,
    ].join("\n")
    navigator.clipboard.writeText(text)
    toast({ title: "Copiato negli appunti" })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Input fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Diametro (cm)</label>
              <Input
                value={diameter}
                onChange={(e) => handleDiameterChange(e.target.value)}
                placeholder="es. 50"
                className="h-9 text-sm"
                type="text"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Raggio (cm)</label>
              <Input
                value={radius}
                onChange={(e) => handleRadiusChange(e.target.value)}
                placeholder="es. 25"
                className="h-9 text-sm"
                type="text"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Results */}
          {results ? (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Circonferenza</div>
                  <div className="text-lg font-bold text-foreground">{fmt(results.circumference)} cm</div>
                  <div className="text-xs text-muted-foreground">{fmt(results.circumferenceMl)} ml</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Area</div>
                  <div className="text-lg font-bold text-foreground">{fmt(results.area)} cm²</div>
                  <div className="text-xs text-muted-foreground">{fmt(results.areaMq)} mq</div>
                </div>
              </div>

              {/* Visual representation */}
              <div className="flex items-center justify-center py-4">
                <div
                  className="border-2 border-primary/40 rounded-full flex items-center justify-center relative"
                  style={{
                    width: `${Math.min(140, Math.max(40, results.diameter * 1.4))}px`,
                    height: `${Math.min(140, Math.max(40, results.diameter * 1.4))}px`,
                  }}
                >
                  <div className="text-xs text-muted-foreground text-center">
                    <div className="font-semibold">⌀ {fmt(results.diameter)}</div>
                    <div>r {fmt(results.radius)}</div>
                  </div>
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={copyResults} className="w-full gap-2">
                <Copy className="h-3.5 w-3.5" /> Copia risultati
              </Button>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-6">
              Inserisci diametro o raggio per calcolare
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulas reference */}
      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="text-[10px] text-muted-foreground space-y-1">
            <div className="font-semibold text-xs mb-1">Formule</div>
            <div>Circonferenza = 2 × π × r = π × d</div>
            <div>Area = π × r²</div>
            <div>π ≈ 3,14159</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
