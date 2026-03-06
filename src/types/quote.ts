/**
 * Shared types for quotes, sections, items, and risks
 */

export interface QuoteItem {
  id: string
  productId: string
  productName: string
  category: string
  description: string
  quantity: number
  price: number
  unit: string
  total: number
}

export interface Risk {
  id: string
  description: string
  percentage: number
  appliedToItemId: string
  amount: number
}

export interface QuoteSection {
  id: string
  name: string
  description: string
  chartImage?: string
  chartImagePath?: string
  items: QuoteItem[]
  risks: Risk[]
  engobbio: number
  finitura: number
  total: number
  mqTotali?: number
  euroPerMq?: number
  tags?: string[]
  complexity?: number
  risk?: number
  quantity?: number
}

export interface ClientData {
  name: string
  email: string
  phone: string
  address: string
  company: string
}

export interface QuoteFormData {
  number: string
  date: string
  validUntil: string
  notes: string
  status: string
}

export interface PriceWarning {
  type: 'above' | 'below'
  sectionCostPerMq: number
  avgCostPerMq: number
  pctDiff: string
  thickness: number
}
