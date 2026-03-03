import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Ruler, Scale } from "lucide-react"
import { ImperialConverter } from "@/components/ImperialConverter"

const upcomingTools = [
  {
    title: "Calcolatore Peso",
    description: "Stima il peso della pietra lavica in base a dimensioni, spessore e densità.",
    icon: Scale,
  },
  {
    title: "Calcolatore Dimensioni",
    description: "Calcola tagli, sfridi e ottimizzazione lastre per ridurre gli scarti.",
    icon: Ruler,
  },
]

const Tools = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Strumenti</h1>
        <p className="text-muted-foreground mt-1">
          Calcolatrici, convertitori e utilità per la lavorazione della pietra lavica.
        </p>
      </div>

      {/* Active Tools */}
      <ImperialConverter />

      {/* Upcoming Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingTools.map((tool) => (
          <Card key={tool.title} className="relative opacity-60">
            <div className="absolute top-3 right-3 text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded">
              Prossimamente
            </div>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <tool.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Tools
