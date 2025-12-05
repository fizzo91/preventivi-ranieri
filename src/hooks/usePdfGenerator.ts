import jsPDF from 'jspdf'

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

      const checkPageBreak = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - margin) {
          pdf.addPage()
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
        pdf.text(section.name, margin + 2, y)
        y += 10

        if (section.description) {
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'italic')
          const descLines = pdf.splitTextToSize(section.description, contentWidth - 4)
          pdf.text(descLines, margin + 2, y)
          y += (descLines.length * 4) + 3
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
        
        // Stone Calculator Details
        if (stoneItems.length > 0) {
          checkPageBreak(50)
          y += 5
          
          pdf.setFillColor(255, 251, 235) // amber-50
          pdf.rect(margin, y, contentWidth, 8, 'F')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(146, 64, 14) // amber-800
          pdf.text('DETTAGLIO CALCOLO PIETRA', margin + 2, y + 5)
          pdf.setTextColor(0, 0, 0)
          y += 12
          
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          
          // Get MQ from the first stone item
          const pietraItem = stoneItems.find((item: any) => item.productName.includes('PIETRA'))
          const smaltItem = stoneItems.find((item: any) => item.productName.includes('SMALTATURA'))
          const imballoItem = stoneItems.find((item: any) => item.productName.includes('IMBALLO'))
          
          if (pietraItem) {
            const mq = pietraItem.quantity
            // Extract SP from product name (e.g., "PIETRA SP. 2" -> 2)
            const spMatch = pietraItem.productName.match(/SP\.\s*(\d+(?:\.\d+)?)/i)
            const sp = spMatch ? parseFloat(spMatch[1]) : 2
            
            pdf.setFont('helvetica', 'bold')
            pdf.text('Parametri:', margin + 2, y)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`SP (Spessore): ${sp} cm   |   MQ Totali: ${mq.toFixed(2)} mq`, margin + 30, y)
            y += 6
            
            pdf.setFont('helvetica', 'bold')
            pdf.text('Formule utilizzate:', margin + 2, y)
            y += 5
            
            pdf.setFont('helvetica', 'normal')
            pdf.text(`PIETRA = (35 x SP) + (20 x SP x MQ) = (35 x ${sp}) + (20 x ${sp} x ${mq.toFixed(2)}) = ${pietraItem.total.toFixed(2)}`, margin + 2, y)
            y += 5
          }
          
          if (smaltItem) {
            const mq = smaltItem.quantity
            const spMatch = pietraItem?.productName.match(/SP\.\s*(\d+(?:\.\d+)?)/i)
            const sp = spMatch ? parseFloat(spMatch[1]) : 2
            
            pdf.text(`ENGOBBIO = (80 + (SP x 20) - 90) + ((MQ x 45) - 15)`, margin + 2, y)
            y += 4
            pdf.text(`SMALTATURA = 80 + (20 x SP) + (45 x MQ)`, margin + 2, y)
            y += 4
            pdf.text(`TOT. SMALTATURA (Engobbio + Smaltatura) = ${smaltItem.total.toFixed(2)}`, margin + 2, y)
            y += 5
          }
          
          if (imballoItem) {
            const mq = imballoItem.quantity
            pdf.text(`IMBALLO = 5 + 4 + (MQ x 3) = 5 + 4 + (${mq.toFixed(2)} x 3) = ${imballoItem.total.toFixed(2)}`, margin + 2, y)
            y += 5
          }
          
          // Total from calculator
          const stoneTotalCalc = stoneItems.reduce((sum: number, item: any) => sum + item.total, 0)
          y += 3
          pdf.setFont('helvetica', 'bold')
          pdf.text(`Totale Calcolatore Pietra: ${stoneTotalCalc.toFixed(2)}`, margin + 2, y)
          y += 8
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
        
        const sectionTotal = sectionItemsTotal + sectionRisksTotal + finitura
        
        pdf.setFillColor(248, 249, 250)
        pdf.rect(margin, y, contentWidth, 8, 'F')
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Totale Sezione: € ${sectionTotal.toFixed(2)}`, margin + contentWidth - 2, y + 5, { align: 'right' })
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
        const finitura = section.finitura || 0
        const sectionTotal = sectionItemsTotal + sectionRisksTotal + finitura
        
        pdf.setFontSize(9)
        pdf.text(section.name, margin + 2, y)
        pdf.text(`€ ${sectionTotal.toFixed(2)}`, margin + contentWidth - 2, y, { align: 'right' })
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
      
      // Footer
      y += 15
      checkPageBreak(15)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Preventivo generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, y, { align: 'center' })
      y += 5
      pdf.text('Questo preventivo è valido per 30 giorni dalla data di emissione.', pageWidth / 2, y, { align: 'center' })

      pdf.save(`preventivo-${quoteData.quoteNumber}.pdf`)
      
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error)
      throw error
    }
  }

  return { generatePdf }
}