import { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, Eye, GripVertical, FolderPlus, Copy, Loader2, Calculator, ImagePlus, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { StoneCalculator, StoneCalculatorResult } from "@/components/StoneCalculator"
import { ProductSuggestions } from "@/components/ProductSuggestions"
import { useToast } from "@/hooks/use-toast"
import { validateImageFile, getContentTypeForExtension } from "@/lib/fileValidation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProducts, useCreateProduct } from "@/hooks/useProducts"
import { useCreateQuote, useUpdateQuote, useQuote } from "@/hooks/useQuotes"
import { useRecentProductIds } from "@/hooks/useRecentProducts"
import { useProductSuggestions } from "@/hooks/useProductSuggestions"
import { useAuth } from "@/contexts/AuthContext"

interface Product {
  id: string
  name: string
  description: string | null
  price_em: number
  price_dt: number
  category: string
  unit: string
}

interface QuoteSection {
  id: string
  name: string
  description: string
  chartImage?: string
  chartImagePath?: string
  items: QuoteItem[]
  risks: Risk[]
  engobbio: number
  finitura: number
  total: number
  mqTotali?: number
  euroPerMq?: number
}

interface QuoteItem {
  id: string
  productId: string
  productName: string
  category: string
  description: string
  quantity: number
  price: number
  unit: string
  total: number
}

interface Risk {
  id: string
  description: string
  percentage: number
  appliedToItemId: string
  amount: number
}

interface SortableItemProps {
  item: QuoteItem
  products: Product[]
  recentProductIds: string[]
  onSelectProduct: (itemId: string, productId: string) => void
  onUpdateItem: (id: string, field: keyof QuoteItem, value: any) => void
  onRemoveItem: (id: string) => void
  canRemove: boolean
  onAddProduct: (product: Omit<Product, "id" | "user_id" | "created_at" | "updated_at">) => void
}

function SortableItem({ item, products, recentProductIds, onSelectProduct, onUpdateItem, onRemoveItem, canRemove, onAddProduct }: SortableItemProps) {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price_em: 0,
    price_dt: 0,
    category: "",
    unit: "mq"
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name,
    unit: product.unit
  }))

  const handleAddProduct = () => {
    if (newProduct.name && (newProduct.price_em > 0 || newProduct.price_dt > 0)) {
      onAddProduct(newProduct)
      setNewProduct({
        name: "",
        description: "",
        price_em: 0,
        price_dt: 0,
        category: "",
        unit: "mq"
      })
      setIsAddProductOpen(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-card"
    >
      <div className="md:col-span-1 flex items-end">
        <div
          {...attributes}
          {...listeners}
          className="p-2 hover:bg-muted rounded cursor-move"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="md:col-span-4 space-y-2">
        <Label>Prodotto</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            {/* Se è un prodotto fisso dalla calcolatrice, mostra solo il nome */}
            {item.productName && !item.productId ? (
              <div className="h-10 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center font-medium text-amber-800 dark:text-amber-200">
                {item.productName}
              </div>
            ) : (
              <Combobox
                options={productOptions}
                value={item.productId}
                placeholder="Cerca prodotto..."
                searchPlaceholder="Digita per cercare..."
                recentIds={recentProductIds}
                onSelect={(value) => onSelectProduct(item.id, value)}
              />
            )}
          </div>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi Prodotto Custom</DialogTitle>
                <DialogDescription>
                  Crea un nuovo prodotto da utilizzare nel preventivo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Prodotto</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="es. Pietra Lavica Premium"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Descrizione del prodotto..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="es. Pietra"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unità</Label>
                    <Input
                      id="unit"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                      placeholder="es. mq, ml, pz"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priceDT">Prezzo (€)</Label>
                  <Input
                    id="priceDT"
                    type="number"
                    step="0.01"
                    value={newProduct.price_dt}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0
                      setNewProduct({ ...newProduct, price_dt: price, price_em: price })
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleAddProduct}>
                  Aggiungi Prodotto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Quantità</Label>
        <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          value={item.quantity}
          onChange={(e) => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
        />
          {item.unit && <span className="text-sm text-muted-foreground">{item.unit}</span>}
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Prezzo €</Label>
        <Input
          type="number"
          step="0.01"
          value={item.price}
          onChange={(e) => onUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Totale</Label>
        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-medium">
          € {item.total.toFixed(2)}
        </div>
      </div>
      <div className="md:col-span-1 space-y-2">
        <Label className="invisible">Azioni</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemoveItem(item.id)}
          disabled={!canRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const NewQuote = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editIdFromUrl = searchParams.get("edit")
  const editQuoteFromState = location.state?.editQuote
  
  // Carica il preventivo dal database se abbiamo l'ID nella URL
  const { data: editQuoteFromDb } = useQuote(editIdFromUrl || "")
  
  // Usa il preventivo dallo state oppure dal database
  const editQuote = editQuoteFromState || editQuoteFromDb
  
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const recentProductIds = useRecentProductIds()
  const createProduct = useCreateProduct()
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: ""
  })

  const [quoteData, setQuoteData] = useState({
    number: `PREV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    validUntil: "",
    notes: "",
    status: "draft"
  })

  const [sections, setSections] = useState<QuoteSection[]>([
    {
      id: "main",
      name: "Progetto Principale",
      description: "",
      items: [
        { id: "1", productId: "", productName: "", category: "", description: "", quantity: 1, price: 0, unit: "", total: 0 }
      ],
      risks: [],
      engobbio: 0,
      finitura: 0,
      total: 0,
      mqTotali: undefined,
      euroPerMq: undefined
    }
  ])

  const [stoneCalculatorOpen, setStoneCalculatorOpen] = useState(false)
  const [stoneCalculatorSectionId, setStoneCalculatorSectionId] = useState<string | null>(null)
  
  // State for product suggestions
  const [activeSuggestion, setActiveSuggestion] = useState<{
    sectionId: string;
    itemId: string;
    productId: string;
    productName: string;
  } | null>(null)
  
  // Hook for product suggestions
  const suggestions = useProductSuggestions(activeSuggestion?.productId || null)

  const openStoneCalculator = (sectionId: string) => {
    setStoneCalculatorSectionId(sectionId)
    setStoneCalculatorOpen(true)
  }

  // Funzione per arrotondare per eccesso a 2 decimali
  const roundUp = (value: number): number => Math.ceil(value * 100) / 100

  const handleStoneCalculatorConfirm = (result: StoneCalculatorResult) => {
    if (stoneCalculatorSectionId) {
      setSections(sections.map(section => {
        if (section.id === stoneCalculatorSectionId) {
          // Rimuovi eventuali item pietra esistenti
          const filteredItems = section.items.filter(item => 
            !['pietra', 'smaltatura', 'imballo'].some(keyword => 
              item.productName.toLowerCase().includes(keyword)
            )
          )
          
          const timestamp = Date.now()
          const newItems: QuoteItem[] = [
            {
              id: `${timestamp}-pietra`,
              productId: "",
              productName: `PIETRA SP. ${result.spessore}`,
              category: "Calcolatore Pietra",
              description: `${result.totalMq.toFixed(2)} mq`,
              quantity: roundUp(result.totalMq),
              price: result.totalMq > 0 ? roundUp(result.costoTotale / result.totalMq) : 0,
              unit: "mq",
              total: roundUp(result.costoTotale)
            }
          ]
          
          return { ...section, items: [...filteredItems, ...newItems] }
        }
        return section
      }))
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Regenerate signed URLs for sections with chartImagePath
  const regenerateSignedUrls = async (sections: QuoteSection[]): Promise<QuoteSection[]> => {
    const updatedSections = await Promise.all(
      sections.map(async (section) => {
        if (section.chartImagePath) {
          try {
            const { data, error } = await supabase.storage
              .from('section-charts')
              .createSignedUrl(section.chartImagePath, 60 * 60 * 24 * 365) // 1 year
            
            if (!error && data?.signedUrl) {
              return { ...section, chartImage: data.signedUrl }
            }
          } catch (e) {
            console.error('Error regenerating signed URL:', e)
          }
        }
        return section
      })
    )
    return updatedSections
  }

  // Pre-popola i dati quando si modifica un preventivo esistente
  useEffect(() => {
    const loadEditQuote = async () => {
      if (editQuote) {
        setClientData({
          name: editQuote.client_name || "",
          email: editQuote.client_email || "",
          phone: editQuote.client_phone || "",
          address: editQuote.client_address || "",
          company: editQuote.client_company || ""
        })
        
        setQuoteData({
          number: editQuote.quote_number || `PREV-${Date.now()}`,
          date: editQuote.date || new Date().toISOString().split('T')[0],
          validUntil: editQuote.validity_days ? new Date(new Date(editQuote.date).getTime() + editQuote.validity_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
          notes: editQuote.notes || "",
          status: editQuote.status || "draft"
        })

        if (editQuote.sections && Array.isArray(editQuote.sections) && editQuote.sections.length > 0) {
          const sectionsWithRisks = editQuote.sections.map((section: any) => ({
            ...section,
            risks: section.risks || []
          }))
          // Regenerate signed URLs for images
          const sectionsWithUrls = await regenerateSignedUrls(sectionsWithRisks)
          setSections(sectionsWithUrls)
        }
      }
    }
    loadEditQuote()
  }, [editQuote])

  // Ricalcola totali delle sezioni quando cambia il contenuto degli items o risks
  useEffect(() => {
    const depsKey = sections.map(s => 
      `${s.id}:${s.items.map(i => `${i.id}-${i.total}`).join(',')}:${s.risks.map(r => `${r.id}-${r.percentage}-${r.appliedToItemId}`).join(',')}:${s.engobbio}:${s.finitura}`
    ).join('|')
    
    setSections(prevSections => {
      let hasChanges = false
      const updatedSections = prevSections.map(section => {
        const itemsTotal = section.items.reduce((sum, item) => sum + item.total, 0)
        
        const risksTotal = section.risks.reduce((sum, risk) => {
          if (risk.appliedToItemId === 'SECTION_TOTAL') {
            return sum + (itemsTotal * (risk.percentage / 100))
          } else {
            const targetItem = section.items.find(item => item.id === risk.appliedToItemId)
            return sum + (targetItem ? targetItem.total * (risk.percentage / 100) : 0)
          }
        }, 0)
        
        const newTotal = itemsTotal + risksTotal + (section.engobbio || 0) + section.finitura
        if (Math.abs(newTotal - section.total) > 0.001) {
          hasChanges = true
          return { ...section, total: newTotal }
        }
        return section
      })
      return hasChanges ? updatedSections : prevSections
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sections.map(s => ({ 
    id: s.id, 
    items: s.items.map(i => ({ id: i.id, total: i.total })), 
    risks: s.risks.map(r => ({ id: r.id, percentage: r.percentage, appliedToItemId: r.appliedToItemId })),
    engobbio: s.engobbio,
    finitura: s.finitura 
  })))])

  const addSection = () => {
    const newSection: QuoteSection = {
      id: Date.now().toString(),
      name: `Sezione ${sections.length + 1}`,
      description: "",
      items: [
        { id: Date.now().toString() + "-item", productId: "", productName: "", category: "", description: "", quantity: 1, price: 0, unit: "", total: 0 }
      ],
      risks: [],
      engobbio: 0,
      finitura: 0,
      total: 0,
      mqTotali: undefined,
      euroPerMq: undefined
    }
    setSections([...sections, newSection])
  }

  const updateSectionName = (sectionId: string, newName: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, name: newName } : section
    ))
  }

  const updateSectionDescription = (sectionId: string, newDescription: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, description: newDescription } : section
    ))
  }

  const removeSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== sectionId))
    }
  }

  // Upload chart image for a section with secure validation
  const uploadSectionChart = async (sectionId: string, file: File) => {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per caricare immagini.",
        variant: "destructive"
      })
      return
    }

    try {
      // Validate file securely
      const validation = await validateImageFile(file)
      if (!validation.valid) {
        toast({
          title: "File non valido",
          description: validation.error,
          variant: "destructive"
        })
        return
      }

      // Include user_id in path for RLS policy compliance
      const fileName = `${user.id}/${sectionId}-${validation.sanitizedFilename}`
      const extension = fileName.split('.').pop() || 'jpg'
      const contentType = getContentTypeForExtension(extension)

      const { error: uploadError } = await supabase.storage
        .from('section-charts')
        .upload(fileName, file, {
          contentType,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Use signed URL for private bucket access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('section-charts')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year expiry

      if (signedUrlError) throw signedUrlError

      setSections(sections.map(section =>
        section.id === sectionId ? { 
          ...section, 
          chartImage: signedUrlData.signedUrl,
          chartImagePath: fileName // Store path for deletion
        } : section
      ))

      toast({
        title: "Immagine caricata",
        description: "Il grafico è stato caricato con successo."
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Errore upload",
        description: "Impossibile caricare l'immagine. Riprova.",
        variant: "destructive"
      })
    }
  }

  // Remove chart image from a section
  const removeSectionChart = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section?.chartImagePath) {
      // Fallback: try to extract from signed URL
      if (section?.chartImage) {
        const urlParts = section.chartImage.split('/section-charts/')
        if (urlParts.length > 1) {
          const pathWithParams = urlParts[1]
          const filePath = pathWithParams.split('?')[0] // Remove query params
          try {
            await supabase.storage.from('section-charts').remove([filePath])
          } catch (error) {
            console.error('Remove error:', error)
          }
        }
      }
    } else {
      try {
        await supabase.storage.from('section-charts').remove([section.chartImagePath])
      } catch (error) {
        console.error('Remove error:', error)
      }
    }

    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, chartImage: undefined, chartImagePath: undefined } : s
    ))

    toast({
      title: "Immagine rimossa",
      description: "Il grafico è stato rimosso con successo."
    })
  }

  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = sections.find(section => section.id === sectionId)
    if (!sectionToDuplicate) return

    const timestamp = Date.now()
    const duplicatedSection: QuoteSection = {
      id: timestamp.toString(),
      name: `${sectionToDuplicate.name} (Copia)`,
      description: sectionToDuplicate.description,
      items: sectionToDuplicate.items.map((item, index) => ({
        ...item,
        id: `${timestamp}-item-${index}`
      })),
      risks: sectionToDuplicate.risks.map((risk, index) => ({
        ...risk,
        id: `${timestamp}-risk-${index}`
      })),
      engobbio: sectionToDuplicate.engobbio || 0,
      finitura: sectionToDuplicate.finitura,
      total: sectionToDuplicate.total
    }

    setSections([...sections, duplicatedSection])
    toast({
      title: "Sezione duplicata",
      description: `La sezione "${sectionToDuplicate.name}" è stata duplicata con successo.`
    })
  }

  const duplicateQuote = () => {
    const timestamp = Date.now()
    setQuoteData({
      ...quoteData,
      number: `PREV-${timestamp}`
    })
    toast({
      title: "Preventivo duplicato",
      description: "Il preventivo è stato duplicato con successo. Assegna un nuovo numero preventivo.",
    })
  }

  const addItem = (sectionId: string) => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      category: "",
      description: "",
      quantity: 1,
      price: 0,
      unit: "",
      total: 0
    }
    
    // Find the last product in this section to trigger suggestions
    const section = sections.find(s => s.id === sectionId)
    const lastProductWithId = section?.items
      .filter(item => item.productId)
      .slice(-1)[0]
    
    if (lastProductWithId) {
      setActiveSuggestion({
        sectionId,
        itemId: newItem.id,
        productId: lastProductWithId.productId,
        productName: lastProductWithId.productName
      })
    }
    
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, items: [...section.items, newItem] }
        : section
    ))
  }

  const removeItem = (sectionId: string, itemId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId && section.items.length > 1) {
        return { ...section, items: section.items.filter(item => item.id !== itemId) }
      }
      return section
    }))
  }

  const selectProduct = (sectionId: string, itemId: string, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    if (selectedProduct) {
      const price = selectedProduct.price_dt  // Sempre DT
      setSections(sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  productId: productId,
                  productName: selectedProduct.name,
                  category: selectedProduct.category,
                  description: selectedProduct.description || "",
                  price: price,
                  unit: selectedProduct.unit,
                  total: item.quantity * price
                }
              }
              return item
            })
          }
        }
        return section
      }))
      
    }
  }
  
  // Handler to add suggested products
  const handleAddSuggestions = useCallback((productIds: string[]) => {
    if (!activeSuggestion) return
    
    const newItems: QuoteItem[] = productIds.map((productId, index) => {
      const product = products.find(p => p.id === productId)
      if (!product) return null
      return {
        id: `${Date.now()}-${index}`,
        productId: product.id,
        productName: product.name,
        category: product.category,
        description: product.description || "",
        quantity: 1,
        price: product.price_dt,
        unit: product.unit,
        total: product.price_dt
      }
    }).filter((item): item is QuoteItem => item !== null)
    
    setSections(sections.map(section => {
      if (section.id === activeSuggestion.sectionId) {
        return {
          ...section,
          items: [...section.items, ...newItems]
        }
      }
      return section
    }))
    
    setActiveSuggestion(null)
  }, [activeSuggestion, products, sections])
  
  const dismissSuggestions = useCallback(() => {
    setActiveSuggestion(null)
  }, [])

  const updateItem = (sectionId: string, itemId: string, field: keyof QuoteItem, value: any) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id === itemId) {
              const updated = { ...item, [field]: value }
              if (field === 'quantity' || field === 'price') {
                updated.total = updated.quantity * updated.price
              }
              return updated
            }
            return item
          })
        }
      }
      return section
    }))
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const activeSection = sections.find(section => 
        section.items.some(item => item.id === active.id)
      )
      
      if (activeSection) {
        const oldIndex = activeSection.items.findIndex(item => item.id === active.id)
        const newIndex = activeSection.items.findIndex(item => item.id === over.id)
        
        setSections(sections.map(section => {
          if (section.id === activeSection.id) {
            return {
              ...section,
              items: arrayMove(section.items, oldIndex, newIndex)
            }
          }
          return section
        }))
      }
    }
  }

  const totalAmount = sections.reduce((sum, section) => sum + section.total, 0)

  const addRisk = (sectionId: string) => {
    const newRisk: Risk = {
      id: Date.now().toString(),
      description: "Rischio aggiuntivo",
      percentage: 0,
      appliedToItemId: "",
      amount: 0
    }
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, risks: [...section.risks, newRisk] }
        : section
    ))
  }

  const updateRisk = (sectionId: string, riskId: string, field: keyof Risk, value: any) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          risks: section.risks.map(risk => 
            risk.id === riskId ? { ...risk, [field]: value } : risk
          )
        }
      }
      return section
    }))
  }

  const removeRisk = (sectionId: string, riskId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          risks: section.risks.filter(risk => risk.id !== riskId)
        }
      }
      return section
    }))
  }

  const addProductHandler = async (product: Omit<Product, "id" | "user_id" | "created_at" | "updated_at">) => {
    await createProduct.mutateAsync(product)
    toast({
      title: "Prodotto Aggiunto",
      description: `${product.name} è stato aggiunto alla lista prodotti`,
    })
  }

  const saveQuote = async () => {
    const validUntilDate = quoteData.validUntil ? new Date(quoteData.validUntil) : null
    const dateObj = new Date(quoteData.date)
    const validityDays = validUntilDate ? Math.ceil((validUntilDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)) : 30

    const quotePayload = {
      quote_number: quoteData.number,
      date: quoteData.date,
      validity_days: validityDays,
      client_id: null,
      client_name: clientData.name,
      client_email: clientData.email || null,
      client_phone: clientData.phone || null,
      client_company: clientData.company || null,
      client_address: clientData.address || null,
      client_vat_number: null,
      client_fiscal_code: null,
      sections: sections,
      total_amount: totalAmount,
      status: quoteData.status,
      notes: quoteData.notes || null,
      payment_terms: null
    }

    try {
      if (editQuote) {
        await updateQuote.mutateAsync({ id: editQuote.id, ...quotePayload })
        toast({
          title: "Preventivo Modificato",
          description: "Le modifiche sono state salvate con successo",
        })
      } else {
        await createQuote.mutateAsync(quotePayload)
        toast({
          title: "Preventivo Salvato",
          description: "Il preventivo è stato salvato con successo",
        })
      }
      navigate('/quotes')
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive"
      })
    }
  }

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{editQuote ? 'Modifica Preventivo' : 'Nuovo Preventivo'}</h1>
          <p className="text-muted-foreground mt-1">
            Lavorazione Pietra Lavica Smaltata
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Anteprima
          </Button>
          <Button onClick={duplicateQuote} variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Duplica Preventivo
          </Button>
          <Button onClick={saveQuote} className="gap-2" disabled={createQuote.isPending || updateQuote.isPending}>
            <Save className="h-4 w-4" />
            Salva
          </Button>
        </div>
      </div>

      {/* Informazioni Preventivo - Semplificato */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Preventivo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quote-number">Numero Preventivo</Label>
            <Input
              id="quote-number"
              value={quoteData.number}
              onChange={(e) => setQuoteData({...quoteData, number: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome Cliente</Label>
            <Input
              id="client-name"
              value={clientData.name}
              onChange={(e) => setClientData({...clientData, name: e.target.value})}
              placeholder="Es. Mario Rossi"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sezioni del Preventivo */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Progetti e Lavorazioni</h2>

        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="space-y-4">
            <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex-1 space-y-2">
                <Input
                  value={section.name}
                  onChange={(e) => updateSectionName(section.id, e.target.value)}
                  className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
                />
                <Textarea
                  value={section.description}
                  onChange={(e) => updateSectionDescription(section.id, e.target.value)}
                  placeholder="Descrizione sezione (opzionale)..."
                  className="text-sm border-none p-0 h-auto bg-transparent resize-none min-h-[40px]"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-primary">
                    Totale: € {section.total.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">mq:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={section.mqTotali || ''}
                      onChange={(e) => {
                        const mq = parseFloat(e.target.value) || 0
                        setSections(sections.map(s => 
                          s.id === section.id 
                            ? { ...s, mqTotali: mq > 0 ? mq : undefined, euroPerMq: mq > 0 ? s.total / mq : undefined }
                            : s
                        ))
                      }}
                      className="h-8 w-20"
                      placeholder="0.00"
                    />
                  </div>
                  {section.mqTotali && section.mqTotali > 0 && (
                    <div className="text-sm font-medium bg-muted px-2 py-1 rounded">
                      €/mq: {(section.total / section.mqTotali).toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={() => openStoneCalculator(section.id)} 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                  >
                    <Calculator className="h-4 w-4" />
                    Calc. Pietra
                  </Button>
                  <Button
                    onClick={() => duplicateSection(section.id)}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Duplica
                  </Button>
                  {sections.length > 1 && (
                    <Button
                      onClick={() => removeSection(section.id)}
                      size="sm"
                      variant="outline"
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chart Image Upload */}
              <div className="border rounded-lg p-4 bg-muted/30">
                {section.chartImage ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Grafico/Schema</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSectionChart(section.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                        Rimuovi
                      </Button>
                    </div>
                    <img
                      src={section.chartImage}
                      alt={`Grafico ${section.name}`}
                      className="max-w-full max-h-96 rounded-lg border object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Carica Grafico/Immagine</span>
                    <span className="text-xs text-muted-foreground">(JPG, PNG, WEBP - max 5MB)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Validation is now handled in uploadSectionChart
                          uploadSectionChart(section.id, file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Items */}
              <div className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={section.items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {section.items.map((item, itemIndex) => (
                      <div key={item.id} className="space-y-2">
                        <SortableItem
                          item={item}
                          products={products}
                          recentProductIds={recentProductIds}
                          onSelectProduct={(itemId, productId) => selectProduct(section.id, itemId, productId)}
                          onUpdateItem={(itemId, field, value) => updateItem(section.id, itemId, field, value)}
                          onRemoveItem={(itemId) => removeItem(section.id, itemId)}
                          canRemove={section.items.length > 1}
                          onAddProduct={addProductHandler}
                        />
                        {/* Product Suggestions Panel */}
                        {activeSuggestion?.sectionId === section.id && 
                         activeSuggestion?.itemId === item.id && 
                         suggestions.length > 0 && (
                          <ProductSuggestions
                            suggestions={suggestions}
                            productName={activeSuggestion.productName}
                            onAddSuggestions={handleAddSuggestions}
                            onDismiss={dismissSuggestions}
                          />
                        )}
                        {itemIndex === section.items.length - 1 && (
                          <Button 
                            onClick={() => addItem(section.id)} 
                            variant="ghost" 
                            size="sm" 
                            className="w-full gap-2 text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 hover:border-primary/50"
                          >
                            <Plus className="h-4 w-4" />
                            Aggiungi voce
                          </Button>
                        )}
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Risks for this section */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm text-muted-foreground">Gestione Rischi Sezione</h4>
                  <Button onClick={() => addRisk(section.id)} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Aggiungi Rischio
                  </Button>
                </div>
                
                {section.risks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-2">
                    Nessun rischio aggiunto per questa sezione
                  </p>
                ) : (
                  <div className="space-y-3">
                    {section.risks.map((risk) => {
                      const itemsTotal = section.items.reduce((sum, item) => sum + item.total, 0)
                      let amount = 0
                      
                      if (risk.appliedToItemId === 'SECTION_TOTAL') {
                        amount = itemsTotal * (risk.percentage / 100)
                      } else {
                        const targetItem = section.items.find(item => item.id === risk.appliedToItemId)
                        amount = targetItem ? targetItem.total * (risk.percentage / 100) : 0
                      }
                      
                      return (
                        <div key={risk.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-muted/30">
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs">Descrizione Rischio</Label>
                            <Input
                              value={risk.description}
                              onChange={(e) => updateRisk(section.id, risk.id, 'description', e.target.value)}
                              placeholder="Es. Rischio rotture"
                              className="h-9"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs">Voce di Riferimento</Label>
                            <Combobox
                              options={[
                                {
                                  value: 'SECTION_TOTAL',
                                  label: `🔷 Totale Sezione (€${itemsTotal.toFixed(2)})`,
                                },
                                ...section.items.map(item => ({
                                  value: item.id,
                                  label: `${item.productName || 'Prodotto'} (€${item.total.toFixed(2)})`,
                                }))
                              ]}
                              value={risk.appliedToItemId}
                              placeholder="Seleziona voce..."
                              searchPlaceholder="Cerca voce..."
                              onSelect={(value) => updateRisk(section.id, risk.id, 'appliedToItemId', value)}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-xs">Percentuale %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={risk.percentage}
                              onChange={(e) => updateRisk(section.id, risk.id, 'percentage', parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs">Importo Rischio</Label>
                            <div className="h-9 px-3 py-2 bg-background rounded-md flex items-center font-medium text-sm">
                              € {amount.toFixed(2)}
                            </div>
                          </div>
                          <div className="md:col-span-1 space-y-2">
                            <Label className="invisible text-xs">Azioni</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeRisk(section.id, risk.id)}
                              className="h-9 w-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Engobbio e Finitura */}
              <div className="space-y-2 pt-4 border-t">
                {/* Engobbio */}
                <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm">Engobbio</h4>
                    <p className="text-xs text-muted-foreground italic">vedere preventivo allegato</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">€</span>
                    <Input
                      type="number"
                      value={section.engobbio || 0}
                      onChange={(e) => {
                        const newEngobbio = parseFloat(e.target.value) || 0
                        setSections(sections.map(s => 
                          s.id === section.id ? { ...s, engobbio: newEngobbio } : s
                        ))
                      }}
                      className="w-32 text-right"
                      step="0.01"
                    />
                  </div>
                </div>
                {/* Finitura */}
                <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm">Finitura</h4>
                    <p className="text-xs text-muted-foreground italic">vedere preventivo allegato</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">€</span>
                    <Input
                      type="number"
                      value={section.finitura}
                      onChange={(e) => {
                        const newFinitura = parseFloat(e.target.value) || 0
                        setSections(sections.map(s => 
                          s.id === section.id ? { ...s, finitura: newFinitura } : s
                        ))
                      }}
                      className="w-32 text-right"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pulsante Nuova Sezione dopo ogni sezione */}
          <div className="flex justify-center">
            <Button 
              onClick={addSection} 
              variant="ghost" 
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Nuova Sezione
            </Button>
          </div>
        </div>
        ))}
      </div>

      {/* Totali */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Finale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold">Totali per Sezione:</h3>
            {sections.map((section) => (
              <div key={section.id} className="flex justify-between text-sm">
                <span>{section.name}:</span>
                <span>€ {section.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-xl font-bold">
              <span>TOTALE GENERALE:</span>
              <span className="text-primary">€ {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <Card>
        <CardHeader>
          <CardTitle>Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={quoteData.notes}
            onChange={(e) => setQuoteData({...quoteData, notes: e.target.value})}
            placeholder="Note aggiuntive per il cliente (condizioni di pagamento, tempi di consegna, etc.)..."
            rows={4}
          />
        </CardContent>
      </Card>
      {/* Stone Calculator Dialog */}
      <StoneCalculator
        open={stoneCalculatorOpen}
        onOpenChange={setStoneCalculatorOpen}
        onConfirm={handleStoneCalculatorConfirm}
      />
    </div>
  )
}

export default NewQuote
