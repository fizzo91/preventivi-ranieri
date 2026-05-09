import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { QuoteSection, Risk } from "@/types/quote"

interface SectionRiskRowProps {
  risk: Risk
  section: QuoteSection
  onUpdate: (riskId: string, field: keyof Risk, value: any) => void
  onRemove: (riskId: string) => void
}

/** Single risk row inside a section: description, target item, % and amount. */
export function SectionRiskRow({ risk, section, onUpdate, onRemove }: SectionRiskRowProps) {
  const itemsTotal = section.items.reduce((sum, item) => sum + item.total, 0)
  let amount = 0
  if (risk.appliedToItemId === "SECTION_TOTAL") {
    amount = itemsTotal * (risk.percentage / 100)
  } else {
    const targetItem = section.items.find((i) => i.id === risk.appliedToItemId)
    amount = targetItem ? targetItem.total * (risk.percentage / 100) : 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-muted/30">
      <div className="md:col-span-3 space-y-2">
        <Label className="text-xs">Descrizione Rischio</Label>
        <Input
          value={risk.description}
          onChange={(e) => onUpdate(risk.id, "description", e.target.value)}
          placeholder="Es. Rischio rotture"
          className="h-9"
        />
      </div>
      <div className="md:col-span-3 space-y-2">
        <Label className="text-xs">Voce di Riferimento</Label>
        <Combobox
          options={[
            { value: "SECTION_TOTAL", label: `🔷 Totale Sezione (€${itemsTotal.toFixed(2)})` },
            ...section.items.map((item) => ({
              value: item.id,
              label: `${item.productName || "Prodotto"} (€${item.total.toFixed(2)})`,
            })),
          ]}
          value={risk.appliedToItemId}
          placeholder="Seleziona voce..."
          searchPlaceholder="Cerca voce..."
          onSelect={(value) => onUpdate(risk.id, "appliedToItemId", value)}
        />
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label className="text-xs">Percentuale %</Label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={risk.percentage}
          onChange={(e) => onUpdate(risk.id, "percentage", parseFloat(e.target.value) || 0)}
          className="h-9"
        />
      </div>
      <div className="md:col-span-3 space-y-2">
        <Label className="text-xs">Importo Rischio</Label>
        <div className="h-9 px-3 py-2 bg-background rounded-md flex items-center font-medium text-sm">
          € {amount.toFixed(2)}
        </div>
      </div>
      <div className="md:col-span-1 space-y-2">
        <Label className="invisible text-xs">Azioni</Label>
        <Button variant="outline" size="sm" onClick={() => onRemove(risk.id)} className="h-9 w-full">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
