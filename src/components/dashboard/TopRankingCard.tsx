import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RankItem {
  name: string
  count: number
}

interface TopRankingCardProps {
  title: string
  items: RankItem[]
  barColorClass?: string
}

export const TopRankingCard = ({ title, items, barColorClass = "bg-primary" }: TopRankingCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => {
            const maxCount = items[0].count
            const percentage = (item.count / maxCount) * 100
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">{index + 1}.</span>
                    <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">{item.count} sezioni</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${barColorClass} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-center py-6 text-sm text-muted-foreground">Nessun dato disponibile.</p>
      )}
    </CardContent>
  </Card>
)
