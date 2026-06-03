import { useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"

export interface ThicknessAverage {
  thickness: number
  avgCostPerMq: number
  sectionCount: number
}

export function useThicknessAverages() {
  const { data: quotes = [] } = useQuotes()

  const averages = useMemo(() => {
    const map: { [key: number]: { totalCost: number; totalMq: number; count: number } } = {}

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
        const sectionQty = section.quantity || 1

        if (!map[spessore]) map[spessore] = { totalCost: 0, totalMq: 0, count: 0 }
        map[spessore].totalCost += totalCost * sectionQty
        map[spessore].totalMq += mqReali * sectionQty
        map[spessore].count += sectionQty
      })
    })

    const result: { [thickness: number]: ThicknessAverage } = {}
    Object.entries(map).forEach(([t, data]) => {
      const thickness = parseInt(t)
      result[thickness] = {
        thickness,
        avgCostPerMq: data.totalMq > 0 ? data.totalCost / data.totalMq : 0,
        sectionCount: data.count
      }
    })
    return result
  }, [quotes])

  return averages
}
