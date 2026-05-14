import { calcRow, type EnamelPieceRow } from '@/components/EnamelCostCalculator'
import { createPdfBase, renderHeader, type QuoteData } from './pdfBase'
import { renderSyntheticContent } from './generateSyntheticPdf'

/**
 * Generate the full, detailed PDF for a quote
 * (sections, items, risks, engobbio/finitura, enamel appendix and calculations receipt).
 */
export async function generateFullPdf(quoteData: QuoteData) {
  const ctx = createPdfBase()
  const { pdf, pageWidth, margin, contentWidth, checkPageBreak, addPageNumbers } = ctx

  renderHeader(ctx, quoteData)
  let y = ctx.getY()

  for (const section of quoteData.sections) {
    checkPageBreak(20)
    y = ctx.getY()

    // Section title
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
      y += descLines.length * 4 + 3
      ctx.setY(y)
    }

    // Chart image
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

    // Items table header
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
    ctx.setY(y)

    pdf.setFont('helvetica', 'normal')
    const sectionItemsTotal = section.items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0)
    const stoneItems = section.items.filter((item: any) => item.category === 'Calcolatore Pietra')

    for (const item of section.items) {
      pdf.setFontSize(8)
      const productName = pdf.splitTextToSize(item.productName || item.description || 'Prodotto', colWidths[0] - 4)
      const categoryText = pdf.splitTextToSize(item.category || '-', colWidths[1] - 4)
      const lines = Math.max(productName.length, categoryText.length, 1)
      const rowHeight = Math.max(7, 2 + lines * 4)
      checkPageBreak(rowHeight + 2)
      y = ctx.getY()
      for (let li = 0; li < productName.length; li++) pdf.text(productName[li], colX[0] + 2, y + 4 + li * 4)
      for (let li = 0; li < categoryText.length; li++) pdf.text(categoryText[li], colX[1] + 2, y + 4 + li * 4)
      pdf.text(item.quantity.toFixed(2), colX[2] + 2, y + 4)
      pdf.text(item.unit || '-', colX[3] + 2, y + 4)
      pdf.text(`${item.price.toFixed(2)}`, colX[4] + 2, y + 4)
      pdf.text(`${item.total.toFixed(2)}`, colX[5] + 2, y + 4)
      y += rowHeight
      ctx.setY(y)
    }

    // Stone calculator details
    if (stoneItems.length > 0) {
      checkPageBreak(50)
      y = ctx.getY() + 5
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

    y = ctx.getY() + 5
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
      ctx.setY(y)

      pdf.setFont('helvetica', 'normal')
      for (const risk of section.risks) {
        checkPageBreak(10)
        y = ctx.getY()
        let appliedToProduct = 'N/A'
        let riskAmount = 0
        if (risk.appliedToItemId === 'SECTION_TOTAL') {
          appliedToProduct = 'Totale Sezione'
          riskAmount = sectionItemsTotal * (risk.percentage / 100)
        } else {
          const appliedToItem = section.items.find((item: any) => item.id === risk.appliedToItemId)
          appliedToProduct = appliedToItem ? (appliedToItem.productName || appliedToItem.description || 'Prodotto') : 'N/A'
          riskAmount = appliedToItem ? appliedToItem.quantity * appliedToItem.price * (risk.percentage / 100) : 0
        }
        const riskDesc = pdf.splitTextToSize(risk.description || '', 55)
        const riskProduct = pdf.splitTextToSize(appliedToProduct, 55)
        const riskLines = Math.max(riskDesc.length, riskProduct.length, 1)
        const riskRowHeight = Math.max(8, 2 + riskLines * 4)
        for (let li = 0; li < riskDesc.length; li++) pdf.text(riskDesc[li], margin + 2, y + 4 + li * 4)
        for (let li = 0; li < riskProduct.length; li++) pdf.text(riskProduct[li], margin + 60, y + 4 + li * 4)
        pdf.text(`${risk.percentage}%`, margin + 120, y + 4)
        pdf.text(`€ ${riskAmount.toFixed(2)}`, margin + 145, y + 4)
        y += riskRowHeight
        ctx.setY(y)
      }
      y += 5
      ctx.setY(y)
    }

    // Engobbio
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

    y = ctx.getY()

    // Section total
    const sectionRisksTotal = (section.risks || []).reduce((sum: number, risk: any) => {
      if (risk.appliedToItemId === 'SECTION_TOTAL') return sum + sectionItemsTotal * (risk.percentage / 100)
      const targetItem = section.items.find((item: any) => item.id === risk.appliedToItemId)
      return sum + (targetItem ? targetItem.quantity * targetItem.price * (risk.percentage / 100) : 0)
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

  // Grand total
  checkPageBreak(20)
  y = ctx.getY() + 5
  pdf.setDrawColor(0, 123, 255)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, margin + contentWidth, y)
  y += 10
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`TOTALE: € ${quoteData.totalAmount.toFixed(2)}`, margin + contentWidth, y, { align: 'right' })

  // ── Enamel Cost Appendix ──
  const allEnamelSections: { sectionName: string; rows: EnamelPieceRow[] }[] = []
  if (quoteData.enamelData) {
    if (Array.isArray(quoteData.enamelData)) {
      if (quoteData.enamelData.length > 0) allEnamelSections.push({ sectionName: '', rows: quoteData.enamelData })
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
      for (let i = 0; i < eCols.length; i++) pdf.text(eCols[i], eX[i] + 1, y + 5)
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
        for (let i = 0; i < vals.length; i++) pdf.text(vals[i], eX[i] + 1, y + 4)
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

  // ── Calculations Receipt ──
  if (quoteData.calculations && quoteData.calculations.length > 0) {
    pdf.addPage()
    y = margin

    const receiptWidth = 80
    const receiptX = (pageWidth - receiptWidth) / 2

    pdf.setDrawColor(100, 100, 100)
    pdf.setLineDashPattern([1, 1], 0)
    pdf.line(receiptX, y, receiptX + receiptWidth, y)
    y += 6

    pdf.setFont('courier', 'bold')
    pdf.setFontSize(12)
    pdf.text('FOGLIO CALCOLI', pageWidth / 2, y, { align: 'center' })
    y += 5
    pdf.setFontSize(8)
    pdf.setFont('courier', 'normal')
    pdf.text(`Preventivo N. ${quoteData.quoteNumber}`, pageWidth / 2, y, { align: 'center' })
    y += 4
    pdf.text(new Date().toLocaleDateString('it-IT'), pageWidth / 2, y, { align: 'center' })
    y += 5

    pdf.line(receiptX, y, receiptX + receiptWidth, y)
    y += 5

    for (const calc of quoteData.calculations) {
      ctx.setY(y); checkPageBreak(14); y = ctx.getY()

      pdf.setFont('courier', 'normal')
      pdf.setFontSize(8)
      const exprLines = pdf.splitTextToSize(calc.expression, receiptWidth - 4)
      for (const line of exprLines) {
        pdf.text(line, receiptX + 2, y)
        y += 3.5
      }

      pdf.setFont('courier', 'bold')
      pdf.setFontSize(10)
      pdf.text(`= ${calc.result}`, receiptX + receiptWidth - 2, y, { align: 'right' })
      y += 4

      if (calc.note) {
        pdf.setFont('courier', 'italic')
        pdf.setFontSize(7)
        pdf.setTextColor(100, 100, 100)
        const noteLines = pdf.splitTextToSize(calc.note, receiptWidth - 4)
        for (const line of noteLines) {
          pdf.text(line, receiptX + 2, y)
          y += 3
        }
        pdf.setTextColor(0, 0, 0)
      }

      y += 2
      pdf.setLineDashPattern([0.5, 1], 0)
      pdf.line(receiptX + 5, y, receiptX + receiptWidth - 5, y)
      y += 4
    }

    y += 2
    pdf.setLineDashPattern([1, 1], 0)
    pdf.line(receiptX, y, receiptX + receiptWidth, y)
    y += 5
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(8)
    pdf.text(`Tot. calcoli: ${quoteData.calculations.length}`, pageWidth / 2, y, { align: 'center' })
    y += 5

    pdf.line(receiptX, y, receiptX + receiptWidth, y)
    y += 3

    pdf.setLineDashPattern([], 0)
  }

  // Footer
  y += 15
  ctx.setY(y); checkPageBreak(15); y = ctx.getY()
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Preventivo generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, y, { align: 'center' })
  y += 5
  pdf.text('Questo preventivo è valido per 30 giorni dalla data di emissione.', pageWidth / 2, y, { align: 'center' })

  // ── Synthetic Summary Appendix ──
  pdf.addPage()
  ctx.setY(20)
  renderSyntheticContent(ctx, quoteData)

  addPageNumbers()
  pdf.save(`preventivo-${quoteData.quoteNumber}.pdf`)
}
