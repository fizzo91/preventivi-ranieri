import { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus, Trash2, Save, Copy, Calculator, ImagePlus, X, Palette,
} from "lucide-react"
import { StoneCalculator } from "@/components/StoneCalculator"
import { ProductSuggestions } from "@/components/ProductSuggestions"
import { useToast } from "@/hooks/use-toast"
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useProducts, useCreateProduct } from "@/hooks/useProducts"
import { useCreateQuote, useUpdateQuote, useQuote } from "@/hooks/useQuotes"
import { useProject } from "@/hooks/useProjects"
import { useRecentProductIds } from "@/hooks/useRecentProducts"
import { useProductSuggestions } from "@/hooks/useProductSuggestions"
import { TagInput } from "@/components/TagInput"
import { ComplexityRiskIndicator } from "@/components/ComplexityRiskIndicator"
import { SaveTemplateDialog, LoadTemplateDialog } from "@/components/SectionTemplateDialog"
import { Badge } from "@/components/ui/badge"
import { useThicknessAverages } from "@/hooks/useThicknessAverages"
import { LoadingSpinner } from "@/components/shared"
import { useSectionManager } from "@/hooks/useSectionManager"
import { calculateGrandTotal } from "@/utils/quoteCalculations"
import type { QuoteSection, PriceWarning } from "@/types/quote"
import type { Product } from "@/hooks/useProducts"
import { EnamelCostDialog } from "@/components/EnamelCostDialog"
import type { EnamelPieceRow } from "@/components/EnamelCostCalculator"
import { SortableItem } from "@/components/quotes/SortableItem"
import { SectionRiskRow } from "@/components/quotes/SectionRiskRow"
import { SectionStatsBar } from "@/components/quotes/SectionStatsBar"

const PRICE_VARIANCE_THRESHOLD = 15
const DEFAULT_VALIDITY_DAYS = 30
const CALCULATOR_WINDOW_WIDTH = 700
const CALCULATOR_WINDOW_HEIGHT = 750

/** Compute a price-variance warning vs the user's avg €/mq for the given thickness. */
function computeSectionPriceWarning(
  section: QuoteSection,
  thicknessAverages: Record<number, { avgCostPerMq: number }>,
): PriceWarning | null {
  const pietra = section.items.find((item) => item.productName?.match(/^PIETRA/i))
  if (!pietra) return null

  const spMatch = pietra.productName?.match(/Sp\.?\s*(\d+)\s*(?:mm)?/i)
  const thickness = spMatch ? parseInt(spMatch[1]) : null
  if (!thickness) return null

  const mq = section.mqTotali
  if (!mq || mq <= 0) return null

  const avg = thicknessAverages[thickness]
  if (!avg || avg.avgCostPerMq <= 0) return null

  const sectionCostPerMq = section.total / mq
  const pctDiff = (sectionCostPerMq / avg.avgCostPerMq - 1) * 100

  if (pctDiff > PRICE_VARIANCE_THRESHOLD) {
    return { type: "above", sectionCostPerMq, avgCostPerMq: avg.avgCostPerMq, pctDiff: pctDiff.toFixed(0), thickness }
  }
  if (pctDiff < -PRICE_VARIANCE_THRESHOLD) {
    return { type: "below", sectionCostPerMq, avgCostPerMq: avg.avgCostPerMq, pctDiff: Math.abs(pctDiff).toFixed(0), thickness }
  }
  return null
}

/** Open the scientific calculator tool in a popup window linked to a quote. */
function openCalculatorPopup(quoteId: string, quoteName: string) {
  const left = (screen.width - CALCULATOR_WINDOW_WIDTH) / 2
  const top = (screen.height - CALCULATOR_WINDOW_HEIGHT) / 2
  window.open(
    `/tool/calculator?quoteId=${encodeURIComponent(quoteId)}&quoteName=${encodeURIComponent(quoteName)}`,
    `tool-calculator-${quoteId}`,
    `width=${CALCULATOR_WINDOW_WIDTH},height=${CALCULATOR_WINDOW_HEIGHT},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`,
  )
}

const NewQuote = () => {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editIdFromUrl = searchParams.get("edit")
  const projectIdFromUrl = searchParams.get("projectId")
  const editQuoteFromState = location.state?.editQuote
  const { data: editQuoteFromDb } = useQuote(editIdFromUrl || "")
  const editQuote = editQuoteFromState || editQuoteFromDb
  const { data: linkedProject } = useProject(projectIdFromUrl || undefined)

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
  const [quoteData, setQuoteData] = useState({
    number: `PREV-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    validUntil: "",
    notes: "",
    status: "draft",
  })
  const [stoneCalculatorOpen, setStoneCalculatorOpen] = useState(false)
  const [stoneCalculatorSectionId, setStoneCalculatorSectionId] = useState<string | null>(null)
  const [activeSuggestion, setActiveSuggestion] = useState<{
    sectionId: string; itemId: string; productId: string; productName: string
  } | null>(null)
  const suggestions = useProductSuggestions(activeSuggestion?.productId || null)
  const [enamelDataMap, setEnamelDataMap] = useState<Record<string, EnamelPieceRow[]>>({})
  const [enamelDialogOpen, setEnamelDialogOpen] = useState(false)
  const [enamelDialogSectionId, setEnamelDialogSectionId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Hydrate state when editing an existing quote.
  useEffect(() => {
    const loadEditQuote = async () => {
      if (!editQuote) return

      setClientData({
        name: editQuote.client_name || "",
        email: editQuote.client_email || "",
        phone: editQuote.client_phone || "",
        address: editQuote.client_address || "",
        company: editQuote.client_company || "",
      })

      setQuoteData({
        number: editQuote.quote_number || `PREV-${Date.now()}`,
        date: editQuote.date || new Date().toISOString().split("T")[0],
        validUntil: editQuote.validity_days
          ? new Date(new Date(editQuote.date).getTime() + editQuote.validity_days * 86400000)
              .toISOString()
              .split("T")[0]
          : "",
        notes: editQuote.notes || "",
        status: editQuote.status || "draft",
      })

      if (Array.isArray(editQuote.sections) && editQuote.sections.length > 0) {
        const sectionsWithRisks = editQuote.sections.map((s: any) => ({ ...s, risks: s.risks || [] }))
        const sectionsWithUrls = await regenerateSignedUrls(sectionsWithRisks)
        setSections(sectionsWithUrls)
      }

      if (editQuote.enamel_data) {
        const raw = editQuote.enamel_data
        if (Array.isArray(raw)) {
          // Legacy flat array → assign to first section
          const firstSectionId = editQuote.sections?.[0]?.id
          if (firstSectionId && raw.length > 0) {
            setEnamelDataMap({ [firstSectionId]: raw as EnamelPieceRow[] })
          }
        } else if (typeof raw === "object" && raw !== null) {
          setEnamelDataMap(raw as Record<string, EnamelPieceRow[]>)
        }
      }
    }
    loadEditQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editQuote])

  // Prefill client from a linked project (when arriving via /new-quote?projectId=...)
  useEffect(() => {
    if (!editQuote && linkedProject) {
      setClientData({
        name: linkedProject.client_name ?? "",
        email: linkedProject.client_email ?? "",
        phone: linkedProject.client_phone ?? "",
        address: linkedProject.client_address ?? "",
        company: linkedProject.client_company ?? "",
      })
    }
  }, [editQuote, linkedProject])

  const handleSelectProduct = (sectionId: string, itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) selectProductInSection(sectionId, itemId, product)
  }

  const handleAddItem = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    const lastProduct = section?.items.filter((i) => i.productId).slice(-1)[0]
    const newItem = addItem(sectionId)
    if (lastProduct) {
      setActiveSuggestion({
        sectionId,
        itemId: newItem.id,
        productId: lastProduct.productId,
        productName: lastProduct.productName,
      })
    }
  }

  const handleAddSuggestions = useCallback(
    (productIds: string[]) => {
      if (!activeSuggestion) return
      const selectedProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p)
      addSuggestedProducts(activeSuggestion.sectionId, selectedProducts)
      setActiveSuggestion(null)
    },
    [activeSuggestion, products, addSuggestedProducts],
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id === over.id) return
    const activeSection = sections.find((s) => s.items.some((i) => i.id === active.id))
    if (!activeSection) return
    const oldIndex = activeSection.items.findIndex((i) => i.id === active.id)
    const newIndex = activeSection.items.findIndex((i) => i.id === over.id)
    setSections(sections.map((s) =>
      s.id === activeSection.id ? { ...s, items: arrayMove(s.items, oldIndex, newIndex) } : s,
    ))
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
    // Warn if any section is missing risks
    const sectionsWithoutRisks = sections.filter((s) => s.risks.length === 0)
    if (sectionsWithoutRisks.length > 0) {
      const names = sectionsWithoutRisks.map((s) => `"${s.name}"`).join(", ")
      const confirmed = window.confirm(
        `Attenzione: ${sectionsWithoutRisks.length === 1 ? "la sezione" : "le sezioni"} ${names} non ${
          sectionsWithoutRisks.length === 1 ? "ha" : "hanno"
        } rischi aggiunti.\n\nVuoi salvare comunque?`,
      )
      if (!confirmed) return
    }

    const validUntilDate = quoteData.validUntil ? new Date(quoteData.validUntil) : null
    const dateObj = new Date(quoteData.date)
    const validityDays = validUntilDate
      ? Math.ceil((validUntilDate.getTime() - dateObj.getTime()) / 86400000)
      : DEFAULT_VALIDITY_DAYS

    const payload = {
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
      sections,
      total_amount: totalAmount,
      status: quoteData.status,
      notes: quoteData.notes || null,
      payment_terms: null,
      enamel_data: Object.keys(enamelDataMap).length > 0 ? enamelDataMap : null,
      project_id: editQuote ? (editQuote as any).project_id ?? null : projectIdFromUrl ?? null,
    }

    try {
      if (editQuote) {
        await updateQuote.mutateAsync({ id: editQuote.id, ...payload })
      } else {
        await createQuote.mutateAsync(payload)
      }
      const targetProjectId =
        (editQuote as any)?.project_id ?? projectIdFromUrl ?? null
      navigate(targetProjectId ? `/projects/${targetProjectId}` : "/quotes")
    } catch {
      toast({ title: "Errore", description: "Si è verificato un errore durante il salvataggio", variant: "destructive" })
    }
  }

  if (productsLoading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {editQuote ? "Modifica Preventivo" : "Nuovo Preventivo"}
          </h1>
          <p className="text-muted-foreground mt-1">Lavorazione Pietra Lavica Smaltata</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => openCalculatorPopup(editQuote?.id || "", quoteData.number || "")}
            variant="outline"
            className="gap-2"
            disabled={!editQuote?.id}
            title={!editQuote?.id ? "Salva prima il preventivo per usare la calcolatrice" : "Apri calcolatrice collegata"}
          >
            <Calculator className="h-4 w-4" />
            Calcolatrice
          </Button>
          <Button onClick={duplicateQuote} variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Duplica
          </Button>
          <Button onClick={saveQuote} className="gap-2" disabled={createQuote.isPending || updateQuote.isPending}>
            <Save className="h-4 w-4" />
            Salva
          </Button>
        </div>
      </div>

      {/* Quote info */}
      <Card>
        <CardHeader><CardTitle>Informazioni Preventivo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quote-number">Numero Preventivo</Label>
            <Input id="quote-number" value={quoteData.number}
              onChange={(e) => setQuoteData({ ...quoteData, number: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome Cliente</Label>
            <Input id="client-name" value={clientData.name}
              onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
              placeholder="Es. Mario Rossi" />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Progetti e Lavorazioni</h2>

        {sections.map((section) => {
          const warning = computeSectionPriceWarning(section, thicknessAverages)
          return (
            <div key={section.id} className="space-y-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id, "name", e.target.value)}
                      className="text-lg font-semibold border-none p-0 h-auto bg-transparent flex-1 min-w-0"
                    />
                    <ComplexityRiskIndicator type="C" value={section.complexity}
                      onChange={(v) => updateSection(section.id, "complexity", v)} />
                    <ComplexityRiskIndicator type="R" value={section.risk}
                      onChange={(v) => updateSection(section.id, "risk", v)} />
                  </div>

                  {section.tags && section.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {section.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <Textarea
                    value={section.description}
                    onChange={(e) => updateSection(section.id, "description", e.target.value)}
                    placeholder="Descrizione sezione (opzionale)..."
                    className="text-sm border-none p-0 h-auto bg-transparent resize-none min-h-[40px]"
                    rows={2}
                  />

                  <SectionStatsBar
                    section={section}
                    warning={warning}
                    onChangeMq={(mq) =>
                      setSections(sections.map((s) =>
                        s.id === section.id
                          ? {
                              ...s,
                              mqTotali: mq > 0 ? mq : undefined,
                              euroPerMq: mq > 0 ? s.total / mq : undefined,
                            }
                          : s,
                      ))
                    }
                    onChangeQuantity={(qty) =>
                      setSections(sections.map((s) => (s.id === section.id ? { ...s, quantity: qty } : s)))
                    }
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setStoneCalculatorSectionId(section.id)
                        setStoneCalculatorOpen(true)
                      }}
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                    >
                      <Calculator className="h-4 w-4" />
                      Calc. Pietra
                    </Button>
                    <Button
                      onClick={() => {
                        setEnamelDialogSectionId(section.id)
                        setEnamelDialogOpen(true)
                      }}
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                    >
                      <Palette className="h-4 w-4" />
                      Costi Smalto
                      {(enamelDataMap[section.id]?.length || 0) > 0 && (
                        <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                          {enamelDataMap[section.id].length}
                        </span>
                      )}
                    </Button>
                    <SaveTemplateDialog
                      sectionName={section.name}
                      items={section.items}
                      tags={section.tags}
                      complexity={section.complexity}
                      risk={section.risk}
                    />
                    <Button onClick={() => duplicateSection(section.id)} size="sm" variant="outline" className="gap-1.5">
                      <Copy className="h-4 w-4" />
                      Duplica
                    </Button>
                    {sections.length > 1 && (
                      <Button onClick={() => removeSection(section.id)} size="sm" variant="outline"
                        className="gap-1.5 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Chart image */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    {section.chartImage ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Grafico/Schema</span>
                          <Button variant="outline" size="sm" onClick={() => removeSectionImage(section.id)}
                            className="gap-2 text-destructive hover:text-destructive">
                            <X className="h-4 w-4" />
                            Rimuovi
                          </Button>
                        </div>
                        <img src={section.chartImage} alt={`Grafico ${section.name}`}
                          className="max-w-full max-h-96 rounded-lg border object-contain mx-auto" />
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Carica Grafico/Immagine</span>
                        <span className="text-xs text-muted-foreground">(JPG, PNG, WEBP - max 5MB)</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadSectionImage(section.id, file)
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="border-b pb-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">Tags/Etichette</Label>
                    <TagInput tags={section.tags || []}
                      onChange={(tags) => updateSection(section.id, "tags", tags)} />
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext
                        items={section.items.map((i) => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {section.items.map((item, itemIndex) => (
                          <div key={item.id} className="space-y-2">
                            <SortableItem
                              item={item}
                              products={products}
                              recentProductIds={recentProductIds}
                              onSelectProduct={(itemId, productId) =>
                                handleSelectProduct(section.id, itemId, productId)
                              }
                              onUpdateItem={(itemId, field, value) =>
                                updateItem(section.id, itemId, field, value)
                              }
                              onRemoveItem={(itemId) => removeItem(section.id, itemId)}
                              canRemove={section.items.length > 1}
                              onAddProduct={addProductHandler}
                            />
                            {activeSuggestion?.sectionId === section.id &&
                              activeSuggestion?.itemId === item.id &&
                              suggestions.length > 0 && (
                                <ProductSuggestions
                                  suggestions={suggestions}
                                  productName={activeSuggestion.productName}
                                  onAddSuggestions={handleAddSuggestions}
                                  onDismiss={() => setActiveSuggestion(null)}
                                />
                              )}
                            {itemIndex === section.items.length - 1 && (
                              <Button
                                onClick={() => handleAddItem(section.id)}
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

                  {/* Risks */}
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
                        {section.risks.map((risk) => (
                          <SectionRiskRow
                            key={risk.id}
                            risk={risk}
                            section={section}
                            onUpdate={(riskId, field, value) =>
                              updateRisk(section.id, riskId, field, value)
                            }
                            onRemove={(riskId) => removeRisk(section.id, riskId)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Engobbio & Finitura */}
                  <div className="space-y-2 pt-4 border-t">
                    {(["engobbio", "finitura"] as const).map((field) => (
                      <div
                        key={field}
                        className="flex items-center justify-between bg-muted/50 p-4 rounded-lg"
                      >
                        <div>
                          <h4 className="font-semibold text-sm capitalize">{field}</h4>
                          <p className="text-xs text-muted-foreground italic">vedere preventivo allegato</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">€</span>
                          <Input
                            type="number"
                            value={section[field] || 0}
                            onChange={(e) => updateSection(section.id, field, parseFloat(e.target.value) || 0)}
                            className="w-32 text-right"
                            step="0.01"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <div className="flex gap-2">
                  <Button onClick={addSection} variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" />
                    Nuova Sezione
                  </Button>
                  <LoadTemplateDialog onLoad={loadFromTemplate} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Riepilogo Finale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold">Totali per Sezione:</h3>
            {sections.map((section) => (
              <div key={section.id} className="flex justify-between text-sm">
                <span>
                  {section.name}
                  {(section.quantity || 1) > 1 ? ` (x${section.quantity})` : ""}:
                </span>
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
          <Textarea
            value={quoteData.notes}
            onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
            placeholder="Note aggiuntive per il cliente (condizioni di pagamento, tempi di consegna, etc.)..."
            rows={4}
          />
        </CardContent>
      </Card>

      <StoneCalculator
        open={stoneCalculatorOpen}
        onOpenChange={setStoneCalculatorOpen}
        onConfirm={(result) => {
          if (stoneCalculatorSectionId) handleStoneCalculatorConfirm(stoneCalculatorSectionId, result)
        }}
      />

      {enamelDialogSectionId && (
        <EnamelCostDialog
          open={enamelDialogOpen}
          onOpenChange={(open) => {
            setEnamelDialogOpen(open)
            if (!open) setEnamelDialogSectionId(null)
          }}
          value={enamelDataMap[enamelDialogSectionId] || []}
          onChange={(rows) =>
            setEnamelDataMap((prev) => ({ ...prev, [enamelDialogSectionId!]: rows }))
          }
          sectionName={sections.find((s) => s.id === enamelDialogSectionId)?.name || ""}
        />
      )}
    </div>
  )
}

export default NewQuote
