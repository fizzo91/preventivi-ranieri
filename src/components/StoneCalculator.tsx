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

interface StoneCalculatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (totalMq: number, costoTotale: number) => void
}

const defaultCosts = {
  costoPietraMq: 85.66,
  costoEngobbioMq: 32.62,
  costoSmaltaturaMq: 137.62,
  percentuale: 0,
  imballoMq: 10.17
}

export function StoneCalculator({ open, onOpenChange, onConfirm }: StoneCalculatorProps) {
  const [pieces, setPieces] = useState<StonePiece[]>([
    createNewPiece()
  ])
  
  const [baseCosts, setBaseCosts] = useState(defaultCosts)

  function createNewPiece(): StonePiece {
    return {
      id: Date.now().toString(),
      sp: 2,
      dim1: 0,
      dim2: 0,
      mqPezzo: 0,
      costoPietraMq: baseCosts.costoPietraMq,
      costoEngobbioMq: baseCosts.costoEngobbioMq,
      costoSmaltaturaMq: baseCosts.costoSmaltaturaMq,
      totaleSmaltatura: 0,
      percentuale: baseCosts.percentuale,
      imballoMq: baseCosts.imballoMq,
      costoTotaleMq: 0
    }
  }

  const calculatePiece = (piece: StonePiece): StonePiece => {
    // mq pezzo = (dim1 * dim2) / 1.000.000 (conversione mm² -> m²)
    const mqPezzo = (piece.dim1 * piece.dim2) / 1000000
    
    // Totale smaltatura = engobbio + smaltatura
    const totaleSmaltatura = piece.costoEngobbioMq + piece.costoSmaltaturaMq
    
    // Applicazione percentuale
    const totaleConPercentuale = totaleSmaltatura * (1 + piece.percentuale / 100)
    
    // Costo totale al mq = pietra + totale smaltatura (con %) + imballo
    const costoTotaleMq = piece.costoPietraMq + totaleConPercentuale + piece.imballoMq
    
    return {
      ...piece,
      mqPezzo,
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
        costoPietraMq: baseCosts.costoPietraMq,
        costoEngobbioMq: baseCosts.costoEngobbioMq,
        costoSmaltaturaMq: baseCosts.costoSmaltaturaMq,
        percentuale: baseCosts.percentuale,
        imballoMq: baseCosts.imballoMq
      })
    ))
  }

  // Ricalcola automaticamente quando cambiano i pezzi
  useEffect(() => {
    setPieces(prev => prev.map(calculatePiece))
  }, [])

  const totalMq = pieces.reduce((sum, p) => sum + p.mqPezzo, 0)
  const totalCosto = pieces.reduce((sum, p) => sum + (p.mqPezzo * p.costoTotaleMq), 0)
  const avgCostoMq = totalMq > 0 ? totalCosto / totalMq : 0

  const handleConfirm = () => {
    onConfirm(totalMq, totalCosto)
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

        {/* Costi Base Parametrizzati */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Costi Base (€/mq)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pietra</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={baseCosts.costoPietraMq}
                  onChange={(e) => setBaseCosts({ ...baseCosts, costoPietraMq: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Engobbio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={baseCosts.costoEngobbioMq}
                  onChange={(e) => setBaseCosts({ ...baseCosts, costoEngobbioMq: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Smaltatura</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={baseCosts.costoSmaltaturaMq}
                  onChange={(e) => setBaseCosts({ ...baseCosts, costoSmaltaturaMq: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">% Maggiorazione</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={baseCosts.percentuale}
                  onChange={(e) => setBaseCosts({ ...baseCosts, percentuale: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Imballo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={baseCosts.imballoMq}
                  onChange={(e) => setBaseCosts({ ...baseCosts, imballoMq: parseFloat(e.target.value) || 0 })}
                  className="h-8"
                />
              </div>
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
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={piece.costoPietraMq}
                      onChange={(e) => updatePiece(piece.id, 'costoPietraMq', parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={piece.costoEngobbioMq}
                      onChange={(e) => updatePiece(piece.id, 'costoEngobbioMq', parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={piece.costoSmaltaturaMq}
                      onChange={(e) => updatePiece(piece.id, 'costoSmaltaturaMq', parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
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
                  <td className="px-1 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={piece.imballoMq}
                      onChange={(e) => updatePiece(piece.id, 'imballoMq', parseFloat(e.target.value) || 0)}
                      className="h-8 w-20"
                    />
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
