import { useState } from "react"
import { useParams, Navigate } from "react-router-dom"
import { ImperialConverter } from "@/components/ImperialConverter"
import { CircleCalculator } from "@/components/CircleCalculator"
import { DescriptionAssistant } from "@/components/DescriptionAssistant"
import { Glossary } from "@/components/Glossary"
import { MacWindowBar } from "@/components/MacWindowBar"

const toolMeta: Record<string, { title: string }> = {
  imperial: { title: "Convertitore Pollici/Piedi → mm" },
  circle: { title: "Calcolo Cerchi" },
  descriptions: { title: "Assistente Descrizioni" },
  glossary: { title: "Glossario Pietra" },
}

const ToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>()
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!toolId || !toolMeta[toolId]) {
    return <Navigate to="/tools" replace />
  }

  const renderTool = () => {
    switch (toolId) {
      case "imperial":
        return <ImperialConverter />
      case "circle":
        return <CircleCalculator />
      case "descriptions":
        return <DescriptionAssistant />
      case "glossary":
        return <Glossary />
      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isFullscreen ? "" : ""}`}>
      <MacWindowBar
        title={toolMeta[toolId].title}
        onClose={() => window.close()}
        onMinimize={() => {
          // Browser popup minimize isn't reliable, but we can try
          window.resizeTo(300, 40)
        }}
        onFullscreen={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
          } else {
            document.exitFullscreen()
            setIsFullscreen(false)
          }
        }}
        isFullscreen={isFullscreen}
      />
      <div className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6">
        {renderTool()}
      </div>
    </div>
  )
}

export default ToolPage
