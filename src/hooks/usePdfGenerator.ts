import { generateFullPdf } from '@/utils/pdf/generateFullPdf'
import type { QuoteData } from '@/utils/pdf/pdfBase'

export type { QuoteData } from '@/utils/pdf/pdfBase'

/**
 * Hook exposing PDF generation. The full PDF now includes the synthetic
 * summary as an appendix, so a single entry point is enough.
 */
export const usePdfGenerator = () => {
  const generatePdf = async (quoteData: QuoteData) => {
    try {
      await generateFullPdf(quoteData)
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error)
      throw error
    }
  }

  return { generatePdf }
}
