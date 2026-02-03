import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ThicknessCost {
  thickness: number;
  label: string;
  averageCostPerMq: number;
  sectionCount: number;
  totalMq: number;
}

const Dashboard = () => {
  const { data: quotes = [], isLoading } = useQuotes()

  // Ordina i preventivi dal più recente al più vecchio e prende i primi 10
  const recentQuotes = useMemo(() => 
    [...quotes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
    [quotes]
  )

  // Raggruppa preventivi per mese per il grafico
  const monthlyData = useMemo(() => {
    const monthMap: { [key: string]: number } = {}
    
    quotes.forEach(quote => {
      const date = new Date(quote.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = 0
      }
      monthMap[monthKey] += quote.total_amount || 0
    })

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key]) => {
        const [year, month] = key.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return {
          month: date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
          valore: Math.round(monthMap[key])
        }
      })
  }, [quotes])

  // Calcola i costi medi per spessore
  const thicknessCosts = useMemo(() => {
    const thicknessMap: { [key: number]: { totalCost: number; totalMq: number; count: number } } = {}

    quotes.forEach(quote => {
      const sections = quote.sections as any[]
      if (!Array.isArray(sections)) return

      sections.forEach(section => {
        const items = section.items as any[]
        if (!Array.isArray(items)) return

        // Trova il prodotto PIETRA
        const pietra = items.find(item => item.category === "PIETRA")
        if (!pietra) return

        // Estrai spessore dal nome della pietra
        const spMatch = pietra.productName?.match(/Sp\.\s*(\d+)\s*mm/i)
        const spessore = spMatch ? parseInt(spMatch[1]) : null
        if (!spessore) return

        // Cerca la voce "2° taglio"
        const secondoTaglio = items.find(item => 
          item.productName?.toLowerCase().includes("2° taglio") || 
          item.productName?.toLowerCase().includes("2° taglio")
        )

        // mq reali = 2° taglio se presente, altrimenti pietra
        const mqReali = secondoTaglio?.quantity ?? pietra?.quantity ?? 0
        if (mqReali <= 0) return

        // Calcola il totale della sezione
        const sectionTotal = section.total || 0
        if (sectionTotal <= 0) return

        // Aggiungi ai dati raggruppati
        if (!thicknessMap[spessore]) {
          thicknessMap[spessore] = { totalCost: 0, totalMq: 0, count: 0 }
        }
        thicknessMap[spessore].totalCost += sectionTotal
        thicknessMap[spessore].totalMq += mqReali
        thicknessMap[spessore].count += 1
      })
    })

    // Converti in array e calcola medie
    const result: ThicknessCost[] = Object.entries(thicknessMap)
      .map(([thickness, data]) => ({
        thickness: parseInt(thickness),
        label: `${thickness} mm`,
        averageCostPerMq: data.totalMq > 0 ? data.totalCost / data.totalMq : 0,
        sectionCount: data.count,
        totalMq: data.totalMq
      }))
      .sort((a, b) => a.thickness - b.thickness)

    return result
  }, [quotes])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <Link to="/new-quote">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Preventivo
          </Button>
        </Link>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Valore Preventivi per Mese</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `€${value.toLocaleString('it-IT')}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`€ ${value.toLocaleString('it-IT')}`, 'Valore']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="valore" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nessun dato disponibile per il grafico
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thickness Costs Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Costo Medio per Spessore (€/mq)</CardTitle>
        </CardHeader>
        <CardContent>
          {thicknessCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, thicknessCosts.length * 50)}>
              <BarChart 
                data={thicknessCosts} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `€${value.toLocaleString('it-IT')}`}
                />
                <YAxis 
                  type="category"
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [`€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Costo medio/mq']}
                  labelFormatter={(label) => `Spessore: ${label}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ThicknessCost
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{label}</p>
                          <p className="text-primary">€ {data.averageCostPerMq.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mq</p>
                          <p className="text-sm text-muted-foreground">{data.sectionCount} sezioni</p>
                          <p className="text-sm text-muted-foreground">{data.totalMq.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mq totali</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="averageCostPerMq" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nessun dato disponibile. Crea preventivi con prodotti PIETRA per vedere le statistiche.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Preventivi Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuotes.length > 0 ? (
              recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{quote.quote_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.client_name} {quote.client_company && `• ${quote.client_company}`}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-success">
                      € {quote.total_amount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">{quote.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nessun preventivo disponibile. Crea il tuo primo preventivo!
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link to="/quotes">
              <Button variant="outline">Vedi Tutti i Preventivi</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
