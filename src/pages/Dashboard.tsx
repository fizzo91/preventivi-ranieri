import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calculator, TrendingUp, Clock, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useMemo } from "react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { useQuotes } from "@/hooks/useQuotes"

const Dashboard = () => {
  const { data: quotes = [], isLoading } = useQuotes()

  const categoryData = useMemo(() => {
    const totals = {
      pietra: 0,
      rischio: 0,
      finitura: 0
    }

    quotes.forEach((quote: any) => {
      if (quote.sections && Array.isArray(quote.sections)) {
        quote.sections.forEach((section: any) => {
          // Somma TUTTI gli item come PIETRA
          if (section.items && Array.isArray(section.items)) {
            section.items.forEach((item: any) => {
              totals.pietra += item.total || 0
            })
          }

          // Somma i rischi applicati
          if (section.risks && Array.isArray(section.risks)) {
            section.risks.forEach((risk: any) => {
              totals.rischio += risk.amount || 0
            })
          }

          // Somma le finiture
          totals.finitura += section.finitura || 0
        })
      }
    })

    return [
      { name: 'PIETRA', value: totals.pietra, fill: 'hsl(var(--chart-1))' },
      { name: 'RISCHIO APPLICATO', value: totals.rischio, fill: 'hsl(var(--chart-3))' },
      { name: 'FINITURA', value: totals.finitura, fill: 'hsl(var(--chart-4))' }
    ]
  }, [quotes])

  const stats = [
    {
      title: "Preventivi Totali",
      value: quotes.length.toString(),
      icon: FileText,
      trend: "+20%",
      color: "text-primary"
    },
    {
      title: "Valore Totale",
      value: `€ ${quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0).toFixed(0)}`,
      icon: Calculator,
      trend: "+15%",
      color: "text-success"
    },
    {
      title: "Bozze",
      value: quotes.filter(q => q.status === 'draft').length.toString(),
      icon: TrendingUp,
      trend: "+5%",
      color: "text-warning"
    },
    {
      title: "Inviati",
      value: quotes.filter(q => q.status === 'sent').length.toString(),
      icon: Clock,
      trend: "-2",
      color: "text-muted-foreground"
    }
  ]

  // Ordina i preventivi dal più recente al più vecchio e prende i primi 3
  const recentQuotes = useMemo(() => 
    [...quotes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3),
    [quotes]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Panoramica della tua attività preventivi
          </p>
        </div>
        <Link to="/new-quote" className="w-full sm:w-auto">
          <Button size="lg" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Nuovo Preventivo</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.trend} dal mese scorso
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Breakdown Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Analisi per Categoria</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Distribuzione dei valori totali da tutti i preventivi
          </p>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {categoryData.length > 0 && categoryData.some(d => d.value > 0) ? (
            <ChartContainer
              config={{
                value: {
                  label: "Valore",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[250px] sm:h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-[10px] sm:text-xs"
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    className="text-[10px] sm:text-xs"
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                    tickFormatter={(value) => `€${value}`}
                    width={50}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              Nessun dato disponibile. Crea dei preventivi per visualizzare l'analisi.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Preventivi Recenti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentQuotes.length > 0 ? (
            <>
              <div className="space-y-3">
                {recentQuotes.map((quote) => (
                  <div key={quote.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{quote.quote_number}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {quote.client_name} {quote.client_company && `• ${quote.client_company}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(quote.date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2 sm:space-y-1">
                      <p className="font-semibold text-sm sm:text-base text-success">
                        € {quote.total_amount?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">{quote.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-center">
                <Link to="/quotes" className="w-full sm:w-auto inline-block">
                  <Button variant="outline" className="w-full sm:w-auto">Vedi Tutti i Preventivi</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nessun preventivo disponibile. Crea il tuo primo preventivo!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/new-quote" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Crea Preventivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Inizia un nuovo preventivo per un cliente
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/products" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                Gestisci Prodotti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Aggiungi o modifica i tuoi prodotti e servizi
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/clients" className="block sm:col-span-2 lg:col-span-1">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                Archivio Clienti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visualizza e gestisci i dati dei tuoi clienti
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
