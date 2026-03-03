import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Ruler, Scale, ArrowRightLeft } from "lucide-react"

const tools = [
  {
    title: "Calcolatore Pietra",
    description: "Calcola quantità e costi per la pietra lavica in base a dimensioni e spessore.",
    icon: Calculator,
    available: true,
    link: "/new-quote"
  },
  {
    title: "Convertitore Unità",
    description: "Converti tra mq, ml, cm², pollici e altre unità di misura.",
    icon: ArrowRightLeft,
    available: false,
  },
  {
    title: "Calcolatore Peso",
    description: "Stima il peso della pietra lavica in base a dimensioni, spessore e densità.",
    icon: Scale,
    available: false,
  },
  {
    title: "Calcolatore Dimensioni",
    description: "Calcola tagli, sfridi e ottimizzazione lastre per ridurre gli scarti.",
    icon: Ruler,
    available: false,
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Card
            key={tool.title}
            className={`relative ${!tool.available ? 'opacity-60' : 'hover:shadow-md transition-shadow cursor-pointer'}`}
          >
            {!tool.available && (
              <div className="absolute top-3 right-3 text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded">
                Prossimamente
              </div>
            )}
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
