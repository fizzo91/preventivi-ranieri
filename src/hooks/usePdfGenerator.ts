import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
      // Create a temporary div to render the quote content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm' // A4 width
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.padding = '20mm'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      
      // Calculate total
      const total = quoteData.totalAmount

      // Generate HTML content for the PDF
      tempDiv.innerHTML = `
        <div style="max-width: 170mm; margin: 0 auto; color: #333;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5;">
            <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">PREVENTIVO</h1>
            <p style="font-size: 16px; color: #666; margin: 5px 0 0 0;">N. ${quoteData.quoteNumber}</p>
          </div>

          <!-- Client Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1a1a1a; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #e5e5e5; padding-bottom: 5px;">CLIENTE</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>${quoteData.client.name}</strong></p>
            ${quoteData.client.company ? `<p style="margin: 5px 0; font-size: 14px;">${quoteData.client.company}</p>` : ''}
            ${quoteData.client.email ? `<p style="margin: 5px 0; font-size: 14px;">Email: ${quoteData.client.email}</p>` : ''}
            ${quoteData.client.phone ? `<p style="margin: 5px 0; font-size: 14px;">Tel: ${quoteData.client.phone}</p>` : ''}
            ${quoteData.client.address ? `<p style="margin: 5px 0; font-size: 14px;">Indirizzo: ${quoteData.client.address}</p>` : ''}
          </div>

          <!-- Quote Sections -->
          ${quoteData.sections.map((section, sectionIndex) => {
            const sectionItemsTotal = section.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
            const sectionRisksTotal = (section.risks || []).reduce((sum: number, risk: any) => {
              if (risk.appliedToItemId === 'SECTION_TOTAL') {
                return sum + (sectionItemsTotal * (risk.percentage / 100));
              } else {
                const targetItem = section.items.find((item: any) => item.id === risk.appliedToItemId);
                return sum + (targetItem ? targetItem.total * (risk.percentage / 100) : 0);
              }
            }, 0);
            const sectionTotal = sectionItemsTotal + sectionRisksTotal;
            
            return `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #1a1a1a; font-size: 16px; margin-bottom: 15px; background: #f8f9fa; padding: 10px; border-left: 4px solid #007bff;">
                ${section.name}
              </h3>
              
              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 12px; font-weight: bold;">Prodotto</th>
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 12px; font-weight: bold; width: 100px;">Categoria</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px; font-weight: bold; width: 60px;">Qtà</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px; font-weight: bold; width: 50px;">U.M.</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px; font-weight: bold; width: 80px;">Prezzo</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px; font-weight: bold; width: 80px;">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  ${section.items.map((item: any) => `
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${item.productName || item.description || 'Prodotto'}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${item.category || '-'}</td>
                      <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px;">${item.quantity}</td>
                      <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 12px;">${item.unit || '-'}</td>
                      <td style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px;">€ ${item.price.toFixed(2)}</td>
                      <td style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px;">€ ${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              ${(section.risks && section.risks.length > 0) ? `
                <div style="margin-top: 15px;">
                  <h4 style="color: #1a1a1a; font-size: 14px; margin-bottom: 10px; background: #fef2f2; padding: 8px; border-left: 3px solid #dc3545;">
                    Rischi Sezione
                  </h4>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <thead>
                      <tr style="background: #fef2f2;">
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; font-weight: bold;">Descrizione</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; font-weight: bold;">Applicato a</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 11px; font-weight: bold; width: 80px;">%</th>
                        <th style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 11px; font-weight: bold; width: 90px;">Importo</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${section.risks.map((risk: any) => {
                        let appliedToProduct = 'N/A';
                        let riskAmount = 0;
                        
                        if (risk.appliedToItemId === 'SECTION_TOTAL') {
                          appliedToProduct = '🔷 Totale Sezione';
                          riskAmount = sectionItemsTotal * (risk.percentage / 100);
                        } else {
                          const appliedToItem = section.items.find((item: any) => item.id === risk.appliedToItemId);
                          appliedToProduct = appliedToItem ? (appliedToItem.productName || appliedToItem.description || 'Prodotto') : 'N/A';
                          riskAmount = appliedToItem ? appliedToItem.total * (risk.percentage / 100) : 0;
                        }
                        
                        return `
                        <tr>
                          <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${risk.description}</td>
                          <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${appliedToProduct}</td>
                          <td style="padding: 8px; text-align: center; border: 1px solid #ddd; font-size: 11px;">${risk.percentage}%</td>
                          <td style="padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 11px; color: #dc3545;">€ ${riskAmount.toFixed(2)}</td>
                        </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
              
              <div style="text-align: right; margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                <strong style="font-size: 14px;">Totale Sezione: € ${sectionTotal.toFixed(2)}</strong>
              </div>
              
              ${section.description ? `<p style="font-size: 12px; color: #666; font-style: italic; margin-top: 10px;">${section.description}</p>` : ''}
            </div>
            `;
          }).join('')}

          <!-- Totals -->
          <div style="margin-top: 40px; border-top: 2px solid #e5e5e5; padding-top: 20px;">
            <table style="width: 100%; max-width: 300px; margin-left: auto;">
              <tr style="border-top: 2px solid #007bff;">
                <td style="padding: 10px; font-size: 18px; text-align: right; font-weight: bold; color: #007bff;">TOTALE:</td>
                <td style="padding: 10px; font-size: 18px; text-align: right; font-weight: bold; color: #007bff;">€ ${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 12px;">
            <p>Preventivo generato il ${new Date().toLocaleDateString('it-IT')}</p>
            <p>Questo preventivo è valido per 30 giorni dalla data di emissione.</p>
          </div>
        </div>
      `

      document.body.appendChild(tempDiv)

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      document.body.removeChild(tempDiv)

      // Create PDF
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm  
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Download the PDF
      pdf.save(`preventivo-${quoteData.quoteNumber}.pdf`)
      
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error)
      throw error
    }
  }

  return { generatePdf }
}