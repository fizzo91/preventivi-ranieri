import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EnamelCostCalculator, type EnamelPieceRow } from "./EnamelCostCalculator"

interface EnamelCostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: EnamelPieceRow[]
  onChange: (rows: EnamelPieceRow[]) => void
}

export function EnamelCostDialog({ open, onOpenChange, value, onChange }: EnamelCostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Calcolatore Costi Smalto</DialogTitle>
        </DialogHeader>
        <EnamelCostCalculator value={value} onChange={onChange} />
      </DialogContent>
    </Dialog>
  )
}
