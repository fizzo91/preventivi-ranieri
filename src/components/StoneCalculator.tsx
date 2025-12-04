import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Calculator } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface StonePiece {
  id: string
  sp: number // spessore
  dim1: number // dimensione 1 (mm)
  dim2: number // dimensione 2 (mm)
  mqPezzo: number
  costoPietraMq: number
  costoEngobbioMq: number
  costoSmaltaturaMq: number
  totaleSmaltatura: number
  percentuale: number
  imballoMq: number
  costoTotaleMq: number
}

export interface StoneCalculatorResult {
  totalMq: number
  costoPietra: number
  costoEngobbio: number
  costoSmaltatura: number
  costoImballo: number
  costoTotale: number
}

interface StoneCalculatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (result: StoneCalculatorResult) => void
}

const defaultCosts = {
  percentuale: 0
}

function createInitialPiece(): StonePiece {
  return {
    id: Date.now().toString(),
    sp: 2,
    dim1: 0,
    dim2: 0,
    mqPezzo: 0,
    costoPietraMq: 0,
    costoEngobbioMq: 0,
    costoSmaltaturaMq: 0,
    totaleSmaltatura: 0,
    percentuale: defaultCosts.percentuale,
    imballoMq: 0,
    costoTotaleMq: 0
  }
}

export function StoneCalculator({ open, onOpenChange, onConfirm }: StoneCalculatorProps) {
  const [baseCosts, setBaseCosts] = useState(defaultCosts)
  const [pieces, setPieces] = useState<StonePiece[]>([createInitialPiece()])

  const createNewPiece = (): StonePiece => ({
    id: Date.now().toString(),
    sp: 2,
    dim1: 0,
    dim2: 0,
    mqPezzo: 0,
    costoPietraMq: 0,
    costoEngobbioMq: 0,
    costoSmaltaturaMq: 0,
    totaleSmaltatura: 0,
    percentuale: baseCosts.percentuale,
    imballoMq: 0,
    costoTotaleMq: 0
  })

  const calculatePiece = (piece: StonePiece): StonePiece => {
    // mq pezzo = (dim1 * dim2) / 1.000.000 (conversione mm² -> m²)
    const mqPezzo = (piece.dim1 * piece.dim2) / 1000000
    
    // PIETRA = (35*SP) + 20*SP*MQ
    const costoPietraMq = (35 * piece.sp) + (20 * piece.sp * mqPezzo)
    
    // ENGOBBIO = (80+(SP*20)-90) + ((MQ*45)-15)
    const costoEngobbioMq = (80 + (piece.sp * 20) - 90) + ((mqPezzo * 45) - 15)
    
    // SMALTATURA = 80 + 20*SP + 45*MQ
    const costoSmaltaturaMq = 80 + (20 * piece.sp) + (45 * mqPezzo)
    
    // IMBALLO = 5 + 4 + MQ * 3
    const imballoMq = 5 + 4 + (mqPezzo * 3)
    
    // Totale smaltatura = engobbio + smaltatura
    const totaleSmaltatura = costoEngobbioMq + costoSmaltaturaMq
    
    // Applicazione percentuale
    const totaleConPercentuale = totaleSmaltatura * (1 + piece.percentuale / 100)
    
    // Costo totale al mq = pietra + totale smaltatura (con %) + imballo
    const costoTotaleMq = costoPietraMq + totaleConPercentuale + imballoMq
    
    return {
      ...piece,
      mqPezzo,
      costoPietraMq,
      costoEngobbioMq,
      costoSmaltaturaMq,
      imballoMq,
      totaleSmaltatura,
      costoTotaleMq
    }
  }

  const updatePiece = (id: string, field: keyof StonePiece, value: number) => {
    setPieces(pieces.map(piece => {
      if (piece.id === id) {
        const updatedPiece = { ...piece, [field]: value }
        return calculatePiece(updatedPiece)
      }
      return piece
    }))
  }

  const addPiece = () => {
    setPieces([...pieces, createNewPiece()])
  }

  const removePiece = (id: string) => {
    if (pieces.length > 1) {
      setPieces(pieces.filter(p => p.id !== id))
    }
  }

  const applyBaseCostsToAll = () => {
    setPieces(pieces.map(piece => 
      calculatePiece({
        ...piece,
        percentuale: baseCosts.percentuale
      })
    ))
  }

  // Ricalcola automaticamente quando cambiano i pezzi
  useEffect(() => {
    setPieces(prev => prev.map(calculatePiece))
  }, [])

  const totalMq = pieces.reduce((sum, p) => sum + p.mqPezzo, 0)
  const totalPietra = pieces.reduce((sum, p) => sum + (p.mqPezzo * p.costoPietraMq), 0)
  const totalEngobbio = pieces.reduce((sum, p) => sum + (p.mqPezzo * p.costoEngobbioMq), 0)
  const totalSmaltatura = pieces.reduce((sum, p) => sum + (p.mqPezzo * p.costoSmaltaturaMq), 0)
  const totalImballo = pieces.reduce((sum, p) => sum + (p.mqPezzo * p.imballoMq), 0)
  const totalCosto = totalPietra + totalEngobbio + totalSmaltatura + totalImballo
  const avgCostoMq = totalMq > 0 ? totalCosto / totalMq : 0

  const handleConfirm = () => {
    onConfirm({
      totalMq,
      costoPietra: totalPietra,
      costoEngobbio: totalEngobbio,
      costoSmaltatura: totalSmaltatura,
      costoImballo: totalImballo,
      costoTotale: totalCosto
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcolatore Costo Pietra
          </DialogTitle>
        </DialogHeader>

        {/* Parametri */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Parametri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-w-xs">
              <Label className="text-xs">% Maggiorazione Smaltatura</Label>
              <Input
                type="number"
                step="0.1"
                value={baseCosts.percentuale}
                onChange={(e) => setBaseCosts({ ...baseCosts, percentuale: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={applyBaseCostsToAll}
            >
              Applica a tutti i pezzi
            </Button>
          </CardContent>
        </Card>

        {/* Tabella Pezzi */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-2 py-2 text-left font-medium">SP</th>
                <th className="px-2 py-2 text-left font-medium">DIM 1</th>
                <th className="px-2 py-2 text-left font-medium">DIM 2</th>
                <th className="px-2 py-2 text-left font-medium bg-amber-100 dark:bg-amber-900/30">mq</th>
                <th className="px-2 py-2 text-left font-medium">Pietra €/mq</th>
                <th className="px-2 py-2 text-left font-medium">Engobbio €/mq</th>
                <th className="px-2 py-2 text-left font-medium">Smaltatura €/mq</th>
                <th className="px-2 py-2 text-left font-medium bg-amber-100 dark:bg-amber-900/30">Tot. Smalt.</th>
                <th className="px-2 py-2 text-left font-medium">%</th>
                <th className="px-2 py-2 text-left font-medium">Imballo €/mq</th>
                <th className="px-2 py-2 text-left font-medium bg-green-100 dark:bg-green-900/30">Costo Tot. €/mq</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((piece) => (
                <tr key={piece.id} className="border-b">
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      value={piece.sp}
                      onChange={(e) => updatePiece(piece.id, 'sp', parseFloat(e.target.value) || 0)}
                      className="h-8 w-14"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      value={piece.dim1 || ''}
                      placeholder="mm"
                      onChange={(e) => updatePiece(piece.id, 'dim1', parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      value={piece.dim2 || ''}
                      placeholder="mm"
                      onChange={(e) => updatePiece(piece.id, 'dim2', parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-2 py-2 bg-amber-50 dark:bg-amber-900/20 font-medium">
                    {piece.mqPezzo.toFixed(4)}
                  </td>
                  <td className="px-2 py-2 bg-muted/30 text-muted-foreground">
                    {piece.costoPietraMq.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 bg-muted/30 text-muted-foreground">
                    {piece.costoEngobbioMq.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 bg-muted/30 text-muted-foreground">
                    {piece.costoSmaltaturaMq.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 bg-amber-50 dark:bg-amber-900/20 font-medium">
                    {piece.totaleSmaltatura.toFixed(2)}
                  </td>
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={piece.percentuale}
                      onChange={(e) => updatePiece(piece.id, 'percentuale', parseFloat(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                  </td>
                  <td className="px-2 py-2 bg-muted/30 text-muted-foreground">
                    {piece.imballoMq.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 bg-green-50 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400">
                    {piece.costoTotaleMq.toFixed(2)}
                  </td>
                  <td className="px-1 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removePiece(piece.id)}
                      disabled={pieces.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" onClick={addPiece} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Pezzo
        </Button>

        {/* Riepilogo Totali */}
        <Card className="mt-4 bg-muted/50">
          <CardContent className="py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Totale mq</div>
                <div className="text-2xl font-bold">{totalMq.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Costo Medio €/mq</div>
                <div className="text-2xl font-bold">{avgCostoMq.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Costo Totale</div>
                <div className="text-2xl font-bold text-primary">€ {totalCosto.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleConfirm}>
            Usa nel Preventivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
