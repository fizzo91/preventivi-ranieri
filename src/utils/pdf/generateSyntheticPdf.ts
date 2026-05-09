import { createPdfBase, classifyItems, calcRisksTotal, getRiskPercentageLabel, type QuoteData } from './pdfBase'

/** Generate the compact, tabular "synthetic" PDF format. */
export async function generateSyntheticPdf(quoteData: QuoteData) {
  const ctx = createPdfBase()
  const { pdf, pageWidth, margin, contentWidth, checkPageBreak, addPageNumbers } = ctx

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
  for (let i = 0; i < cols.length; i++) pdf.text(cols[i], cx[i] + 1, y + 5.5)
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
    const qty = section.quantity || 1
    const rowTotal = (pietraTotal + lavorazioniTotal + rischio + engobbio + finitura) * qty

    grandPietra += pietraTotal * qty
    grandLav += lavorazioniTotal * qty
    grandRisk += rischio * qty
    grandEng += engobbio * qty
    grandFin += finitura * qty
    grandTot += rowTotal

    const isAlt = si % 2 === 0
    const fillR = isAlt ? 248 : 255
    const fillG = isAlt ? 250 : 255
    const fillB = isAlt ? 252 : 255

    if (section.description) {
      pdf.setFillColor(fillR, fillG, fillB)
      pdf.rect(margin, y, contentWidth, 5, 'F')
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      const descTrunc = pdf.splitTextToSize(section.description, contentWidth - 4)[0]
      pdf.text(descTrunc, margin + 2, y + 3.5)
      pdf.setTextColor(0, 0, 0)
      y += 5
    }

    pdf.setFillColor(fillR, fillG, fillB)
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
}
