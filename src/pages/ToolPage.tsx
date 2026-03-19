import { useParams, Navigate } from "react-router-dom"
import { ImperialConverter } from "@/components/ImperialConverter"
import { FinishCalculator } from "@/components/FinishCalculator"
import { CircleCalculator } from "@/components/CircleCalculator"

const toolMeta: Record<string, { title: string }> = {
  imperial: { title: "Convertitore Pollici/Piedi → mm" },
  finish: { title: "Calcolo Finitura" },
  circle: { title: "Calcolo Cerchi" },
}

const ToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>()

  if (!toolId || !toolMeta[toolId]) {
    return <Navigate to="/tools" replace />
  }

  const renderTool = () => {
    switch (toolId) {
      case "imperial":
        return <ImperialConverter />
      case "finish":
        return <FinishCalculator />
      case "circle":
        return <CircleCalculator />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{toolMeta[toolId].title}</h1>
      </div>
      {renderTool()}
    </div>
  )
}

export default ToolPage
