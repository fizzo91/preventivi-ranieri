import { useState } from "react"
import { Calculator, Ruler, Scale, ArrowRightLeft } from "lucide-react"
import { ImperialConverter } from "@/components/ImperialConverter"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const tools = [
  {
    id: "imperial",
    title: "Convertitore",
    subtitle: "Pollici → mm",
    icon: ArrowRightLeft,
    available: true,
    gradient: "from-blue-500 to-cyan-400",
    shadow: "shadow-blue-500/25",
  },
  {
    id: "weight",
    title: "Peso",
    subtitle: "Calcolatore",
    icon: Scale,
    available: false,
    gradient: "from-amber-500 to-orange-400",
    shadow: "shadow-amber-500/25",
  },
  {
    id: "dimensions",
    title: "Dimensioni",
    subtitle: "Ottimizzatore",
    icon: Ruler,
    available: false,
    gradient: "from-emerald-500 to-green-400",
    shadow: "shadow-emerald-500/25",
  },
  {
    id: "calculator",
    title: "Calcolatrice",
    subtitle: "Prezzi",
    icon: Calculator,
    available: false,
    gradient: "from-violet-500 to-purple-400",
    shadow: "shadow-violet-500/25",
  },
]

const Tools = () => {
  const [openTool, setOpenTool] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Strumenti</h1>
        <p className="text-muted-foreground mt-1">
          Tocca uno strumento per aprirlo.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            disabled={!tool.available}
            onClick={() => tool.available && setOpenTool(tool.id)}
            className="group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none"
          >
            <div
              className={`relative w-20 h-20 rounded-[22px] bg-gradient-to-br ${tool.gradient} ${tool.shadow} shadow-lg flex items-center justify-center transition-shadow duration-200 group-hover:shadow-xl`}
            >
              <tool.icon className="h-9 w-9 text-white" strokeWidth={1.8} />
              {!tool.available && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] font-bold text-muted-foreground">🔒</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground leading-tight">
                {tool.title}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {tool.subtitle}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Imperial Converter Dialog */}
      <Dialog open={openTool === "imperial"} onOpenChange={(open) => !open && setOpenTool(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convertitore Pollici/Piedi → mm</DialogTitle>
          </DialogHeader>
          <ImperialConverter />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Tools
