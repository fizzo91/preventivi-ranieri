import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts"

interface MonthlyChartProps {
  data: { month: string; valore: number; count: number }[]
}

export const MonthlyChart = ({ data }: MonthlyChartProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Valore Preventivi per Mese</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `€${value.toLocaleString('it-IT')}`} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'valore') return [`€ ${value.toLocaleString('it-IT')}`, 'Valore']
                return [value, 'Preventivi']
              }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            />
            <Bar dataKey="valore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="count" position="top" fill="hsl(var(--muted-foreground))" fontSize={12} formatter={(v: number) => `${v} prev.`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-8 text-muted-foreground">Nessun dato disponibile per il grafico</div>
      )}
    </CardContent>
  </Card>
)
