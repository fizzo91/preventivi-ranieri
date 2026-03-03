import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from "recharts"
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
 
const TAG_COLORS = [
  'hsl(var(--primary))', '#f97316', '#22c55e', '#8b5cf6', '#ec4899',
  '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#6366f1'
]

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
    const monthMap: { [key: string]: { value: number; count: number } } = {}
    
    quotes.forEach(quote => {
      const date = new Date(quote.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { value: 0, count: 0 }
      }
      monthMap[monthKey].value += quote.total_amount || 0
      monthMap[monthKey].count += 1
    })

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, data]) => {
        const [year, month] = key.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return {
          month: date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
          valore: Math.round(data.value),
          count: data.count
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

   // Top 5 spessori e lavorazioni
   const topThicknessesAndWorks = useMemo(() => {
     const thicknessCount: { [key: string]: number } = {}
     const workCount: { [key: string]: number } = {}

     quotes.forEach(quote => {
       const sections = quote.sections as any[]
       if (!Array.isArray(sections)) return

       sections.forEach(section => {
         const items = section.items as any[]
         if (!Array.isArray(items)) return
         const sectionQty = section.quantity || 1

         items.forEach((item: any) => {
           // Spessori: cerca pattern "Sp. XX mm" o "SP. XX"
           const spMatch = item.productName?.match(/Sp\.?\s*(\d+)\s*(?:mm)?/i)
           if (spMatch) {
             const key = `${spMatch[1]} mm`
             thicknessCount[key] = (thicknessCount[key] || 0) + sectionQty
           }

           // Lavorazioni: tutti i prodotti non-pietra con categoria diversa da "Calcolatore Pietra"
           if (item.productName && item.category !== "Calcolatore Pietra" && !item.productName.match(/^PIETRA/i)) {
             workCount[item.productName] = (workCount[item.productName] || 0) + sectionQty
           }
         })
       })
     })

     const topThicknesses = Object.entries(thicknessCount)
       .sort(([, a], [, b]) => b - a)
       .slice(0, 5)
       .map(([name, count]) => ({ name, count }))

     const topWorks = Object.entries(workCount)
       .sort(([, a], [, b]) => b - a)
       .slice(0, 5)
       .map(([name, count]) => ({ name, count }))

     return { topThicknesses, topWorks }
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
                  formatter={(value: number, name: string) => {
                    if (name === 'valore') return [`€ ${value.toLocaleString('it-IT')}`, 'Valore']
                    return [value, 'Preventivi']
                  }}
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
                >
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    fill="hsl(var(--muted-foreground))"
                    fontSize={12}
                    formatter={(v: number) => `${v} prev.`}
                  />
                </Bar>
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

      {/* Top 5 Spessori e Lavorazioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Spessori</CardTitle>
          </CardHeader>
          <CardContent>
            {topThicknessesAndWorks.topThicknesses.length > 0 ? (
              <div className="space-y-3">
                {topThicknessesAndWorks.topThicknesses.map((item, index) => {
                  const maxCount = topThicknessesAndWorks.topThicknesses[0].count
                  const percentage = (item.count / maxCount) * 100
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">{index + 1}.</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} sezioni</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
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

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Lavorazioni</CardTitle>
          </CardHeader>
          <CardContent>
            {topThicknessesAndWorks.topWorks.length > 0 ? (
              <div className="space-y-3">
                {topThicknessesAndWorks.topWorks.map((item, index) => {
                  const maxCount = topThicknessesAndWorks.topWorks[0].count
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
                        <div
                          className="h-full bg-secondary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
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
      </div>

       <Card>
         <CardHeader>
           <CardTitle>Distribuzione per Tag</CardTitle>
         </CardHeader>
         <CardContent>
           {tagStats.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={tagStats}
                     dataKey="count"
                     nameKey="tag"
                     cx="50%"
                     cy="50%"
                     outerRadius={100}
                     label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                     labelLine={false}
                   >
                     {tagStats.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={TAG_COLORS[index % TAG_COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip
                     formatter={(value: number, name: string) => [`${value} sezioni`, name]}
                     contentStyle={{
                       backgroundColor: 'hsl(var(--background))',
                       border: '1px solid hsl(var(--border))',
                       borderRadius: '8px'
                     }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               <div className="space-y-3 flex flex-col justify-center">
                 {tagStats.map((stat, index) => (
                   <div key={stat.tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                     <div className="flex items-center gap-2">
                       <div
                         className="h-3 w-3 rounded-full shrink-0"
                         style={{ backgroundColor: TAG_COLORS[index % TAG_COLORS.length] }}
                       />
                       <span className="text-sm font-medium">{stat.tag}</span>
                       <span className="text-xs text-muted-foreground">
                         ({stat.count} {stat.count === 1 ? 'sez.' : 'sez.'})
                       </span>
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
