import { useState } from "react"
import { useParams, useSearchParams, Navigate, useNavigate } from "react-router-dom"
import { ImperialConverter } from "@/components/ImperialConverter"
import { CircleCalculator } from "@/components/CircleCalculator"
import { DescriptionAssistant } from "@/components/DescriptionAssistant"
import { Glossary } from "@/components/Glossary"
import { VanityCalculator } from "@/components/VanityCalculator"
import { ClientResearch } from "@/components/ClientResearch"
import { ScientificCalculator } from "@/components/ScientificCalculator"
import { cn } from "@/lib/utils"
import { MacWindowBar } from "@/components/MacWindowBar"

const toolMeta: Record<string, { title: string }> = {
  imperial: { title: "Convertitore Pollici/Piedi → mm" },
  circle: { title: "Calcolo Cerchi" },
  descriptions: { title: "Assistente Descrizioni" },
  glossary: { title: "Glossario Pietra" },
  vanity: { title: "Calcolo Vanity" },
  "client-research": { title: "Ricerca Cliente AI" },
  calculator: { title: "Calcolatrice Scientifica" },
}

const ToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const quoteId = searchParams.get("quoteId")
  const quoteName = searchParams.get("quoteName")

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
      case "vanity":
        return <VanityCalculator />
      case "client-research":
        return <ClientResearch />
      case "calculator":
        return <ScientificCalculator defaultQuoteId={quoteId} defaultQuoteName={quoteName} />
      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isFullscreen ? "" : ""}`}>
      <MacWindowBar
        title={toolMeta[toolId].title + (quoteName ? ` — ${quoteName}` : "")}
        onClose={() => {
          // Se aperto in popup, prova a chiudere; altrimenti torna agli strumenti
          if (window.opener) window.close()
          else navigate("/tools")
        }}
        onMinimize={() => {
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
      <div className={cn("flex-1 p-6 mx-auto w-full space-y-6", toolId === "calculator" ? "max-w-2xl" : "max-w-lg")}>
        {renderTool()}
      </div>
    </div>
  )
}

export default ToolPage
