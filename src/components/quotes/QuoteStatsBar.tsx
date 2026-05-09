import { StatCard } from "@/components/shared"
import type { Quote } from "@/hooks/useQuotes"

interface QuoteStatsBarProps {
  quotes: Quote[]
}

export const QuoteStatsBar = ({ quotes }: QuoteStatsBarProps) => {
  const totalValue = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard title="Totale Preventivi" value={quotes.length} />
      <StatCard
        title="Valore Totale"
        value={`€ ${totalValue.toFixed(2)}`}
        className="text-success"
      />
    </div>
  )
}
