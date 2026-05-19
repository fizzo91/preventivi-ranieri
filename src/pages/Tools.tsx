import { useState } from "react"
import { Ruler, Scale, ArrowRightLeft, Circle, FileText, BookOpen, Bath, UserSearch, Calculator } from "lucide-react"
import { ToolFloatingWindow } from "@/components/ToolFloatingWindow"
import { ImperialConverter } from "@/components/ImperialConverter"
import { CircleCalculator } from "@/components/CircleCalculator"
import { DescriptionAssistant } from "@/components/DescriptionAssistant"
import { Glossary } from "@/components/Glossary"
import { VanityCalculator } from "@/components/VanityCalculator"
import { ClientResearch } from "@/components/ClientResearch"
import { ScientificCalculator } from "@/components/ScientificCalculator"

type ToolId =
  | "imperial"
  | "circle"
  | "descriptions"
  | "glossary"
  | "vanity"
  | "client-research"
  | "calculator"

interface ToolDef {
  id: ToolId | "weight" | "dimensions"
  title: string
  subtitle: string
  icon: typeof Ruler
  available: boolean
  gradient: string
  shadow: string
  width?: number
  height?: number
}

const tools: ToolDef[] = [
  { id: "imperial", title: "Convertitore", subtitle: "Pollici → mm", icon: ArrowRightLeft, available: true, gradient: "from-blue-500 to-cyan-400", shadow: "shadow-blue-500/25", width: 520, height: 560 },
  { id: "circle", title: "Cerchi", subtitle: "Area e Circ.", icon: Circle, available: true, gradient: "from-violet-500 to-purple-400", shadow: "shadow-violet-500/25", width: 520, height: 560 },
  { id: "descriptions", title: "Descrizioni", subtitle: "Assistente AI", icon: FileText, available: true, gradient: "from-orange-500 to-amber-400", shadow: "shadow-orange-500/25", width: 720, height: 640 },
  { id: "glossary", title: "Glossario", subtitle: "Terminologia", icon: BookOpen, available: true, gradient: "from-amber-500 to-yellow-400", shadow: "shadow-amber-500/25", width: 720, height: 640 },
  { id: "vanity", title: "Vanity", subtitle: "Stima Costi", icon: Bath, available: true, gradient: "from-teal-500 to-emerald-400", shadow: "shadow-teal-500/25", width: 720, height: 640 },
  { id: "client-research", title: "Ricerca Cliente", subtitle: "Info AI", icon: UserSearch, available: true, gradient: "from-rose-500 to-pink-400", shadow: "shadow-rose-500/25", width: 720, height: 640 },
  { id: "calculator", title: "Calcolatrice", subtitle: "Scientifica", icon: Calculator, available: true, gradient: "from-indigo-500 to-blue-400", shadow: "shadow-indigo-500/25", width: 640, height: 680 },
  { id: "weight", title: "Peso", subtitle: "Calcolatore", icon: Scale, available: false, gradient: "from-emerald-500 to-green-400", shadow: "shadow-emerald-500/25" },
  { id: "dimensions", title: "Dimensioni", subtitle: "Ottimizzatore", icon: Ruler, available: false, gradient: "from-emerald-500 to-green-400", shadow: "shadow-emerald-500/25" },
]

const toolTitles: Record<ToolId, string> = {
  imperial: "Convertitore Pollici/Piedi → mm",
  circle: "Calcolo Cerchi",
  descriptions: "Assistente Descrizioni",
  glossary: "Glossario Pietra",
  vanity: "Calcolo Vanity",
  "client-research": "Ricerca Cliente AI",
  calculator: "Calcolatrice Scientifica",
}

const Tools = () => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)

  const renderTool = (id: ToolId) => {
    switch (id) {
      case "imperial": return <ImperialConverter />
      case "circle": return <CircleCalculator />
      case "descriptions": return <DescriptionAssistant />
      case "glossary": return <Glossary />
      case "vanity": return <VanityCalculator />
      case "client-research": return <ClientResearch />
      case "calculator": return <ScientificCalculator />
    }
  }

  const activeDef = activeTool ? tools.find((t) => t.id === activeTool) : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Strumenti</h1>
        <p className="text-muted-foreground mt-1">
          Tocca uno strumento per aprirlo in una finestra flottante.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            disabled={!tool.available}
            onClick={() => tool.available && setActiveTool(tool.id as ToolId)}
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
              <div className="text-sm font-semibold text-foreground leading-tight">{tool.title}</div>
              <div className="text-[11px] text-muted-foreground">{tool.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <ToolFloatingWindow
        open={!!activeTool}
        onClose={() => setActiveTool(null)}
        title={activeTool ? toolTitles[activeTool] : ""}
        defaultWidth={activeDef?.width ?? 720}
        defaultHeight={activeDef?.height ?? 600}
      >
        {activeTool && renderTool(activeTool)}
      </ToolFloatingWindow>
    </div>
  )
}

export default Tools
