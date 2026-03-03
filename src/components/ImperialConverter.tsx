import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft } from "lucide-react"

const FRACTIONS = [
  { label: "0", value: 0 },
  { label: "1/16", value: 1 / 16 },
  { label: "1/8", value: 1 / 8 },
  { label: "3/16", value: 3 / 16 },
  { label: "1/4", value: 1 / 4 },
  { label: "5/16", value: 5 / 16 },
  { label: "3/8", value: 3 / 8 },
  { label: "7/16", value: 7 / 16 },
  { label: "1/2", value: 1 / 2 },
  { label: "9/16", value: 9 / 16 },
  { label: "5/8", value: 5 / 8 },
  { label: "11/16", value: 11 / 16 },
  { label: "3/4", value: 3 / 4 },
  { label: "13/16", value: 13 / 16 },
  { label: "7/8", value: 7 / 8 },
  { label: "15/16", value: 15 / 16 },
]

const INCH_TO_MM = 25.4

export function ImperialConverter() {
  const [feet, setFeet] = useState<number>(0)
  const [inches, setInches] = useState<number>(0)
  const [fraction, setFraction] = useState<string>("0")

  const result = useMemo(() => {
    const fractionValue = FRACTIONS.find(f => f.label === fraction)?.value || 0
    const totalInches = (feet * 12) + inches + fractionValue
    const mm = totalInches * INCH_TO_MM
    const cm = mm / 10
    const m = mm / 1000
    return { totalInches, mm, cm, m }
  }, [feet, inches, fraction])

  const display = `${feet > 0 ? `${feet}' ` : ""}${inches}${fraction !== "0" ? ` ${fraction}` : ""}\"`

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <ArrowRightLeft className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">Convertitore Pollici/Piedi → mm</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Inserisci piedi, pollici e frazione per convertire in millimetri</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Piedi (ft)</Label>
            <Input
              type="number"
              min={0}
              value={feet}
              onChange={(e) => setFeet(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Pollici (in)</Label>
            <Input
              type="number"
              min={0}
              max={11}
              value={inches}
              onChange={(e) => setInches(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Frazione</Label>
            <Select value={fraction} onValueChange={setFraction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRACTIONS.map((f) => (
                  <SelectItem key={f.label} value={f.label}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Result */}
        <div className="bg-muted/40 rounded-lg p-4 space-y-3">
          <div className="text-center text-sm text-muted-foreground font-medium">
            {display}
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{result.mm.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">mm</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{result.cm.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">cm</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{result.m.toFixed(4)}</div>
              <div className="text-xs text-muted-foreground">m</div>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Riferimenti rapidi</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>1" = 25.4 mm</span>
            <span>1' = 304.8 mm</span>
            <span>1/2" = 12.7 mm</span>
            <span>1/4" = 6.35 mm</span>
            <span>1/8" = 3.175 mm</span>
            <span>1/16" = 1.5875 mm</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
