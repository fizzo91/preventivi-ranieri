import { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Plus, Trash2, Save, GripVertical, Copy, Calculator, ImagePlus, X, AlertTriangle, TrendingDown, Palette } from "lucide-react"
import { StoneCalculator, StoneCalculatorResult } from "@/components/StoneCalculator"
import { ProductSuggestions } from "@/components/ProductSuggestions"
import { useToast } from "@/hooks/use-toast"
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
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProducts, useCreateProduct } from "@/hooks/useProducts"
import { useCreateQuote, useUpdateQuote, useQuote } from "@/hooks/useQuotes"
import { useRecentProductIds } from "@/hooks/useRecentProducts"
import { useProductSuggestions } from "@/hooks/useProductSuggestions"
import { useAuth } from "@/contexts/AuthContext"
import { TagInput } from "@/components/TagInput"
import { ComplexityRiskIndicator } from "@/components/ComplexityRiskIndicator"
import { SaveTemplateDialog, LoadTemplateDialog } from "@/components/SectionTemplateDialog"
import { Badge } from "@/components/ui/badge"
import { useThicknessAverages } from "@/hooks/useThicknessAverages"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LoadingSpinner } from "@/components/shared"
import { useSectionManager } from "@/hooks/useSectionManager"
import { calculateGrandTotal } from "@/utils/quoteCalculations"
import type { QuoteItem, QuoteSection, PriceWarning } from "@/types/quote"
import type { Product } from "@/hooks/useProducts"
import { EnamelCostDialog } from "@/components/EnamelCostDialog"
import type { EnamelPieceRow } from "@/components/EnamelCostCalculator"

// ── SortableItem (extracted inline component) ──────────────────────────

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
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price_em: 0, price_dt: 0, category: "", unit: "mq" })

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const productOptions = products.map(p => ({ value: p.id, label: p.name, unit: p.unit }))

  const handleAddProduct = () => {
    if (newProduct.name && (newProduct.price_em > 0 || newProduct.price_dt > 0)) {
      onAddProduct(newProduct)
      setNewProduct({ name: "", description: "", price_em: 0, price_dt: 0, category: "", unit: "mq" })
      setIsAddProductOpen(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-card">
      <div className="md:col-span-1 flex items-end">
        <div {...attributes} {...listeners} className="p-2 hover:bg-muted rounded cursor-move">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="md:col-span-4 space-y-2">
        <Label>Prodotto</Label>
        <div className="flex gap-2">
          <div className="flex-1">
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
              <Button variant="outline" size="icon" className="shrink-0"><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi Prodotto Custom</DialogTitle>
                <DialogDescription>Crea un nuovo prodotto da utilizzare nel preventivo</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Prodotto</Label>
                  <Input id="name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="es. Pietra Lavica Premium" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea id="description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Descrizione del prodotto..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="es. Pietra" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unità</Label>
                    <Input id="unit" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} placeholder="es. mq, ml, pz" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priceDT">Prezzo (€)</Label>
                  <Input id="priceDT" type="number" step="0.01" value={newProduct.price_dt} onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0
                    setNewProduct({ ...newProduct, price_dt: price, price_em: price })
                  }} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>Annulla</Button>
                <Button onClick={handleAddProduct}>Aggiungi Prodotto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Quantità</Label>
        <div className="flex items-center gap-2">
          <Input type="number" step="0.01" value={item.quantity} onChange={(e) => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
          {item.unit && <span className="text-sm text-muted-foreground">{item.unit}</span>}
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Prezzo €</Label>
        <Input type="number" step="0.01" value={item.price} onChange={(e) => onUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)} />
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Totale</Label>
        <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-medium">€ {item.total.toFixed(2)}</div>
      </div>
      <div className="md:col-span-1 space-y-2">
        <Label className="invisible">Azioni</Label>
        <Button variant="outline" size="sm" onClick={() => onRemoveItem(item.id)} disabled={!canRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

const NewQuote = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editIdFromUrl = searchParams.get("edit")
  const editQuoteFromState = location.state?.editQuote
  const { data: editQuoteFromDb } = useQuote(editIdFromUrl || "")
  const editQuote = editQuoteFromState || editQuoteFromDb

  const { data: products = [], isLoading: productsLoading } = useProducts()
  const recentProductIds = useRecentProductIds()
  const createProduct = useCreateProduct()
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  const thicknessAverages = useThicknessAverages()

  const {
    sections, setSections,
    addSection, removeSection, duplicateSection, updateSection,
    addItem, removeItem, updateItem, selectProduct: selectProductInSection,
    addRisk, updateRisk, removeRisk,
    handleStoneCalculatorConfirm,
    uploadSectionImage, removeSectionImage,
    loadFromTemplate, addSuggestedProducts, regenerateSignedUrls,
  } = useSectionManager()

  const [clientData, setClientData] = useState({ name: "", email: "", phone: "", address: "", company: "" })
  const [quoteData, setQuoteData] = useState({ number: `PREV-${Date.now()}`, date: new Date().toISOString().split('T')[0], validUntil: "", notes: "", status: "draft" })
  const [stoneCalculatorOpen, setStoneCalculatorOpen] = useState(false)
  const [stoneCalculatorSectionId, setStoneCalculatorSectionId] = useState<string | null>(null)
  const [activeSuggestion, setActiveSuggestion] = useState<{ sectionId: string; itemId: string; productId: string; productName: string } | null>(null)
  const suggestions = useProductSuggestions(activeSuggestion?.productId || null)
  const [enamelDataMap, setEnamelDataMap] = useState<Record<string, EnamelPieceRow[]>>({})
  const [enamelDialogOpen, setEnamelDialogOpen] = useState(false)
  const [enamelDialogSectionId, setEnamelDialogSectionId] = useState<string | null>(null)

  const getSectionPriceWarning = (section: QuoteSection): PriceWarning | null => {
    const pietra = section.items.find(item => item.productName?.match(/^PIETRA/i))
    if (!pietra) return null
    const spMatch = pietra.productName?.match(/Sp\.?\s*(\d+)\s*(?:mm)?/i)
    const spessore = spMatch ? parseInt(spMatch[1]) : null
    if (!spessore) return null
    const mq = section.mqTotali
    if (!mq || mq <= 0) return null
    const avg = thicknessAverages[spessore]
    if (!avg || avg.avgCostPerMq <= 0) return null
    const sectionCostPerMq = section.total / mq
    const pctDiff = ((sectionCostPerMq / avg.avgCostPerMq - 1) * 100)
    if (pctDiff > 15) return { type: 'above', sectionCostPerMq, avgCostPerMq: avg.avgCostPerMq, pctDiff: pctDiff.toFixed(0), thickness: spessore }
    if (pctDiff < -15) return { type: 'below', sectionCostPerMq, avgCostPerMq: avg.avgCostPerMq, pctDiff: Math.abs(pctDiff).toFixed(0), thickness: spessore }
    return null
  }

  const openStoneCalculator = (sectionId: string) => {
    setStoneCalculatorSectionId(sectionId)
    setStoneCalculatorOpen(true)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Load edit quote data
  useEffect(() => {
    const loadEditQuote = async () => {
      if (!editQuote) return
      setClientData({ name: editQuote.client_name || "", email: editQuote.client_email || "", phone: editQuote.client_phone || "", address: editQuote.client_address || "", company: editQuote.client_company || "" })
      setQuoteData({ number: editQuote.quote_number || `PREV-${Date.now()}`, date: editQuote.date || new Date().toISOString().split('T')[0], validUntil: editQuote.validity_days ? new Date(new Date(editQuote.date).getTime() + editQuote.validity_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "", notes: editQuote.notes || "", status: editQuote.status || "draft" })
      if (editQuote.sections && Array.isArray(editQuote.sections) && editQuote.sections.length > 0) {
        const sectionsWithRisks = editQuote.sections.map((section: any) => ({ ...section, risks: section.risks || [] }))
        const sectionsWithUrls = await regenerateSignedUrls(sectionsWithRisks)
        setSections(sectionsWithUrls)
      }
      if (editQuote.enamel_data) {
        // Handle both old flat array format and new per-section map format
        const raw = editQuote.enamel_data
        if (Array.isArray(raw)) {
          // Legacy: flat array — assign to first section
          const firstSectionId = editQuote.sections?.[0]?.id
          if (firstSectionId && raw.length > 0) {
            setEnamelDataMap({ [firstSectionId]: raw as EnamelPieceRow[] })
          }
        } else if (typeof raw === 'object' && raw !== null) {
          setEnamelDataMap(raw as Record<string, EnamelPieceRow[]>)
        }
      }
    }
    loadEditQuote()
  }, [editQuote])

  const handleSelectProduct = (sectionId: string, itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) selectProductInSection(sectionId, itemId, product)
  }

  const handleAddItem = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    const lastProduct = section?.items.filter(i => i.productId).slice(-1)[0]
    const newItem = addItem(sectionId)
    if (lastProduct) {
      setActiveSuggestion({ sectionId, itemId: newItem.id, productId: lastProduct.productId, productName: lastProduct.productName })
    }
  }

  const handleAddSuggestions = useCallback((productIds: string[]) => {
    if (!activeSuggestion) return
    const selectedProducts = productIds.map(id => products.find(p => p.id === id)).filter((p): p is Product => !!p)
    addSuggestedProducts(activeSuggestion.sectionId, selectedProducts)
    setActiveSuggestion(null)
  }, [activeSuggestion, products, addSuggestedProducts])

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const activeSection = sections.find(s => s.items.some(i => i.id === active.id))
      if (activeSection) {
        const oldIndex = activeSection.items.findIndex(i => i.id === active.id)
        const newIndex = activeSection.items.findIndex(i => i.id === over.id)
        setSections(sections.map(s => s.id === activeSection.id ? { ...s, items: arrayMove(s.items, oldIndex, newIndex) } : s))
      }
    }
  }

  const totalAmount = calculateGrandTotal(sections)

  const addProductHandler = async (product: Omit<Product, "id" | "user_id" | "created_at" | "updated_at">) => {
    await createProduct.mutateAsync(product)
    toast({ title: "Prodotto Aggiunto", description: `${product.name} è stato aggiunto alla lista prodotti` })
  }

  const duplicateQuote = () => {
    setQuoteData({ ...quoteData, number: `PREV-${Date.now()}` })
    toast({ title: "Preventivo duplicato", description: "Assegna un nuovo numero preventivo." })
  }

  const saveQuote = async () => {
    // Warning if any section has no risks
    const sectionsWithoutRisks = sections.filter(s => s.risks.length === 0)
    if (sectionsWithoutRisks.length > 0) {
      const names = sectionsWithoutRisks.map(s => `"${s.name}"`).join(", ")
      const confirmed = window.confirm(
        `Attenzione: ${sectionsWithoutRisks.length === 1 ? 'la sezione' : 'le sezioni'} ${names} non ${sectionsWithoutRisks.length === 1 ? 'ha' : 'hanno'} rischi aggiunti.\n\nVuoi salvare comunque?`
      )
      if (!confirmed) return
    }

    const validUntilDate = quoteData.validUntil ? new Date(quoteData.validUntil) : null
    const dateObj = new Date(quoteData.date)
    const validityDays = validUntilDate ? Math.ceil((validUntilDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)) : 30

    const payload = {
      quote_number: quoteData.number, date: quoteData.date, validity_days: validityDays,
      client_id: null, client_name: clientData.name, client_email: clientData.email || null,
      client_phone: clientData.phone || null, client_company: clientData.company || null,
      client_address: clientData.address || null, client_vat_number: null, client_fiscal_code: null,
      sections, total_amount: totalAmount, status: quoteData.status,
      notes: quoteData.notes || null, payment_terms: null,
      enamel_data: Object.keys(enamelDataMap).length > 0 ? enamelDataMap : null,
    }

    try {
      if (editQuote) {
        await updateQuote.mutateAsync({ id: editQuote.id, ...payload })
      } else {
        await createQuote.mutateAsync(payload)
      }
      navigate('/quotes')
    } catch {
      toast({ title: "Errore", description: "Si è verificato un errore durante il salvataggio", variant: "destructive" })
    }
  }

  if (productsLoading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{editQuote ? 'Modifica Preventivo' : 'Nuovo Preventivo'}</h1>
          <p className="text-muted-foreground mt-1">Lavorazione Pietra Lavica Smaltata</p>
        </div>
         <div className="flex flex-wrap gap-2">
          <Button onClick={duplicateQuote} variant="outline" className="gap-2"><Copy className="h-4 w-4" />Duplica</Button>
          <Button onClick={saveQuote} className="gap-2" disabled={createQuote.isPending || updateQuote.isPending}><Save className="h-4 w-4" />Salva</Button>
        </div>
      </div>

      {/* Quote Info */}
      <Card>
        <CardHeader><CardTitle>Informazioni Preventivo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quote-number">Numero Preventivo</Label>
            <Input id="quote-number" value={quoteData.number} onChange={(e) => setQuoteData({ ...quoteData, number: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome Cliente</Label>
            <Input id="client-name" value={clientData.name} onChange={(e) => setClientData({ ...clientData, name: e.target.value })} placeholder="Es. Mario Rossi" />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Progetti e Lavorazioni</h2>
        {sections.map((section) => (
          <div key={section.id} className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <Input value={section.name} onChange={(e) => updateSection(section.id, 'name', e.target.value)} className="text-lg font-semibold border-none p-0 h-auto bg-transparent flex-1 min-w-0" />
                  <ComplexityRiskIndicator type="C" value={section.complexity} onChange={(v) => updateSection(section.id, 'complexity', v)} />
                  <ComplexityRiskIndicator type="R" value={section.risk} onChange={(v) => updateSection(section.id, 'risk', v)} />
                </div>

                {section.tags && section.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {section.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                )}

                <Textarea value={section.description} onChange={(e) => updateSection(section.id, 'description', e.target.value)} placeholder="Descrizione sezione (opzionale)..." className="text-sm border-none p-0 h-auto bg-transparent resize-none min-h-[40px]" rows={2} />

                {/* Stats row */}
                {(() => {
                  const warning = getSectionPriceWarning(section)
                  return (
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-3 py-2 ${warning?.type === 'above' ? 'bg-destructive/10 border border-destructive/30' : warning?.type === 'below' ? 'bg-sky-500/10 border border-sky-500/30' : 'bg-muted/40'}`}>
                      <div className="text-lg font-bold text-primary whitespace-nowrap">Totale: € {section.total.toFixed(2)}</div>
                      {warning && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`flex items-center gap-1 ${warning.type === 'above' ? 'text-destructive' : 'text-sky-500'}`}>
                                {warning.type === 'above' ? <AlertTriangle className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                <span className="text-xs font-medium">{warning.type === 'above' ? '+' : '-'}{warning.pctDiff}%</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-medium">Prezzo {warning.type === 'above' ? 'sopra' : 'sotto'} la media per {warning.thickness} mm</p>
                              <p className="text-xs mt-1">€/mq sezione: € {warning.sectionCostPerMq.toFixed(2)} — Media: € {warning.avgCostPerMq.toFixed(2)}/mq ({warning.type === 'above' ? '+' : '-'}{warning.pctDiff}%)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">mq:</Label>
                        <Input type="number" step="0.01" value={section.mqTotali || ''} onChange={(e) => {
                          const mq = parseFloat(e.target.value) || 0
                          setSections(sections.map(s => s.id === section.id ? { ...s, mqTotali: mq > 0 ? mq : undefined, euroPerMq: mq > 0 ? s.total / mq : undefined } : s))
                        }} className="h-8 w-20" placeholder="0.00" />
                      </div>
                      {section.mqTotali && section.mqTotali > 0 && (
                        <div className="text-sm font-medium bg-background px-2 py-1 rounded whitespace-nowrap">€/mq: {(section.total / section.mqTotali).toFixed(2)}</div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Qtà:</Label>
                        <Input type="number" min="1" step="1" value={section.quantity || 1} onChange={(e) => {
                          const qty = parseInt(e.target.value) || 1
                          setSections(sections.map(s => s.id === section.id ? { ...s, quantity: Math.max(1, qty) } : s))
                        }} className="h-8 w-16" />
                      </div>
                      {(section.quantity || 1) > 1 && (
                        <div className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">Tot x{section.quantity}: € {(section.total * (section.quantity || 1)).toFixed(2)}</div>
                      )}
                    </div>
                  )
                })()}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => openStoneCalculator(section.id)} size="sm" variant="outline" className="gap-1.5"><Calculator className="h-4 w-4" />Calc. Pietra</Button>
                  <Button onClick={() => { setEnamelDialogSectionId(section.id); setEnamelDialogOpen(true) }} size="sm" variant="outline" className="gap-1.5">
                    <Palette className="h-4 w-4" />Costi Smalto
                    {(enamelDataMap[section.id]?.length || 0) > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold">{enamelDataMap[section.id].length}</span>}
                  </Button>
                  <SaveTemplateDialog sectionName={section.name} items={section.items} tags={section.tags} complexity={section.complexity} risk={section.risk} />
                  <Button onClick={() => duplicateSection(section.id)} size="sm" variant="outline" className="gap-1.5"><Copy className="h-4 w-4" />Duplica</Button>
                  {sections.length > 1 && (
                    <Button onClick={() => removeSection(section.id)} size="sm" variant="outline" className="gap-1.5 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Chart Image */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  {section.chartImage ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Grafico/Schema</span>
                        <Button variant="outline" size="sm" onClick={() => removeSectionImage(section.id)} className="gap-2 text-destructive hover:text-destructive"><X className="h-4 w-4" />Rimuovi</Button>
                      </div>
                      <img src={section.chartImage} alt={`Grafico ${section.name}`} className="max-w-full max-h-96 rounded-lg border object-contain mx-auto" />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors">
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carica Grafico/Immagine</span>
                      <span className="text-xs text-muted-foreground">(JPG, PNG, WEBP - max 5MB)</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadSectionImage(section.id, file)
                      }} />
                    </label>
                  )}
                </div>

                {/* Tags */}
                <div className="border-b pb-4">
                  <Label className="text-sm text-muted-foreground mb-2 block">Tags/Etichette</Label>
                  <TagInput tags={section.tags || []} onChange={(tags) => updateSection(section.id, 'tags', tags)} />
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={section.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {section.items.map((item, itemIndex) => (
                        <div key={item.id} className="space-y-2">
                          <SortableItem
                            item={item} products={products} recentProductIds={recentProductIds}
                            onSelectProduct={(itemId, productId) => handleSelectProduct(section.id, itemId, productId)}
                            onUpdateItem={(itemId, field, value) => updateItem(section.id, itemId, field, value)}
                            onRemoveItem={(itemId) => removeItem(section.id, itemId)}
                            canRemove={section.items.length > 1}
                            onAddProduct={addProductHandler}
                          />
                          {activeSuggestion?.sectionId === section.id && activeSuggestion?.itemId === item.id && suggestions.length > 0 && (
                            <ProductSuggestions suggestions={suggestions} productName={activeSuggestion.productName} onAddSuggestions={handleAddSuggestions} onDismiss={() => setActiveSuggestion(null)} />
                          )}
                          {itemIndex === section.items.length - 1 && (
                            <Button onClick={() => handleAddItem(section.id)} variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 hover:border-primary/50">
                              <Plus className="h-4 w-4" />Aggiungi voce
                            </Button>
                          )}
                        </div>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>

                {/* Risks */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm text-muted-foreground">Gestione Rischi Sezione</h4>
                    <Button onClick={() => addRisk(section.id)} variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" />Aggiungi Rischio</Button>
                  </div>
                  {section.risks.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-2">Nessun rischio aggiunto per questa sezione</p>
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
                              <Input value={risk.description} onChange={(e) => updateRisk(section.id, risk.id, 'description', e.target.value)} placeholder="Es. Rischio rotture" className="h-9" />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                              <Label className="text-xs">Voce di Riferimento</Label>
                              <Combobox
                                options={[
                                  { value: 'SECTION_TOTAL', label: `🔷 Totale Sezione (€${itemsTotal.toFixed(2)})` },
                                  ...section.items.map(item => ({ value: item.id, label: `${item.productName || 'Prodotto'} (€${item.total.toFixed(2)})` }))
                                ]}
                                value={risk.appliedToItemId} placeholder="Seleziona voce..." searchPlaceholder="Cerca voce..."
                                onSelect={(value) => updateRisk(section.id, risk.id, 'appliedToItemId', value)}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label className="text-xs">Percentuale %</Label>
                              <Input type="number" min="0" max="100" step="0.1" value={risk.percentage} onChange={(e) => updateRisk(section.id, risk.id, 'percentage', parseFloat(e.target.value) || 0)} className="h-9" />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                              <Label className="text-xs">Importo Rischio</Label>
                              <div className="h-9 px-3 py-2 bg-background rounded-md flex items-center font-medium text-sm">€ {amount.toFixed(2)}</div>
                            </div>
                            <div className="md:col-span-1 space-y-2">
                              <Label className="invisible text-xs">Azioni</Label>
                              <Button variant="outline" size="sm" onClick={() => removeRisk(section.id, risk.id)} className="h-9 w-full"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Engobbio & Finitura */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">Engobbio</h4>
                      <p className="text-xs text-muted-foreground italic">vedere preventivo allegato</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">€</span>
                      <Input type="number" value={section.engobbio || 0} onChange={(e) => updateSection(section.id, 'engobbio', parseFloat(e.target.value) || 0)} className="w-32 text-right" step="0.01" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm">Finitura</h4>
                      <p className="text-xs text-muted-foreground italic">vedere preventivo allegato</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">€</span>
                      <Input type="number" value={section.finitura} onChange={(e) => updateSection(section.id, 'finitura', parseFloat(e.target.value) || 0)} className="w-32 text-right" step="0.01" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <div className="flex gap-2">
                <Button onClick={addSection} variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" />Nuova Sezione</Button>
                <LoadTemplateDialog onLoad={loadFromTemplate} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Riepilogo Finale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold">Totali per Sezione:</h3>
            {sections.map((section) => (
              <div key={section.id} className="flex justify-between text-sm">
                <span>{section.name}{(section.quantity || 1) > 1 ? ` (x${section.quantity})` : ''}:</span>
                <span>€ {(section.total * (section.quantity || 1)).toFixed(2)}</span>
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

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Note</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={quoteData.notes} onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })} placeholder="Note aggiuntive per il cliente (condizioni di pagamento, tempi di consegna, etc.)..." rows={4} />
        </CardContent>
      </Card>

      <StoneCalculator open={stoneCalculatorOpen} onOpenChange={setStoneCalculatorOpen} onConfirm={(result) => {
        if (stoneCalculatorSectionId) handleStoneCalculatorConfirm(stoneCalculatorSectionId, result)
      }} />
      {enamelDialogSectionId && (
        <EnamelCostDialog
          open={enamelDialogOpen}
          onOpenChange={(open) => { setEnamelDialogOpen(open); if (!open) setEnamelDialogSectionId(null) }}
          value={enamelDataMap[enamelDialogSectionId] || []}
          onChange={(rows) => setEnamelDataMap(prev => ({ ...prev, [enamelDialogSectionId!]: rows }))}
          sectionName={sections.find(s => s.id === enamelDialogSectionId)?.name || ""}
        />
      )}
    </div>
  )
}

export default NewQuote
