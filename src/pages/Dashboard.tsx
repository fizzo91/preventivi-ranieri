import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
 import { Badge } from "@/components/ui/badge"

interface ThicknessCost {
  thickness: number;
  label: string;
  avgPietraPerMq: number;
  avgRischioPerMq: number;
  avgFinituraPerMq: number;
  averageCostPerMq: number;
  sectionCount: number;
  totalMq: number;
}

 interface TagStats {
   tag: string;
   count: number;
   totalValue: number;
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
    const thicknessMap: { [key: number]: { totalPietra: number; totalRischio: number; totalFinitura: number; totalMq: number; count: number } } = {}

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

        // Fallback mq: mqTotali > 2° taglio > pietra
        let mqReali = section.mqTotali as number | undefined
        if (!mqReali || mqReali <= 0) {
          const secondoTaglio = items.find(item =>
            item.productName?.toLowerCase().includes("2° taglio") ||
            item.productName?.toLowerCase().includes("2° taglio")
          )
          mqReali = secondoTaglio?.quantity ?? pietra?.quantity ?? 0
        }
        if (!mqReali || mqReali <= 0) return

        // Pietra e Lavorazioni = somma di tutti item.total
        const pietraLavorazioni = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

        // Rischio = somma costi dai risks
        const risks = section.risks as any[]
        const itemsTotal = pietraLavorazioni
        let rischio = 0
        if (Array.isArray(risks)) {
          risks.forEach((risk: any) => {
            const percentage = risk.percentage || 0
            if (risk.appliedToItemId === 'SECTION_TOTAL') {
              rischio += (itemsTotal * percentage) / 100
            } else {
              const targetItem = items.find((item: any) => item.id === risk.appliedToItemId)
              if (targetItem) {
                rischio += ((targetItem.total || 0) * percentage) / 100
              }
            }
          })
        }

        // Finitura = engobbio + finitura
        const finitura = (section.engobbio || 0) + (section.finitura || 0)

        const sectionQty = section.quantity || 1

        if (!thicknessMap[spessore]) {
          thicknessMap[spessore] = { totalPietra: 0, totalRischio: 0, totalFinitura: 0, totalMq: 0, count: 0 }
        }
        thicknessMap[spessore].totalPietra += pietraLavorazioni * sectionQty
        thicknessMap[spessore].totalRischio += rischio * sectionQty
        thicknessMap[spessore].totalFinitura += finitura * sectionQty
        thicknessMap[spessore].totalMq += mqReali * sectionQty
        thicknessMap[spessore].count += sectionQty
      })
    })

    const result: ThicknessCost[] = Object.entries(thicknessMap)
      .map(([thickness, data]) => ({
        thickness: parseInt(thickness),
        label: `${thickness} mm`,
        avgPietraPerMq: data.totalMq > 0 ? data.totalPietra / data.totalMq : 0,
        avgRischioPerMq: data.totalMq > 0 ? data.totalRischio / data.totalMq : 0,
        avgFinituraPerMq: data.totalMq > 0 ? data.totalFinitura / data.totalMq : 0,
        averageCostPerMq: data.totalMq > 0 ? (data.totalPietra + data.totalRischio + data.totalFinitura) / data.totalMq : 0,
        sectionCount: data.count,
        totalMq: data.totalMq
      }))
      .sort((a, b) => a.thickness - b.thickness)

    return result
  }, [quotes])

   // Calcola statistiche per tag
   const tagStats = useMemo(() => {
     const tagMap: { [key: string]: { count: number; totalValue: number } } = {}
 
     quotes.forEach(quote => {
       const sections = quote.sections as any[]
       if (!Array.isArray(sections)) return
 
       sections.forEach(section => {
         const tags = section.tags as string[]
         if (!Array.isArray(tags)) return
 
         const sectionTotal = section.total || 0
 
         tags.forEach(tag => {
           if (!tagMap[tag]) {
             tagMap[tag] = { count: 0, totalValue: 0 }
           }
          const sectionQty = section.quantity || 1
          tagMap[tag].count += sectionQty
          tagMap[tag].totalValue += sectionTotal * sectionQty
         })
       })
     })
 
     // Converti in array e ordina per conteggio
     const result: TagStats[] = Object.entries(tagMap)
       .map(([tag, data]) => ({
         tag,
         count: data.count,
         totalValue: data.totalValue
       }))
       .sort((a, b) => b.count - a.count)
 
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
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ThicknessCost
                      const fmt = (v: number) => `€ ${v.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg space-y-1">
                          <p className="font-semibold">{label}</p>
                          <p style={{ color: 'hsl(var(--primary))' }}>Pietra e Lavorazioni: {fmt(data.avgPietraPerMq)}/mq</p>
                          <p style={{ color: '#f97316' }}>Rischio: {fmt(data.avgRischioPerMq)}/mq</p>
                          <p style={{ color: '#22c55e' }}>Finitura: {fmt(data.avgFinituraPerMq)}/mq</p>
                          <p className="font-semibold border-t pt-1 mt-1">Totale: {fmt(data.averageCostPerMq)}/mq</p>
                          <p className="text-sm text-muted-foreground">{data.sectionCount} sezioni, {data.totalMq.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mq</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="avgPietraPerMq" stackId="cost" fill="hsl(var(--primary))" name="Pietra e Lavorazioni" radius={[0, 0, 0, 0]} />
                <Bar dataKey="avgRischioPerMq" stackId="cost" fill="#f97316" name="Rischio" radius={[0, 0, 0, 0]} />
                <Bar dataKey="avgFinituraPerMq" stackId="cost" fill="#22c55e" name="Finitura" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nessun dato disponibile. Crea preventivi con prodotti PIETRA per vedere le statistiche.
            </div>
          )}
        </CardContent>
      </Card>

       {/* Tag Statistics */}
       <Card>
         <CardHeader>
           <CardTitle>Statistiche per Tag</CardTitle>
         </CardHeader>
         <CardContent>
           {tagStats.length > 0 ? (
             <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {tagStats.slice(0, 9).map((stat) => (
                   <div key={stat.tag} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                     <div className="flex items-center gap-2">
                       <Badge variant="secondary">{stat.tag}</Badge>
                       <span className="text-sm text-muted-foreground">
                         {stat.count} {stat.count === 1 ? 'sezione' : 'sezioni'}
                       </span>
                     </div>
                     <span className="font-semibold text-primary">
                       € {stat.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                   </div>
                 ))}
               </div>
               {tagStats.length > 9 && (
                 <p className="text-sm text-muted-foreground text-center">
                   +{tagStats.length - 9} altri tag
                 </p>
               )}
             </div>
           ) : (
             <div className="text-center py-8 text-muted-foreground">
               Nessun tag trovato. Aggiungi tag alle sezioni dei preventivi per vedere le statistiche.
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
