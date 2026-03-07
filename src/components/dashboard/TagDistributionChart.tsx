import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

export interface TagStats {
  tag: string
  count: number
  totalValue: number
}

const TAG_COLORS = [
  'hsl(var(--primary))', '#f97316', '#22c55e', '#8b5cf6', '#ec4899',
  '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#6366f1'
]

interface TagDistributionChartProps {
  data: TagStats[]
}

export const TagDistributionChart = ({ data }: TagDistributionChartProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Distribuzione per Tag</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="tag"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={TAG_COLORS[index % TAG_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} sezioni`, name]}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 flex flex-col justify-center">
            {data.map((stat, index) => (
              <div key={stat.tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: TAG_COLORS[index % TAG_COLORS.length] }} />
                  <span className="text-sm font-medium">{stat.tag}</span>
                  <span className="text-xs text-muted-foreground">({stat.count} sez.)</span>
                </div>
                <span className="font-semibold text-sm">
                  € {stat.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nessun tag trovato. Aggiungi tag alle sezioni dei preventivi per vedere le statistiche.
        </div>
      )}
    </CardContent>
  </Card>
)
