import { StatCard } from "@/components/shared"
import type { Quote } from "@/hooks/useQuotes"

interface QuoteStatsBarProps {
  quotes: Quote[]
}

export const QuoteStatsBar = ({ quotes }: QuoteStatsBarProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatCard title="Totale Preventivi" value={quotes.length} />
    <StatCard title="Bozze" value={quotes.filter(q => q.status === 'draft').length} />
    <StatCard title="Inviati" value={quotes.filter(q => q.status === 'sent').length} className="text-success" />
    <StatCard
      title="Valore Totale"
      value={`€ ${quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0).toFixed(2)}`}
      className="text-success"
    />
  </div>
)
