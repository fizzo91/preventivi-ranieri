import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calculator, TrendingUp, Clock } from "lucide-react"
import { Link } from "react-router-dom"

const Dashboard = () => {
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

  const recentQuotes = [
    { id: 1, client: "Rossi S.r.l.", value: "€ 2.500", status: "In attesa", date: "15/01/2025" },
    { id: 2, client: "Tech Solutions", value: "€ 4.200", status: "Approvato", date: "14/01/2025" },
    { id: 3, client: "Verde Costruzioni", value: "€ 1.800", status: "Bozza", date: "13/01/2025" },
  ]

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

      {/* Recent Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Preventivi Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{quote.client}</p>
                  <p className="text-sm text-muted-foreground">{quote.date}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-success">{quote.value}</p>
                  <p className="text-sm text-muted-foreground">{quote.status}</p>
                </div>
              </div>
            ))}
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