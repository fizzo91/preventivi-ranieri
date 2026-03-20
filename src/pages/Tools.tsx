import { Ruler, Scale, ArrowRightLeft, Circle, FileText, BookOpen, Bath } from "lucide-react"
import { useNavigate } from "react-router-dom"

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
    id: "circle",
    title: "Cerchi",
    subtitle: "Area e Circ.",
    icon: Circle,
    available: true,
    gradient: "from-violet-500 to-purple-400",
    shadow: "shadow-violet-500/25",
  },
  {
    id: "descriptions",
    title: "Descrizioni",
    subtitle: "Assistente AI",
    icon: FileText,
    available: true,
    gradient: "from-orange-500 to-amber-400",
    shadow: "shadow-orange-500/25",
  },
  {
    id: "glossary",
    title: "Glossario",
    subtitle: "Terminologia",
    icon: BookOpen,
    available: true,
    gradient: "from-amber-500 to-yellow-400",
    shadow: "shadow-amber-500/25",
  },
  {
    id: "weight",
    title: "Peso",
    subtitle: "Calcolatore",
    icon: Scale,
    available: false,
    gradient: "from-emerald-500 to-green-400",
    shadow: "shadow-emerald-500/25",
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
]

const Tools = () => {
  const navigate = useNavigate()

  const handleToolClick = (toolId: string) => {
    const sizes: Record<string, [number, number]> = {
      imperial: [480, 600],
      circle: [480, 650],
      descriptions: [560, 800],
      glossary: [520, 700],
    }
    const [w, h] = sizes[toolId] || [480, 600]
    const left = (screen.width - w) / 2
    const top = (screen.height - h) / 2
    window.open(
      `/tool/${toolId}`,
      `tool-${toolId}`,
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Strumenti</h1>
        <p className="text-muted-foreground mt-1">
          Tocca uno strumento per aprirlo in una nuova finestra.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            disabled={!tool.available}
            onClick={() => tool.available && handleToolClick(tool.id)}
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
    </div>
  )
}

export default Tools
