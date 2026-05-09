import { generateFullPdf } from '@/utils/pdf/generateFullPdf'
import { generateSyntheticPdf } from '@/utils/pdf/generateSyntheticPdf'
import type { QuoteData } from '@/utils/pdf/pdfBase'

export type { QuoteData } from '@/utils/pdf/pdfBase'

/**
 * Hook exposing the two PDF generation flows.
 * Heavy rendering logic lives in `src/utils/pdf/*` to keep this hook tiny
 * and the bundle splittable.
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

  const generateSyntheticPdfWrapped = async (quoteData: QuoteData) => {
    try {
      await generateSyntheticPdf(quoteData)
    } catch (error) {
      console.error('Errore durante la generazione del PDF sintetico:', error)
      throw error
    }
  }

  return { generatePdf, generateSyntheticPdf: generateSyntheticPdfWrapped }
}
