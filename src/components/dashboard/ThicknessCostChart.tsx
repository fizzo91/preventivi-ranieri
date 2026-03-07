import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export interface ThicknessCost {
  thickness: number
  label: string
  avgPietraPerMq: number
  avgRischioPerMq: number
  avgFinituraPerMq: number
  averageCostPerMq: number
  sectionCount: number
  totalMq: number
}

interface ThicknessCostChartProps {
  data: ThicknessCost[]
}

export const ThicknessCostChart = ({ data }: ThicknessCostChartProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Costo Medio per Spessore (€/mq)</CardTitle>
    </CardHeader>
    <CardContent>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `€${value.toLocaleString('it-IT')}`} />
            <YAxis type="category" dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickLine={{ stroke: 'hsl(var(--muted-foreground))' }} width={60} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as ThicknessCost
                  const fmt = (v: number) => `€ ${v.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg space-y-1">
                      <p className="font-semibold">{label}</p>
                      <p style={{ color: 'hsl(var(--primary))' }}>Pietra e Lavorazioni: {fmt(d.avgPietraPerMq)}/mq</p>
                      <p style={{ color: '#f97316' }}>Rischio: {fmt(d.avgRischioPerMq)}/mq</p>
                      <p style={{ color: '#22c55e' }}>Finitura: {fmt(d.avgFinituraPerMq)}/mq</p>
                      <p className="font-semibold border-t pt-1 mt-1">Totale: {fmt(d.averageCostPerMq)}/mq</p>
                      <p className="text-sm text-muted-foreground">{d.sectionCount} sezioni, {d.totalMq.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mq</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="avgPietraPerMq" stackId="cost" fill="hsl(var(--primary))" name="Pietra e Lavorazioni" />
            <Bar dataKey="avgRischioPerMq" stackId="cost" fill="#f97316" name="Rischio" />
            <Bar dataKey="avgFinituraPerMq" stackId="cost" fill="#22c55e" name="Finitura" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-8 text-muted-foreground">Nessun dato disponibile. Crea preventivi con prodotti PIETRA per vedere le statistiche.</div>
      )}
    </CardContent>
  </Card>
)
