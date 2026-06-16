import { useMemo } from "react"
import type { Quote } from "@/hooks/useQuotes"
import type { ThicknessCost } from "@/components/dashboard/ThicknessCostChart"
import type { TagStats } from "@/components/dashboard/TagDistributionChart"
import { median } from "@/utils/quoteCalculations"

export const useDashboardStats = (quotes: Quote[]) => {
  const recentQuotes = useMemo(() =>
    [...quotes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10),
    [quotes]
  )

  const monthlyData = useMemo(() => {
    const monthMap: { [key: string]: { value: number; count: number } } = {}
    quotes.forEach(quote => {
      const date = new Date(quote.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap[monthKey]) monthMap[monthKey] = { value: 0, count: 0 }
      monthMap[monthKey].value += quote.total_amount || 0
      monthMap[monthKey].count += 1
    })
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, data]) => {
        const [year, month] = key.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return { month: date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }), valore: Math.round(data.value), count: data.count }
      })
  }, [quotes])

  const thicknessCosts = useMemo(() => {
    const thicknessMap: { [key: number]: { pietra: number[]; rischio: number[]; finitura: number[]; total: number[]; totalMq: number } } = {}
    quotes.forEach(quote => {
      const sections = quote.sections as any[]
      if (!Array.isArray(sections)) return
      sections.forEach(section => {
        const items = section.items as any[]
        if (!Array.isArray(items)) return
        const pietra = items.find(item => item.category === "PIETRA")
        if (!pietra) return
        const spMatch = pietra.productName?.match(/Sp\.\s*(\d+)\s*mm/i)
        const spessore = spMatch ? parseInt(spMatch[1]) : null
        if (!spessore) return
        let mqReali = section.mqTotali as number | undefined
        if (!mqReali || mqReali <= 0) {
          const secondoTaglio = items.find(item => item.productName?.toLowerCase().includes("2° taglio"))
          mqReali = secondoTaglio?.quantity ?? pietra?.quantity ?? 0
        }
        if (!mqReali || mqReali <= 0) return
        const pietraLavorazioni = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
        const risks = section.risks as any[]
        let rischio = 0
        if (Array.isArray(risks)) {
          risks.forEach((risk: any) => {
            const percentage = risk.percentage || 0
            if (risk.appliedToItemId === 'SECTION_TOTAL') {
              rischio += (pietraLavorazioni * percentage) / 100
            } else {
              const targetItem = items.find((item: any) => item.id === risk.appliedToItemId)
              if (targetItem) rischio += ((targetItem.total || 0) * percentage) / 100
            }
          })
        }
        const finitura = (section.engobbio || 0) + (section.finitura || 0)
        const sectionQty = section.quantity || 1
        if (!thicknessMap[spessore]) thicknessMap[spessore] = { pietra: [], rischio: [], finitura: [], total: [], totalMq: 0 }
        thicknessMap[spessore].pietra.push(pietraLavorazioni / mqReali)
        thicknessMap[spessore].rischio.push(rischio / mqReali)
        thicknessMap[spessore].finitura.push(finitura / mqReali)
        thicknessMap[spessore].total.push((pietraLavorazioni + rischio + finitura) / mqReali)
        thicknessMap[spessore].totalMq += mqReali * sectionQty
      })
    })
    return Object.entries(thicknessMap)
      .map(([thickness, data]): ThicknessCost => ({
        thickness: parseInt(thickness),
        label: `${thickness} mm`,
        avgPietraPerMq: median(data.pietra),
        avgRischioPerMq: median(data.rischio),
        avgFinituraPerMq: median(data.finitura),
        averageCostPerMq: median(data.total),
        sectionCount: data.total.length,
        totalMq: data.totalMq
      }))
      .sort((a, b) => a.thickness - b.thickness)
  }, [quotes])

  const topThicknessesAndWorks = useMemo(() => {
    const thicknessCount: { [key: string]: number } = {}
    const workCount: { [key: string]: number } = {}
    quotes.forEach(quote => {
      const sections = quote.sections as any[]
      if (!Array.isArray(sections)) return
      sections.forEach(section => {
        const items = section.items as any[]
        if (!Array.isArray(items)) return
        const sectionQty = section.quantity || 1
        items.forEach((item: any) => {
          const spMatch = item.productName?.match(/Sp\.?\s*(\d+)\s*(?:mm)?/i)
          if (spMatch) {
            const key = `${spMatch[1]} mm`
            thicknessCount[key] = (thicknessCount[key] || 0) + sectionQty
          }
          if (item.productName && item.category !== "Calcolatore Pietra" && !item.productName.match(/^PIETRA/i)) {
            workCount[item.productName] = (workCount[item.productName] || 0) + sectionQty
          }
        })
      })
    })
    return {
      topThicknesses: Object.entries(thicknessCount).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count })),
      topWorks: Object.entries(workCount).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count }))
    }
  }, [quotes])

  const tagStats = useMemo(() => {
    const tagMap: { [key: string]: { count: number; totalValue: number } } = {}
    quotes.forEach(quote => {
      const sections = quote.sections as any[]
      if (!Array.isArray(sections)) return
      sections.forEach(section => {
        const tags = section.tags as string[]
        if (!Array.isArray(tags)) return
        const sectionTotal = section.total || 0
        const sectionQty = section.quantity || 1
        tags.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = { count: 0, totalValue: 0 }
          tagMap[tag].count += sectionQty
          tagMap[tag].totalValue += sectionTotal * sectionQty
        })
      })
    })
    return Object.entries(tagMap)
      .map(([tag, data]): TagStats => ({ tag, count: data.count, totalValue: data.totalValue }))
      .sort((a, b) => b.count - a.count)
  }, [quotes])

  return { recentQuotes, monthlyData, thicknessCosts, topThicknessesAndWorks, tagStats }
}
