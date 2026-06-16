import { useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"
import { median } from "@/utils/quoteCalculations"

export interface ThicknessAverage {
  thickness: number
  avgCostPerMq: number
  sectionCount: number
}

export function useThicknessAverages() {
  const { data: quotes = [] } = useQuotes()

  const averages = useMemo(() => {
    const map: { [key: number]: number[] } = {}

    quotes.forEach(quote => {
      const sections = quote.sections as any[]
      if (!Array.isArray(sections)) return

      sections.forEach(section => {
        const items = section.items as any[]
        if (!Array.isArray(items)) return

        const pietra = items.find((item: any) => item.category === "PIETRA" || item.productName?.match(/^PIETRA/i))
        if (!pietra) return

        const spMatch = pietra.productName?.match(/Sp\.?\s*(\d+)\s*(?:mm)?/i)
        const spessore = spMatch ? parseInt(spMatch[1]) : null
        if (!spessore) return

        let mqReali = section.mqTotali as number | undefined
        if (!mqReali || mqReali <= 0) {
          const secondoTaglio = items.find((item: any) =>
            item.productName?.toLowerCase().includes("2° taglio")
          )
          mqReali = secondoTaglio?.quantity ?? pietra?.quantity ?? 0
        }
        if (!mqReali || mqReali <= 0) return

        const itemsTotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

        const risks = section.risks as any[]
        let rischio = 0
        if (Array.isArray(risks)) {
          risks.forEach((risk: any) => {
            const percentage = risk.percentage || 0
            if (risk.appliedToItemId === 'SECTION_TOTAL') {
              rischio += (itemsTotal * percentage) / 100
            } else {
              const targetItem = items.find((item: any) => item.id === risk.appliedToItemId)
              if (targetItem) rischio += ((targetItem.total || 0) * percentage) / 100
            }
          })
        }

        const finitura = (section.engobbio || 0) + (section.finitura || 0)
        const totalCost = itemsTotal + rischio + finitura
        const costPerMq = totalCost / mqReali

        if (!map[spessore]) map[spessore] = []
        map[spessore].push(costPerMq)
      })
    })

    const result: { [thickness: number]: ThicknessAverage } = {}
    Object.entries(map).forEach(([t, samples]) => {
      const thickness = parseInt(t)
      result[thickness] = {
        thickness,
        avgCostPerMq: median(samples),
        sectionCount: samples.length,
      }
    })
    return result
  }, [quotes])

  return averages
}
