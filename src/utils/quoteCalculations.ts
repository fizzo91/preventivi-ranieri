/**
 * Shared calculation logic for quote sections.
 * Eliminates duplication between Dashboard, useThicknessAverages, NewQuote, and PDF generator.
 */
import type { QuoteSection, QuoteItem, Risk } from '@/types/quote'

/** Calculate the total for a section's items */
export function calculateItemsTotal(items: QuoteItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0)
}

/** Calculate the total risk amount for a section */
export function calculateRisksTotal(risks: Risk[], items: QuoteItem[]): number {
  const itemsTotal = calculateItemsTotal(items)
  return risks.reduce((sum, risk) => {
    if (risk.appliedToItemId === 'SECTION_TOTAL') {
      return sum + (itemsTotal * (risk.percentage / 100))
    }
    const targetItem = items.find(item => item.id === risk.appliedToItemId)
    return sum + (targetItem ? targetItem.total * (risk.percentage / 100) : 0)
  }, 0)
}

/** Calculate the full total for a section (items + risks + engobbio + finitura) */
export function calculateSectionTotal(section: QuoteSection): number {
  const itemsTotal = calculateItemsTotal(section.items)
  const risksTotal = calculateRisksTotal(section.risks, section.items)
  return itemsTotal + risksTotal + (section.engobbio || 0) + (section.finitura || 0)
}

/** Calculate the grand total across all sections with quantity multiplier */
export function calculateGrandTotal(sections: QuoteSection[]): number {
  return sections.reduce((sum, section) => sum + (section.total * (section.quantity || 1)), 0)
}

/** Extract thickness (spessore) from a product name like "PIETRA SP. 20 mm" */
export function extractThickness(productName?: string): number | null {
  if (!productName) return null
  const match = productName.match(/Sp\.?\s*(\d+)\s*(?:mm)?/i)
  return match ? parseInt(match[1]) : null
}

/** Find the PIETRA item in a list of items */
export function findPietraItem(items: any[]): any | undefined {
  return items.find(
    (item: any) =>
      item.category === "PIETRA" || item.productName?.match(/^PIETRA/i)
  )
}

/** Get the real sqm for a section using fallbacks: mqTotali > 2° taglio > pietra */
export function getSectionMq(section: any, items: any[]): number {
  let mq = section.mqTotali as number | undefined
  if (mq && mq > 0) return mq

  const secondoTaglio = items.find(
    (item: any) => item.productName?.toLowerCase().includes("2° taglio")
  )
  const pietra = findPietraItem(items)
  mq = secondoTaglio?.quantity ?? pietra?.quantity ?? 0
  return mq && mq > 0 ? mq : 0
}

/** Create an empty section with default values */
export function createEmptySection(name: string, id?: string): QuoteSection {
  const sectionId = id || Date.now().toString()
  return {
    id: sectionId,
    name,
    description: "",
    items: [createEmptyItem(`${sectionId}-item`)],
    risks: [],
    engobbio: 0,
    finitura: 0,
    total: 0,
    mqTotali: undefined,
    euroPerMq: undefined,
    tags: [],
    complexity: undefined,
    risk: undefined,
    quantity: 1,
  }
}

/** Create an empty quote item */
export function createEmptyItem(id?: string): QuoteItem {
  return {
    id: id || Date.now().toString(),
    productId: "",
    productName: "",
    category: "",
    description: "",
    quantity: 1,
    price: 0,
    unit: "",
    total: 0,
  }
}

/** Create an empty risk */
export function createEmptyRisk(id?: string): Risk {
  return {
    id: id || Date.now().toString(),
    description: "Rischio aggiuntivo",
    percentage: 0,
    appliedToItemId: "",
    amount: 0,
  }
}
