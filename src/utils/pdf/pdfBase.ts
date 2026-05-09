import jsPDF from 'jspdf'
import type { EnamelPieceRow } from '@/components/EnamelCostCalculator'

export interface CalculationEntry {
  expression: string
  result: string
  note?: string | null
  created_at: string
}

export interface QuoteData {
  quoteNumber: string
  client: {
    name: string
    company: string
    email?: string
    phone?: string
    address?: string
  }
  sections: any[]
  totalAmount: number
  enamelData?: EnamelPieceRow[] | Record<string, EnamelPieceRow[]> | null
  calculations?: CalculationEntry[]
}

export type PdfCtx = ReturnType<typeof createPdfBase>

/** Create a fresh A4 PDF with cursor + helpers. */
export function createPdfBase() {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin - 15) {
      pdf.addPage()
      y = margin
      return true
    }
    return false
  }

  const addPageNumbers = () => {
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Pagina ${i} di ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      pdf.setTextColor(0, 0, 0)
    }
    pdf.setPage(totalPages)
  }

  return {
    pdf,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    getY: () => y,
    setY: (v: number) => { y = v },
    checkPageBreak,
    addPageNumbers,
  }
}

export function renderHeader(ctx: PdfCtx, quoteData: QuoteData) {
  const { pdf, pageWidth, margin } = ctx
  let y = ctx.getY()

  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PREVENTIVO', pageWidth / 2, y, { align: 'center' })
  y += 10
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`N. ${quoteData.quoteNumber}`, pageWidth / 2, y, { align: 'center' })
  y += 15

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CLIENTE', margin, y)
  y += 7
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(quoteData.client.name, margin, y); y += 5
  if (quoteData.client.company) { pdf.text(quoteData.client.company, margin, y); y += 5 }
  if (quoteData.client.email) { pdf.text(`Email: ${quoteData.client.email}`, margin, y); y += 5 }
  if (quoteData.client.phone) { pdf.text(`Tel: ${quoteData.client.phone}`, margin, y); y += 5 }
  if (quoteData.client.address) { pdf.text(`Indirizzo: ${quoteData.client.address}`, margin, y); y += 5 }
  y += 10

  ctx.setY(y)
}

/** Split a section's items into Pietra and Lavorazioni groups with totals. */
export function classifyItems(items: any[]) {
  const pietra: any[] = []
  const lavorazioni: any[] = []
  for (const item of items) {
    if (item.category === 'PIETRA' || item.productName?.match(/^PIETRA/i)) {
      pietra.push(item)
    } else {
      lavorazioni.push(item)
    }
  }
  return {
    pietra,
    lavorazioni,
    pietraTotal: pietra.reduce((s, i) => s + i.quantity * i.price, 0),
    lavorazioniTotal: lavorazioni.reduce((s, i) => s + i.quantity * i.price, 0),
  }
}

/** Sum all risk amounts for a section (handles SECTION_TOTAL and per-item). */
export function calcRisksTotal(section: any): number {
  const itemsTotal = (section.items || []).reduce((s: number, i: any) => s + i.quantity * i.price, 0)
  return (section.risks || []).reduce((sum: number, risk: any) => {
    if (risk.appliedToItemId === 'SECTION_TOTAL') return sum + itemsTotal * (risk.percentage / 100)
    const t = section.items.find((item: any) => item.id === risk.appliedToItemId)
    return sum + (t ? t.quantity * t.price * (risk.percentage / 100) : 0)
  }, 0)
}

/** Build a deduplicated risk percentage label like "10%+5%". */
export function getRiskPercentageLabel(section: any): string {
  const risks = section.risks || []
  if (risks.length === 0) return ''
  const unique = [...new Set(risks.map((r: any) => r.percentage))]
  return unique.map((p) => `${p}%`).join('+')
}
