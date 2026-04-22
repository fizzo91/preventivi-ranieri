import { useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"
import type { QuoteSection, QuoteItem } from "@/types/quote"
import {
  calculateItemsTotal,
  calculateRisksTotal,
  extractThickness,
  findPietraItem,
  getSectionMq,
} from "@/utils/quoteCalculations"

export interface ThicknessAverage {
  thickness: number
  avgCostPerMq: number
  sectionCount: number
}

interface ThicknessAccumulator {
  totalCost: number
  totalMq: number
  count: number
}

export function useThicknessAverages() {
  const { data: quotes = [] } = useQuotes()

  const averages = useMemo(() => {
    const accByThickness = new Map<number, ThicknessAccumulator>()

    quotes.forEach((quote) => {
      const sections = quote.sections as QuoteSection[] | undefined
      if (!Array.isArray(sections)) return

      sections.forEach((section) => {
        const items = section.items as QuoteItem[] | undefined
        if (!Array.isArray(items)) return

        const pietra = findPietraItem(items)
        if (!pietra) return

        const thickness = extractThickness(pietra.productName)
        if (!thickness) return

        const mqReali = getSectionMq(section, items)
        if (mqReali <= 0) return

        const itemsTotal = calculateItemsTotal(items)
        const rischio = calculateRisksTotal(section.risks ?? [], items)
        const finiture = (section.engobbio || 0) + (section.finitura || 0)
        const totalCost = itemsTotal + rischio + finiture
        const sectionQty = section.quantity || 1

        const acc = accByThickness.get(thickness) ?? { totalCost: 0, totalMq: 0, count: 0 }
        acc.totalCost += totalCost * sectionQty
        acc.totalMq += mqReali * sectionQty
        acc.count += sectionQty
        accByThickness.set(thickness, acc)
      })
    })

    const result: Record<number, ThicknessAverage> = {}
    accByThickness.forEach((data, thickness) => {
      result[thickness] = {
        thickness,
        avgCostPerMq: data.totalMq > 0 ? data.totalCost / data.totalMq : 0,
        sectionCount: data.count,
      }
    })
    return result
  }, [quotes])

  return averages
}
