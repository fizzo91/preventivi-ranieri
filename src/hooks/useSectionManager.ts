/**
 * Custom hook that encapsulates all quote section management logic.
 * Extracted from NewQuote.tsx to separate business logic from UI.
 */
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import type { QuoteSection, QuoteItem, Risk } from "@/types/quote"
import type { Product } from "@/hooks/useProducts"
import type { SectionTemplate } from "@/hooks/useSectionTemplates"
import type { StoneCalculatorResult } from "@/components/StoneCalculator"
import { uploadChartImage, removeChartImage, regenerateSignedUrl } from "@/services/storageService"
import {
  createEmptySection,
  createEmptyItem,
  createEmptyRisk,
  calculateSectionTotal,
  roundUp,
} from "@/utils"

export function useSectionManager(initialSections?: QuoteSection[]) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [sections, setSections] = useState<QuoteSection[]>(
    initialSections || [createEmptySection("Progetto Principale", "main")]
  )

  // Recalculate section totals when items/risks change
  useEffect(() => {
    setSections(prevSections => {
      let hasChanges = false
      const updated = prevSections.map(section => {
        const newTotal = calculateSectionTotal(section)
        if (Math.abs(newTotal - section.total) > 0.001) {
          hasChanges = true
          return { ...section, total: newTotal }
        }
        return section
      })
      return hasChanges ? updated : prevSections
    })
  }, [JSON.stringify(sections.map(s => ({
    id: s.id,
    items: s.items.map(i => ({ id: i.id, total: i.total })),
    risks: s.risks.map(r => ({ id: r.id, percentage: r.percentage, appliedToItemId: r.appliedToItemId })),
    engobbio: s.engobbio,
    finitura: s.finitura,
  })))])

  // Regenerate signed URLs for sections with chartImagePath
  const regenerateSignedUrls = useCallback(async (secs: QuoteSection[]): Promise<QuoteSection[]> => {
    return Promise.all(
      secs.map(async (section) => {
        if (section.chartImagePath) {
          const url = await regenerateSignedUrl(section.chartImagePath)
          if (url) return { ...section, chartImage: url }
        }
        return section
      })
    )
  }, [])

  const addSection = useCallback(() => {
    setSections(prev => [...prev, createEmptySection(`Sezione ${prev.length + 1}`)])
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setSections(prev => prev.length > 1 ? prev.filter(s => s.id !== sectionId) : prev)
  }, [])

  const duplicateSection = useCallback((sectionId: string) => {
    setSections(prev => {
      const source = prev.find(s => s.id === sectionId)
      if (!source) return prev

      const ts = Date.now()
      const copy: QuoteSection = {
        ...source,
        id: ts.toString(),
        name: `${source.name} (Copia)`,
        items: source.items.map((item, i) => ({ ...item, id: `${ts}-item-${i}` })),
        risks: source.risks.map((risk, i) => ({ ...risk, id: `${ts}-risk-${i}` })),
      }
      return [...prev, copy]
    })
    toast({ title: "Sezione duplicata" })
  }, [toast])

  const updateSection = useCallback(<K extends keyof QuoteSection>(
    sectionId: string,
    field: K,
    value: QuoteSection[K]
  ) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, [field]: value } : s))
  }, [])

  const addItem = useCallback((sectionId: string): QuoteItem => {
    const newItem = createEmptyItem()
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s
    ))
    return newItem
  }, [])

  const removeItem = useCallback((sectionId: string, itemId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId && s.items.length > 1) {
        return { ...s, items: s.items.filter(i => i.id !== itemId) }
      }
      return s
    }))
  }, [])

  const updateItem = useCallback((sectionId: string, itemId: string, field: keyof QuoteItem, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'price') {
            updated.total = updated.quantity * updated.price
          }
          return updated
        }),
      }
    }))
  }, [])

  const selectProduct = useCallback((sectionId: string, itemId: string, product: Product) => {
    const price = product.price_dt
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        items: s.items.map(item => {
          if (item.id !== itemId) return item
          return {
            ...item,
            productId: product.id,
            productName: product.name,
            category: product.category,
            description: product.description || "",
            price,
            unit: product.unit,
            total: item.quantity * price,
          }
        }),
      }
    }))
  }, [])

  const addRisk = useCallback((sectionId: string) => {
    const newRisk = createEmptyRisk()
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, risks: [...s.risks, newRisk] } : s
    ))
  }, [])

  const updateRisk = useCallback((sectionId: string, riskId: string, field: keyof Risk, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        risks: s.risks.map(r => r.id === riskId ? { ...r, [field]: value } : r),
      }
    }))
  }, [])

  const removeRisk = useCallback((sectionId: string, riskId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      return { ...s, risks: s.risks.filter(r => r.id !== riskId) }
    }))
  }, [])

  const handleStoneCalculatorConfirm = useCallback((sectionId: string, result: StoneCalculatorResult) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section

      const filteredItems = section.items.filter(item =>
        !['pietra', 'smaltatura', 'imballo'].some(keyword =>
          item.productName.toLowerCase().includes(keyword)
        )
      )

      const ts = Date.now()
      const newItems: QuoteItem[] = [{
        id: `${ts}-pietra`,
        productId: "",
        productName: `PIETRA SP. ${result.spessore}`,
        category: "Calcolatore Pietra",
        description: `${result.totalMq.toFixed(2)} mq`,
        quantity: roundUp(result.totalMq),
        price: result.totalMq > 0 ? roundUp(result.costoTotale / result.totalMq) : 0,
        unit: "mq",
        total: roundUp(result.costoTotale),
      }]

      return { ...section, items: [...filteredItems, ...newItems] }
    }))
  }, [])

  const uploadSectionImage = useCallback(async (sectionId: string, file: File) => {
    if (!user) {
      toast({ title: "Errore", description: "Devi essere autenticato.", variant: "destructive" })
      return
    }

    const result = await uploadChartImage(user.id, sectionId, file)
    if (!result.success) {
      toast({ title: "Errore upload", description: result.error, variant: "destructive" })
      return
    }

    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, chartImage: result.signedUrl, chartImagePath: result.filePath } : s
    ))
    toast({ title: "Immagine caricata" })
  }, [user, toast])

  const removeSectionImage = useCallback(async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    try {
      await removeChartImage(section.chartImagePath, section.chartImage)
    } catch (error) {
      console.error('Remove error:', error)
    }

    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, chartImage: undefined, chartImagePath: undefined } : s
    ))
    toast({ title: "Immagine rimossa" })
  }, [sections, toast])

  const loadFromTemplate = useCallback((template: SectionTemplate) => {
    const ts = Date.now()
    const newSection: QuoteSection = {
      ...createEmptySection(template.name, ts.toString()),
      description: template.description || "",
      items: template.items.map((item: any, i: number) => ({ ...item, id: `${ts}-item-${i}` })),
      tags: template.tags || [],
      complexity: template.complexity || undefined,
      risk: template.risk || undefined,
    }
    setSections(prev => [...prev, newSection])
    toast({ title: "Template caricato", description: `Sezione "${template.name}" creata dal template` })
  }, [toast])

  const addSuggestedProducts = useCallback((sectionId: string, products: Product[]) => {
    const newItems: QuoteItem[] = products.map((product, i) => ({
      id: `${Date.now()}-${i}`,
      productId: product.id,
      productName: product.name,
      category: product.category,
      description: product.description || "",
      quantity: 1,
      price: product.price_dt,
      unit: product.unit,
      total: product.price_dt,
    }))

    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, items: [...s.items, ...newItems] } : s
    ))
  }, [])

  return {
    sections,
    setSections,
    addSection,
    removeSection,
    duplicateSection,
    updateSection,
    addItem,
    removeItem,
    updateItem,
    selectProduct,
    addRisk,
    updateRisk,
    removeRisk,
    handleStoneCalculatorConfirm,
    uploadSectionImage,
    removeSectionImage,
    loadFromTemplate,
    addSuggestedProducts,
    regenerateSignedUrls,
  }
}
