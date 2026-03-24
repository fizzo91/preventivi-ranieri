import jsPDF from 'jspdf'
import { calcRow, type EnamelPieceRow } from '@/components/EnamelCostCalculator'

interface QuoteData {
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
}

/** Helper: classify items into Pietra and Lavorazioni */
function classifyItems(items: any[]) {
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
    pietraTotal: pietra.reduce((s: number, i: any) => s + (i.quantity * i.price), 0),
    lavorazioniTotal: lavorazioni.reduce((s: number, i: any) => s + (i.quantity * i.price), 0),
  }
}

/** Helper: compute enamel total for a section */
function getEnamelTotalForSection(sectionId: string, enamelData: EnamelPieceRow[] | Record<string, EnamelPieceRow[]> | null | undefined): number {
  if (!enamelData) return 0
  let rows: EnamelPieceRow[] = []
  if (Array.isArray(enamelData)) {
    rows = enamelData
  } else if (enamelData[sectionId]) {
    rows = enamelData[sectionId]
  }
  return rows.reduce((sum, row) => sum + calcRow(row).totale_riga, 0)
}

/** Shared PDF helpers */
function createPdfBase() {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
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

  return { pdf, pageWidth, pageHeight, margin, contentWidth, getY: () => y, setY: (v: number) => { y = v }, checkPageBreak, addPageNumbers }
}

function renderHeader(ctx: ReturnType<typeof createPdfBase>, quoteData: QuoteData) {
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

/** Calculate risks total for a section */
function calcRisksTotal(section: any): number {
  const itemsTotal = (section.items || []).reduce((s: number, i: any) => s + (i.quantity * i.price), 0)
  return (section.risks || []).reduce((sum: number, risk: any) => {
    if (risk.appliedToItemId === 'SECTION_TOTAL') return sum + (itemsTotal * (risk.percentage / 100))
    const t = section.items.find((item: any) => item.id === risk.appliedToItemId)
    return sum + (t ? (t.quantity * t.price) * (risk.percentage / 100) : 0)
  }, 0)
}

/** Get a descriptive risk percentage string like "15%" or "10%+5%" — deduplicates equal values */
function getRiskPercentageLabel(section: any): string {
  const risks = section.risks || []
  if (risks.length === 0) return ''
  const unique = [...new Set(risks.map((r: any) => r.percentage))]
  return unique.map((p: number) => `${p}%`).join('+')
}

/** Render the section cost summary box */
function renderSectionCostSummary(
  ctx: ReturnType<typeof createPdfBase>,
  section: any,
  enamelData: EnamelPieceRow[] | Record<string, EnamelPieceRow[]> | null | undefined
) {
  const { pdf, margin, contentWidth, checkPageBreak } = ctx
  let y = ctx.getY()

  const { pietraTotal, lavorazioniTotal } = classifyItems(section.items || [])
  const rischio = calcRisksTotal(section)
  const engobbio = section.engobbio || 0
  const finitura = section.finitura || 0

  checkPageBreak(45)

  // Title
  pdf.setFillColor(240, 249, 255)
  pdf.rect(margin, y, contentWidth, 7, 'F')
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 64, 175)
  pdf.text('RIEPILOGO COSTI SEZIONE', margin + 2, y + 5)
  pdf.setTextColor(0, 0, 0)
  y += 8

  const riskLabel = getRiskPercentageLabel(section)
  const summaryRows = [
    { label: 'Pietra', value: pietraTotal },
    { label: 'Lavorazioni', value: lavorazioniTotal },
    { label: riskLabel ? `Rischio (${riskLabel})` : 'Rischio', value: rischio },
    { label: 'Engobbio', value: engobbio },
    { label: 'Finitura', value: finitura },
  ]

  pdf.setFontSize(8)
  for (let i = 0; i < summaryRows.length; i++) {
    const row = summaryRows[i]
    if (i % 2 === 0) {
      pdf.setFillColor(248, 250, 252)
      pdf.rect(margin, y, contentWidth, 6, 'F')
    }
    pdf.setFont('helvetica', 'normal')
    pdf.text(row.label, margin + 4, y + 4)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`€ ${row.value.toFixed(2)}`, margin + contentWidth - 4, y + 4, { align: 'right' })
    y += 6
  }

  y += 3
  ctx.setY(y)
}

export const usePdfGenerator = () => {

  // ── FULL PDF ──
  const generatePdf = async (quoteData: QuoteData) => {
    try {
      const ctx = createPdfBase()
      const { pdf, pageWidth, margin, contentWidth, checkPageBreak, addPageNumbers } = ctx

      renderHeader(ctx, quoteData)
      let y = ctx.getY()

      // Sections
      for (const section of quoteData.sections) {
        checkPageBreak(20)
        y = ctx.getY()

        // Section Title
        pdf.setFillColor(248, 249, 250)
        pdf.rect(margin, y - 5, contentWidth, 10, 'F')
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        const sectionQty = section.quantity || 1
        const sectionLabel = sectionQty > 1 ? `${section.name} (x${sectionQty})` : section.name
        pdf.text(sectionLabel, margin + 2, y)
        y += 10
        ctx.setY(y)

        if (section.description) {
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'italic')
          const descLines = pdf.splitTextToSize(section.description, contentWidth - 4)
          pdf.text(descLines, margin + 2, y)
          y += (descLines.length * 4) + 3
          ctx.setY(y)
        }

        // Chart Image
        if (section.chartImage) {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error('Failed to load image'))
              img.src = section.chartImage
            })
            const maxWidth = contentWidth - 20
            const maxHeight = 80
            let imgWidth = img.width
            let imgHeight = img.height
            if (imgWidth > maxWidth) { const r = maxWidth / imgWidth; imgWidth = maxWidth; imgHeight *= r }
            if (imgHeight > maxHeight) { const r = maxHeight / imgHeight; imgHeight = maxHeight; imgWidth *= r }
            y = ctx.getY()
            checkPageBreak(imgHeight + 10)
            y = ctx.getY()
            const imgX = margin + (contentWidth - imgWidth) / 2
            pdf.addImage(img, 'PNG', imgX, y, imgWidth, imgHeight)
            y += imgHeight + 5
            ctx.setY(y)
          } catch (error) {
            console.error('Error loading chart image:', error)
          }
        }

        y = ctx.getY()
        checkPageBreak(30)
        y = ctx.getY()

        // Items Table Header
        const colX = [margin, margin + 60, margin + 95, margin + 115, margin + 135, margin + 160]
        const colWidths = [60, 35, 20, 20, 25, 25]

        pdf.setFillColor(248, 249, 250)
        pdf.rect(margin, y, contentWidth, 8, 'F')
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Prodotto', colX[0] + 2, y + 5)
        pdf.text('Categoria', colX[1] + 2, y + 5)
        pdf.text('Qtà', colX[2] + 2, y + 5)
        pdf.text('U.M.', colX[3] + 2, y + 5)
        pdf.text('Prezzo', colX[4] + 2, y + 5)
        pdf.text('Totale', colX[5] + 2, y + 5)
        y += 8

        // Items
        pdf.setFont('helvetica', 'normal')
        const sectionItemsTotal = section.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
        const stoneItems = section.items.filter((item: any) => item.category === 'Calcolatore Pietra')

        for (const item of section.items) {
          checkPageBreak(10)
          y = ctx.getY()
          pdf.setFontSize(8)
          const productName = pdf.splitTextToSize(item.productName || item.description || 'Prodotto', colWidths[0] - 4)
          pdf.text(productName, colX[0] + 2, y + 4)
          pdf.text(item.category || '-', colX[1] + 2, y + 4)
          pdf.text(item.quantity.toFixed(2), colX[2] + 2, y + 4)
          pdf.text(item.unit || '-', colX[3] + 2, y + 4)
          pdf.text(`${item.price.toFixed(2)}`, colX[4] + 2, y + 4)
          pdf.text(`${item.total.toFixed(2)}`, colX[5] + 2, y + 4)
          const lines = Math.max(productName.length, 1)
          y += 4 + (lines * 3)
          ctx.setY(y)
        }

        // Stone Calculator Details Table
        if (stoneItems.length > 0) {
          checkPageBreak(50)
          y = ctx.getY()
          y += 5
          const pietraItem = stoneItems.find((item: any) => item.productName.includes('PIETRA'))
          const mq = pietraItem?.quantity || 0
          const spMatch = pietraItem?.productName.match(/SP\.\s*(\d+(?:\.\d+)?)/i)
          const sp = spMatch ? parseFloat(spMatch[1]) : 2

          pdf.setFillColor(255, 251, 235)
          pdf.rect(margin, y, contentWidth, 8, 'F')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(146, 64, 14)
          pdf.text('DETTAGLIO CALCOLO PIETRA', margin + 2, y + 5)
          pdf.text(`SP: ${sp} cm`, margin + 80, y + 5)
          pdf.text(`MQ Totali: ${mq.toFixed(2)} mq`, margin + 110, y + 5)
          pdf.setTextColor(0, 0, 0)
          y += 8

          const stoneColX = [margin, margin + 70, margin + 100, margin + 135]
          pdf.setFillColor(248, 249, 250)
          pdf.rect(margin, y, contentWidth, 7, 'F')
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Voce', stoneColX[0] + 2, y + 5)
          pdf.text('Qtà', stoneColX[1] + 2, y + 5)
          pdf.text('Costo Unitario', stoneColX[2] + 2, y + 5)
          pdf.text('Totale', stoneColX[3] + 2, y + 5)
          y += 7

          pdf.setFont('helvetica', 'normal')
          if (pietraItem) {
            pdf.text('PIETRA', stoneColX[0] + 2, y + 4)
            pdf.text(`${pietraItem.quantity.toFixed(2)}`, stoneColX[1] + 2, y + 4)
            pdf.text(`€ ${pietraItem.price.toFixed(2)}`, stoneColX[2] + 2, y + 4)
            pdf.text(`€ ${pietraItem.total.toFixed(2)}`, stoneColX[3] + 2, y + 4)
            y += 6
          }

          const stoneTotalCalc = pietraItem?.total || 0
          pdf.setFillColor(248, 249, 250)
          pdf.rect(margin, y, contentWidth, 7, 'F')
          pdf.setFont('helvetica', 'bold')
          pdf.text('TOTALE', stoneColX[0] + 2, y + 5)
          pdf.text(`€ ${stoneTotalCalc.toFixed(2)}`, stoneColX[3] + 2, y + 5)
          y += 10
          ctx.setY(y)
        }

        y = ctx.getY()
        y += 5
        ctx.setY(y)

        // Risks
        if (section.risks && section.risks.length > 0) {
          checkPageBreak(20)
          y = ctx.getY()

          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Rischi Sezione', margin, y)
          y += 7

          pdf.setFillColor(254, 242, 242)
          pdf.rect(margin, y, contentWidth, 7, 'F')
          pdf.setFontSize(8)
          pdf.text('Descrizione', margin + 2, y + 4)
          pdf.text('Applicato a', margin + 60, y + 4)
          pdf.text('%', margin + 120, y + 4)
          pdf.text('Importo', margin + 145, y + 4)
          y += 7

          pdf.setFont('helvetica', 'normal')
          for (const risk of section.risks) {
            checkPageBreak(8)
            y = ctx.getY()
            let appliedToProduct = 'N/A'
            let riskAmount = 0
            if (risk.appliedToItemId === 'SECTION_TOTAL') {
              appliedToProduct = 'Totale Sezione'
              riskAmount = sectionItemsTotal * (risk.percentage / 100)
            } else {
              const appliedToItem = section.items.find((item: any) => item.id === risk.appliedToItemId)
              appliedToProduct = appliedToItem ? (appliedToItem.productName || appliedToItem.description || 'Prodotto') : 'N/A'
              riskAmount = appliedToItem ? (appliedToItem.quantity * appliedToItem.price) * (risk.percentage / 100) : 0
            }
            pdf.text(pdf.splitTextToSize(risk.description, 55)[0], margin + 2, y + 4)
            pdf.text(pdf.splitTextToSize(appliedToProduct, 55)[0], margin + 60, y + 4)
            pdf.text(`${risk.percentage}%`, margin + 120, y + 4)
            pdf.text(`€ ${riskAmount.toFixed(2)}`, margin + 145, y + 4)
            y += 6
            ctx.setY(y)
          }
          y += 5
          ctx.setY(y)
        }

        // Engobbio
        y = ctx.getY()
        const engobbio = section.engobbio || 0
        if (engobbio > 0) {
          checkPageBreak(10)
          y = ctx.getY()
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Engobbio', margin + 2, y + 4)
          pdf.text(`€ ${engobbio.toFixed(2)}`, margin + contentWidth - 30, y + 4)
          pdf.setFont('helvetica', 'italic')
          pdf.setFontSize(8)
          pdf.text('vedere preventivo allegato', margin + 2, y + 8)
          y += 12
          ctx.setY(y)
        }

        // Finitura
        const finitura = section.finitura || 0
        if (finitura > 0) {
          checkPageBreak(10)
          y = ctx.getY()
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Finitura', margin + 2, y + 4)
          pdf.text(`€ ${finitura.toFixed(2)}`, margin + contentWidth - 30, y + 4)
          pdf.setFont('helvetica', 'italic')
          pdf.setFontSize(8)
          pdf.text('vedere preventivo allegato', margin + 2, y + 8)
          y += 12
          ctx.setY(y)
        }

        // ── SECTION COST SUMMARY ──
        renderSectionCostSummary(ctx, section, quoteData.enamelData)
        y = ctx.getY()

        // Section Total
        const sectionRisksTotal = (section.risks || []).reduce((sum: number, risk: any) => {
          if (risk.appliedToItemId === 'SECTION_TOTAL') {
            return sum + (sectionItemsTotal * (risk.percentage / 100))
          } else {
            const targetItem = section.items.find((item: any) => item.id === risk.appliedToItemId)
            return sum + (targetItem ? (targetItem.quantity * targetItem.price) * (risk.percentage / 100) : 0)
          }
        }, 0)

        const sectionTotal = sectionItemsTotal + sectionRisksTotal + engobbio + finitura
        const sectionTotalWithQty = sectionTotal * (section.quantity || 1)

        pdf.setFillColor(248, 249, 250)
        pdf.rect(margin, y, contentWidth, 8, 'F')
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')

        const mqTotali = section.mqTotali
        if (mqTotali && mqTotali > 0) {
          const euroPerMq = sectionTotal / mqTotali
          pdf.text(`mq: ${mqTotali.toFixed(2)}`, margin + 2, y + 5)
          pdf.text(`€/mq: ${euroPerMq.toFixed(2)}`, margin + 40, y + 5)
        }

        if ((section.quantity || 1) > 1) {
          pdf.text(`Totale Sezione: € ${sectionTotal.toFixed(2)} x${section.quantity} = € ${sectionTotalWithQty.toFixed(2)}`, margin + contentWidth - 2, y + 5, { align: 'right' })
        } else {
          pdf.text(`Totale Sezione: € ${sectionTotal.toFixed(2)}`, margin + contentWidth - 2, y + 5, { align: 'right' })
        }
        y += 15
        ctx.setY(y)
      }

      // Riepilogo Sezioni
      y = ctx.getY()
      checkPageBreak(20 + (quoteData.sections.length * 7))
      y = ctx.getY()
      y += 10
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RIEPILOGO', margin, y)
      y += 10

      pdf.setFillColor(248, 249, 250)
      pdf.rect(margin, y - 5, contentWidth, 7, 'F')
      pdf.setFontSize(9)
      pdf.text('Sezione', margin + 2, y)
      pdf.text('Totale', margin + contentWidth - 2, y, { align: 'right' })
      y += 7

      pdf.setFont('helvetica', 'normal')
      for (const section of quoteData.sections) {
        const sit = section.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
        const srt = (section.risks || []).reduce((sum: number, risk: any) => {
          if (risk.appliedToItemId === 'SECTION_TOTAL') return sum + (sit * (risk.percentage / 100))
          const t = section.items.find((item: any) => item.id === risk.appliedToItemId)
          return sum + (t ? (t.quantity * t.price) * (risk.percentage / 100) : 0)
        }, 0)
        const eng = section.engobbio || 0
        const fin = section.finitura || 0
        const st = sit + srt + eng + fin
        const sq = section.quantity || 1
        const stq = st * sq

        pdf.setFontSize(9)
        const nl = sq > 1 ? `${section.name} (x${sq})` : section.name
        pdf.text(nl, margin + 2, y)
        pdf.text(`€ ${stq.toFixed(2)}`, margin + contentWidth - 2, y, { align: 'right' })
        y += 6
      }
      y += 5

      // Grand Total
      checkPageBreak(20)
      y = ctx.getY()
      y += 5
      pdf.setDrawColor(0, 123, 255)
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, margin + contentWidth, y)
      y += 10
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`TOTALE: € ${quoteData.totalAmount.toFixed(2)}`, margin + contentWidth, y, { align: 'right' })

      // ── Enamel Cost Appendix ──
      let allEnamelSections: { sectionName: string; rows: EnamelPieceRow[] }[] = []
      if (quoteData.enamelData) {
        if (Array.isArray(quoteData.enamelData)) {
          if (quoteData.enamelData.length > 0) {
            allEnamelSections.push({ sectionName: '', rows: quoteData.enamelData })
          }
        } else {
          for (const [sectionId, rows] of Object.entries(quoteData.enamelData)) {
            if (rows && rows.length > 0) {
              const section = quoteData.sections.find((s: any) => s.id === sectionId)
              allEnamelSections.push({ sectionName: section?.name || '', rows })
            }
          }
        }
      }

      if (allEnamelSections.length > 0) {
        pdf.addPage()
        y = margin

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('ALLEGATO: COSTI SMALTO', pageWidth / 2, y, { align: 'center' })
        y += 12

        for (const enamelSection of allEnamelSections) {
          if (enamelSection.sectionName) {
            ctx.setY(y); checkPageBreak(12); y = ctx.getY()
            pdf.setFontSize(11)
            pdf.setFont('helvetica', 'bold')
            pdf.text(enamelSection.sectionName, margin, y)
            y += 8
          }

          const eCols = ['ID', 'Descrizione', 'Finit.', 'Sp.', 'L1×L2', 'Mq Mod', 'Pz', '%', '€/Mq', 'Tot Cer.', 'Imb.', 'Prof.', 'TOTALE']
          const eWidths = [8, 30, 15, 10, 18, 14, 8, 8, 14, 18, 14, 14, 18]
          const eX: number[] = []
          let cx = margin
          for (const w of eWidths) { eX.push(cx); cx += w }

          pdf.setFillColor(248, 249, 250)
          pdf.rect(margin, y, contentWidth, 7, 'F')
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'bold')
          for (let i = 0; i < eCols.length; i++) { pdf.text(eCols[i], eX[i] + 1, y + 5) }
          y += 7

          pdf.setFont('helvetica', 'normal')
          let enamelSectionTotal = 0

          for (let ri = 0; ri < enamelSection.rows.length; ri++) {
            ctx.setY(y); checkPageBreak(8); y = ctx.getY()
            const row = enamelSection.rows[ri]
            const c = calcRow(row)
            enamelSectionTotal += c.totale_riga

            const fmtE = (v: number) => v.toFixed(2)
            const vals = [
              String(ri + 1).padStart(2, '0'),
              (row.descrizione || '-').substring(0, 18),
              String(row.finitura_code),
              String(row.spessore),
              `${row.lato1}×${row.lato2}`,
              c.mq_modulo.toFixed(2),
              String(row.nr_pezzi),
              row.percentuale ? `${row.percentuale}` : '0',
              `€${fmtE(c.listino_mq)}`,
              `€${fmtE(c.totale_ceramica)}`,
              `€${fmtE(c.tot_imballaggio)}`,
              `€${fmtE(c.tot_profilo)}`,
              `€${fmtE(c.totale_riga)}`,
            ]

            if (ri % 2 === 0) {
              pdf.setFillColor(252, 252, 253)
              pdf.rect(margin, y, contentWidth, 6, 'F')
            }

            pdf.setFontSize(6)
            for (let i = 0; i < vals.length; i++) { pdf.text(vals[i], eX[i] + 1, y + 4) }
            y += 6
          }

          ctx.setY(y); checkPageBreak(10); y = ctx.getY()
          pdf.setFillColor(255, 251, 235)
          pdf.rect(margin, y, contentWidth, 8, 'F')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.text(enamelSection.sectionName ? `TOTALE ${enamelSection.sectionName}` : 'TOTALE SMALTO', margin + 2, y + 5)
          pdf.text(`€ ${enamelSectionTotal.toFixed(2)}`, margin + contentWidth - 2, y + 5, { align: 'right' })
          y += 12
        }
      }

      // Footer
      y += 15
      ctx.setY(y); checkPageBreak(15); y = ctx.getY()
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Preventivo generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, y, { align: 'center' })
      y += 5
      pdf.text('Questo preventivo è valido per 30 giorni dalla data di emissione.', pageWidth / 2, y, { align: 'center' })

      addPageNumbers()
      pdf.save(`preventivo-${quoteData.quoteNumber}.pdf`)
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error)
      throw error
    }
  }

  // ── SYNTHETIC PDF ──
  const generateSyntheticPdf = async (quoteData: QuoteData) => {
    try {
      const ctx = createPdfBase()
      const { pdf, pageWidth, margin, contentWidth, checkPageBreak, addPageNumbers } = ctx

      // Header
      let y = ctx.getY()
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('PREVENTIVO SINTETICO', pageWidth / 2, y, { align: 'center' })
      y += 8
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`N. ${quoteData.quoteNumber}`, pageWidth / 2, y, { align: 'center' })
      y += 6
      pdf.text(`${quoteData.client.name}${quoteData.client.company ? ` – ${quoteData.client.company}` : ''}`, pageWidth / 2, y, { align: 'center' })
      y += 12
      ctx.setY(y)

      // Table header
      const cols = ['Sezione', 'Pietra', 'Lavoraz.', 'Rischio%', 'Rischio', 'Engobbio', 'Finitura', 'Totale']
      const cw = [34, 19, 20, 28, 20, 19, 19, 21]
      const cx: number[] = []
      let xp = margin
      for (const w of cw) { cx.push(xp); xp += w }

      pdf.setFillColor(30, 64, 175)
      pdf.rect(margin, y, contentWidth, 8, 'F')
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      for (let i = 0; i < cols.length; i++) { pdf.text(cols[i], cx[i] + 1, y + 5.5) }
      pdf.setTextColor(0, 0, 0)
      y += 8

      let grandPietra = 0, grandLav = 0, grandRisk = 0, grandEng = 0, grandFin = 0, grandTot = 0

      for (let si = 0; si < quoteData.sections.length; si++) {
        const section = quoteData.sections[si]
        ctx.setY(y); checkPageBreak(18); y = ctx.getY()

        const { pietraTotal, lavorazioniTotal } = classifyItems(section.items || [])
        const rischio = calcRisksTotal(section)
        const riskPctLabel = getRiskPercentageLabel(section)
        const engobbio = section.engobbio || 0
        const finitura = section.finitura || 0
        const rowTotal = (pietraTotal + lavorazioniTotal + rischio + engobbio + finitura) * (section.quantity || 1)
        const qty = section.quantity || 1

        grandPietra += pietraTotal * qty
        grandLav += lavorazioniTotal * qty
        grandRisk += rischio * qty
        grandEng += engobbio * qty
        grandFin += finitura * qty
        grandTot += rowTotal

        // Description row
        if (section.description) {
          pdf.setFillColor(si % 2 === 0 ? 248 : 255, si % 2 === 0 ? 250 : 255, si % 2 === 0 ? 252 : 255)
          pdf.rect(margin, y, contentWidth, 5, 'F')
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'italic')
          pdf.setTextColor(100, 100, 100)
          const descTrunc = pdf.splitTextToSize(section.description, contentWidth - 4)[0]
          pdf.text(descTrunc, margin + 2, y + 3.5)
          pdf.setTextColor(0, 0, 0)
          y += 5
        }

        // Data row
        pdf.setFillColor(si % 2 === 0 ? 248 : 255, si % 2 === 0 ? 250 : 255, si % 2 === 0 ? 252 : 255)
        pdf.rect(margin, y, contentWidth, 7, 'F')
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        const nameLabel = qty > 1 ? `${section.name} (x${qty})` : section.name
        pdf.text(pdf.splitTextToSize(nameLabel, cw[0] - 3)[0], cx[0] + 1, y + 5)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`€${(pietraTotal * qty).toFixed(0)}`, cx[1] + 1, y + 5)
        pdf.text(`€${(lavorazioniTotal * qty).toFixed(0)}`, cx[2] + 1, y + 5)
        pdf.text(riskPctLabel || '-', cx[3] + 1, y + 5)
        pdf.text(`€${(rischio * qty).toFixed(0)}`, cx[4] + 1, y + 5)
        pdf.text(`€${(engobbio * qty).toFixed(0)}`, cx[5] + 1, y + 5)
        pdf.text(`€${(finitura * qty).toFixed(0)}`, cx[6] + 1, y + 5)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`€${rowTotal.toFixed(0)}`, cx[7] + 1, y + 5)
        y += 7
      }

      // Grand total row
      y += 2
      pdf.setFillColor(30, 64, 175)
      pdf.rect(margin, y, contentWidth, 9, 'F')
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('TOTALE', cx[0] + 1, y + 6)
      pdf.text(`€${grandPietra.toFixed(0)}`, cx[1] + 1, y + 6)
      pdf.text(`€${grandLav.toFixed(0)}`, cx[2] + 1, y + 6)
      pdf.text('', cx[3] + 1, y + 6)
      pdf.text(`€${grandRisk.toFixed(0)}`, cx[4] + 1, y + 6)
      pdf.text(`€${grandEng.toFixed(0)}`, cx[5] + 1, y + 6)
      pdf.text(`€${grandFin.toFixed(0)}`, cx[6] + 1, y + 6)
      pdf.text(`€${grandTot.toFixed(0)}`, cx[7] + 1, y + 6)
      pdf.setTextColor(0, 0, 0)
      y += 15

      // Footer
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Preventivo generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, y, { align: 'center' })
      y += 5
      pdf.text('Questo preventivo è valido per 30 giorni dalla data di emissione.', pageWidth / 2, y, { align: 'center' })

      addPageNumbers()
      pdf.save(`preventivo-sintetico-${quoteData.quoteNumber}.pdf`)
    } catch (error) {
      console.error('Errore durante la generazione del PDF sintetico:', error)
      throw error
    }
  }

  return { generatePdf, generateSyntheticPdf }
}
