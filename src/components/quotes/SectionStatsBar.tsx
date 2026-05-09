import { AlertTriangle, TrendingDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { QuoteSection, PriceWarning } from "@/types/quote"

interface SectionStatsBarProps {
  section: QuoteSection
  warning: PriceWarning | null
  onChangeMq: (mq: number) => void
  onChangeQuantity: (qty: number) => void
}

/** Stats row for a section: total, €/mq warnings, manual mq input and quantity. */
export function SectionStatsBar({ section, warning, onChangeMq, onChangeQuantity }: SectionStatsBarProps) {
  const containerClass = `flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-3 py-2 ${
    warning?.type === "above"
      ? "bg-destructive/10 border border-destructive/30"
      : warning?.type === "below"
      ? "bg-sky-500/10 border border-sky-500/30"
      : "bg-muted/40"
  }`

  const qty = section.quantity || 1

  return (
    <div className={containerClass}>
      <div className="text-lg font-bold text-primary whitespace-nowrap">
        Totale: € {section.total.toFixed(2)}
      </div>

      {warning && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1 ${warning.type === "above" ? "text-destructive" : "text-sky-500"}`}>
                {warning.type === "above" ? <AlertTriangle className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-xs font-medium">
                  {warning.type === "above" ? "+" : "-"}
                  {warning.pctDiff}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">
                Prezzo {warning.type === "above" ? "sopra" : "sotto"} la media per {warning.thickness} mm
              </p>
              <p className="text-xs mt-1">
                €/mq sezione: € {warning.sectionCostPerMq.toFixed(2)} — Media: € {warning.avgCostPerMq.toFixed(2)}/mq (
                {warning.type === "above" ? "+" : "-"}
                {warning.pctDiff}%)
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">mq:</Label>
        <Input
          type="number"
          step="0.01"
          value={section.mqTotali || ""}
          onChange={(e) => onChangeMq(parseFloat(e.target.value) || 0)}
          className="h-8 w-20"
          placeholder="0.00"
        />
      </div>

      {section.mqTotali && section.mqTotali > 0 && (
        <div className="text-sm font-medium bg-background px-2 py-1 rounded whitespace-nowrap">
          €/mq: {(section.total / section.mqTotali).toFixed(2)}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Qtà:</Label>
        <Input
          type="number"
          min="1"
          step="1"
          value={qty}
          onChange={(e) => onChangeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="h-8 w-16"
        />
      </div>

      {qty > 1 && (
        <div className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
          Tot x{section.quantity}: € {(section.total * qty).toFixed(2)}
        </div>
      )}
    </div>
  )
}
