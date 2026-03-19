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

export const usePdfGenerator = () => {
  const generatePdf = async (quoteData: QuoteData) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      let y = margin
      let currentPage = 1

      const addPageNumber = () => {
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

      const checkPageBreak = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - margin - 15) { // Leave space for page number
          pdf.addPage()
          currentPage++
          y = margin
          return true
        }
        return false
      }

      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('PREVENTIVO', pageWidth / 2, y, { align: 'center' })
      y += 10
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`N. ${quoteData.quoteNumber}`, pageWidth / 2, y, { align: 'center' })
      y += 15

      // Client Info
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CLIENTE', margin, y)
      y += 7
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text(quoteData.client.name, margin, y)
      y += 5
      if (quoteData.client.company) {
        pdf.text(quoteData.client.company, margin, y)
        y += 5
      }
      if (quoteData.client.email) {
        pdf.text(`Email: ${quoteData.client.email}`, margin, y)
        y += 5
      }
      if (quoteData.client.phone) {
        pdf.text(`Tel: ${quoteData.client.phone}`, margin, y)
        y += 5
      }
      if (quoteData.client.address) {
        pdf.text(`Indirizzo: ${quoteData.client.address}`, margin, y)
        y += 5
      }
      y += 10

      // Sections
      for (const section of quoteData.sections) {
        checkPageBreak(20)
        
        // Section Title
        pdf.setFillColor(248, 249, 250)
        pdf.rect(margin, y - 5, contentWidth, 10, 'F')
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
       const sectionQty = section.quantity || 1
       const sectionLabel = sectionQty > 1 ? `${section.name} (x${sectionQty})` : section.name
       pdf.text(sectionLabel, margin + 2, y)
        y += 10

        if (section.description) {
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'italic')
          const descLines = pdf.splitTextToSize(section.description, contentWidth - 4)
          pdf.text(descLines, margin + 2, y)
          y += (descLines.length * 4) + 3
        }

        // Chart Image
        if (section.chartImage) {
          try {
            // Load image and add to PDF
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error('Failed to load image'))
              img.src = section.chartImage
            })

            // Calculate proportional dimensions
            const maxWidth = contentWidth - 20
            const maxHeight = 80
            let imgWidth = img.width
            let imgHeight = img.height

            // Scale proportionally
            if (imgWidth > maxWidth) {
              const ratio = maxWidth / imgWidth
              imgWidth = maxWidth
              imgHeight = imgHeight * ratio
            }
            if (imgHeight > maxHeight) {
              const ratio = maxHeight / imgHeight
              imgHeight = maxHeight
              imgWidth = imgWidth * ratio
            }

            // Check page break before image
            checkPageBreak(imgHeight + 10)

            // Center the image
            const imgX = margin + (contentWidth - imgWidth) / 2
            pdf.addImage(img, 'PNG', imgX, y, imgWidth, imgHeight)
            y += imgHeight + 5
          } catch (error) {
            console.error('Error loading chart image:', error)
          }
        }

        checkPageBreak(30)

        // Items Table Header
        const colWidths = [60, 35, 20, 20, 25, 25]
        const colX = [margin, margin + 60, margin + 95, margin + 115, margin + 135, margin + 160]
        
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
        
        // Check for stone calculator items
        const stoneItems = section.items.filter((item: any) => item.category === 'Calcolatore Pietra')
        
        for (const item of section.items) {
          checkPageBreak(10)
          
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
        }
        
        // Stone Calculator Details Table
        if (stoneItems.length > 0) {
          checkPageBreak(50)
          y += 5
          
          // Get stone item details
          const pietraItem = stoneItems.find((item: any) => item.productName.includes('PIETRA'))
          
          // Extract SP and MQ
          const mq = pietraItem?.quantity || 0
          const spMatch = pietraItem?.productName.match(/SP\.\s*(\d+(?:\.\d+)?)/i)
          const sp = spMatch ? parseFloat(spMatch[1]) : 2
          
          // Header with title and parameters
          pdf.setFillColor(255, 251, 235) // amber-50
          pdf.rect(margin, y, contentWidth, 8, 'F')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(146, 64, 14) // amber-800
          pdf.text('DETTAGLIO CALCOLO PIETRA', margin + 2, y + 5)
          pdf.text(`SP: ${sp} cm`, margin + 80, y + 5)
          pdf.text(`MQ Totali: ${mq.toFixed(2)} mq`, margin + 110, y + 5)
          pdf.setTextColor(0, 0, 0)
          y += 8
          
          // Table column headers
          const stoneColWidths = [70, 30, 35, 35]
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
          
          // Data rows
          pdf.setFont('helvetica', 'normal')
          
          if (pietraItem) {
            pdf.text('PIETRA', stoneColX[0] + 2, y + 4)
            pdf.text(`${pietraItem.quantity.toFixed(2)}`, stoneColX[1] + 2, y + 4)
            pdf.text(`€ ${pietraItem.price.toFixed(2)}`, stoneColX[2] + 2, y + 4)
            pdf.text(`€ ${pietraItem.total.toFixed(2)}`, stoneColX[3] + 2, y + 4)
            y += 6
          }
          
          // Total row
          const stoneTotalCalc = pietraItem?.total || 0
          pdf.setFillColor(248, 249, 250)
          pdf.rect(margin, y, contentWidth, 7, 'F')
          pdf.setFont('helvetica', 'bold')
          pdf.text('TOTALE', stoneColX[0] + 2, y + 5)
          pdf.text(`€ ${stoneTotalCalc.toFixed(2)}`, stoneColX[3] + 2, y + 5)
          y += 10
        }

        y += 5

        // Risks
        if (section.risks && section.risks.length > 0) {
          checkPageBreak(20)
          
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
          }
          
          y += 5
        }

        // Engobbio
        const engobbio = section.engobbio || 0
        if (engobbio > 0) {
          checkPageBreak(10)
          
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Engobbio', margin + 2, y + 4)
          pdf.text(`€ ${engobbio.toFixed(2)}`, margin + contentWidth - 30, y + 4)
          pdf.setFont('helvetica', 'italic')
          pdf.setFontSize(8)
          pdf.text('vedere preventivo allegato', margin + 2, y + 8)
          y += 12
        }

        // Finitura
        const finitura = section.finitura || 0
        if (finitura > 0) {
          checkPageBreak(10)
          
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Finitura', margin + 2, y + 4)
          pdf.text(`€ ${finitura.toFixed(2)}`, margin + contentWidth - 30, y + 4)
          pdf.setFont('helvetica', 'italic')
          pdf.setFontSize(8)
          pdf.text('vedere preventivo allegato', margin + 2, y + 8)
          y += 12
        }

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
        
        // Add mq and €/mq if available
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
      }

      // Riepilogo Sezioni
      checkPageBreak(20 + (quoteData.sections.length * 7))
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
        const sectionItemsTotal = section.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
        const sectionRisksTotal = (section.risks || []).reduce((sum: number, risk: any) => {
          if (risk.appliedToItemId === 'SECTION_TOTAL') {
            return sum + (sectionItemsTotal * (risk.percentage / 100))
          } else {
            const targetItem = section.items.find((item: any) => item.id === risk.appliedToItemId)
            return sum + (targetItem ? (targetItem.quantity * targetItem.price) * (risk.percentage / 100) : 0)
          }
        }, 0)
        const engobbio = section.engobbio || 0
        const finitura = section.finitura || 0
        const sectionTotal = sectionItemsTotal + sectionRisksTotal + engobbio + finitura
       const sectionQty = section.quantity || 1
       const sectionTotalWithQty = sectionTotal * sectionQty
        
        pdf.setFontSize(9)
       const sectionNameLabel = sectionQty > 1 ? `${section.name} (x${sectionQty})` : section.name
       pdf.text(sectionNameLabel, margin + 2, y)
       pdf.text(`€ ${sectionTotalWithQty.toFixed(2)}`, margin + contentWidth - 2, y, { align: 'right' })
        y += 6
      }
      
      y += 5

      // Grand Total
      checkPageBreak(20)
      y += 5
      pdf.setDrawColor(0, 123, 255)
      pdf.setLineWidth(0.5)
      pdf.line(margin, y, margin + contentWidth, y)
      y += 10
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`TOTALE: € ${quoteData.totalAmount.toFixed(2)}`, margin + contentWidth, y, { align: 'right' })

      // ── Enamel Cost Appendix ──
      // Normalize enamel data: support both flat array (legacy) and per-section map
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
        currentPage++
        y = margin

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('ALLEGATO: COSTI SMALTO', pageWidth / 2, y, { align: 'center' })
        y += 12

        for (const enamelSection of allEnamelSections) {
          if (enamelSection.sectionName) {
            checkPageBreak(12)
            pdf.setFontSize(11)
            pdf.setFont('helvetica', 'bold')
            pdf.text(enamelSection.sectionName, margin, y)
            y += 8
          }

          // Table headers
          const eCols = ['ID', 'Descrizione', 'Finit.', 'Sp.', 'L1×L2', 'Mq Mod', 'Pz', '%', '€/Mq', 'Tot Cer.', 'Imb.', 'Prof.', 'TOTALE']
          const eWidths = [8, 30, 15, 10, 18, 14, 8, 8, 14, 18, 14, 14, 18]
          const eX: number[] = []
          let cx = margin
          for (const w of eWidths) { eX.push(cx); cx += w }

          pdf.setFillColor(248, 249, 250)
          pdf.rect(margin, y, contentWidth, 7, 'F')
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'bold')
          for (let i = 0; i < eCols.length; i++) {
            pdf.text(eCols[i], eX[i] + 1, y + 5)
          }
          y += 7

          pdf.setFont('helvetica', 'normal')
          let enamelSectionTotal = 0

          for (let ri = 0; ri < enamelSection.rows.length; ri++) {
            checkPageBreak(8)
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
            for (let i = 0; i < vals.length; i++) {
              pdf.text(vals[i], eX[i] + 1, y + 4)
            }
            y += 6
          }

          // Section total
          checkPageBreak(10)
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
      checkPageBreak(15)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Preventivo generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, y, { align: 'center' })
      y += 5
      pdf.text('Questo preventivo è valido per 30 giorni dalla data di emissione.', pageWidth / 2, y, { align: 'center' })

      // Add page numbers to all pages
      addPageNumber()

      pdf.save(`preventivo-${quoteData.quoteNumber}.pdf`)
      
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error)
      throw error
    }
  }

  return { generatePdf }
}