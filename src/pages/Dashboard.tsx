import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calculator, TrendingUp, Clock } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const Dashboard = () => {
  const [quotes, setQuotes] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    // Carica preventivi dal localStorage
    const savedQuotes = JSON.parse(localStorage.getItem('quotes') || '[]')
    setQuotes(savedQuotes)

    // Analizza e calcola i totali per categoria
    const totals = {
      pietra: 0,
      rischio: 0,
      finitura: 0
    }

    savedQuotes.forEach((quote: any) => {
      if (quote.sections) {
        quote.sections.forEach((section: any) => {
          // Somma TUTTI gli item come PIETRA
          if (section.items) {
            section.items.forEach((item: any) => {
              totals.pietra += item.total || 0
            })
          }

          // Somma i rischi applicati
          if (section.risks) {
            section.risks.forEach((risk: any) => {
              totals.rischio += risk.amount || 0
            })
          }

          // Somma le finiture
          totals.finitura += section.finitura || 0
        })
      }
    })

    setCategoryData([
      { name: 'PIETRA', value: totals.pietra, fill: 'hsl(var(--chart-1))' },
      { name: 'RISCHIO APPLICATO', value: totals.rischio, fill: 'hsl(var(--chart-3))' },
      { name: 'FINITURA', value: totals.finitura, fill: 'hsl(var(--chart-4))' }
    ])
  }, [])

  // Dati mock per la demo
  const stats = [
    {
      title: "Preventivi Questo Mese",
      value: "12",
      icon: FileText,
      trend: "+20%",
      color: "text-primary"
    },
    {
      title: "Valore Totale",
      value: "€ 24.500",
      icon: Calculator,
      trend: "+15%",
      color: "text-success"
    },
    {
      title: "Tasso Conversione",
      value: "68%",
      icon: TrendingUp,
      trend: "+5%",
      color: "text-warning"
    },
    {
      title: "In Attesa",
      value: "5",
      icon: Clock,
      trend: "-2",
      color: "text-muted-foreground"
    }
  ]

  // Ordina i preventivi dal più recente al più vecchio e prende i primi 3
  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Panoramica della tua attività preventivi
          </p>
        </div>
        <Link to="/new-quote">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Preventivo
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
        <CardHeader>
          <CardTitle>Analisi per Categoria</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribuzione dei valori totali da tutti i preventivi
          </p>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 && categoryData.some(d => d.value > 0) ? (
            <ChartContainer
              config={{
                value: {
                  label: "Valore",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile. Crea dei preventivi per visualizzare l'analisi.
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
                <div key={quote.number} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {quote.client.name} {quote.client.company && `• ${quote.client.company}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(quote.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-success">
                      € {quote.totalAmount?.toFixed(2) || '0.00'}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/new-quote">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Crea Preventivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Inizia un nuovo preventivo per un cliente
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/products">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-success" />
                Gestisci Prodotti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aggiungi o modifica i tuoi prodotti e servizi
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/clients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                Archivio Clienti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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