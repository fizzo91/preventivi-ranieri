import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Plus, Trash2, Save, Eye, GripVertical, FolderPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  unit: string
}

interface QuoteSection {
  id: string
  name: string
  items: QuoteItem[]
  risks: Risk[]
  total: number
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
  onSelectProduct: (itemId: string, productId: string) => void
  onUpdateItem: (id: string, field: keyof QuoteItem, value: any) => void
  onRemoveItem: (id: string) => void
  canRemove: boolean
}

function SortableItem({ item, products, onSelectProduct, onUpdateItem, onRemoveItem, canRemove }: SortableItemProps) {
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
    price: product.price,
    unit: product.unit
  }))

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
        <Combobox
          options={productOptions}
          value={item.productId}
          placeholder="Cerca prodotto..."
          searchPlaceholder="Digita per cercare..."
          onSelect={(value) => onSelectProduct(item.id, value)}
        />
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Quantità</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            step="0.01"
            value={item.quantity}
            onChange={(e) => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
          />
          {item.unit && <span className="text-sm text-muted-foreground">{item.unit}</span>}
        </div>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Prezzo €</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
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
  const location = useLocation()
  const editQuote = location.state?.editQuote
  
  const [products, setProducts] = useState<Product[]>([])
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
    notes: ""
  })

  const [sections, setSections] = useState<QuoteSection[]>([
    {
      id: "main",
      name: "Progetto Principale",
      items: [
        { id: "1", productId: "", productName: "", category: "", description: "", quantity: 1, price: 0, unit: "", total: 0 }
      ],
      risks: [],
      total: 0
    }
  ])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    // Carica prodotti dal localStorage, se non ci sono carica quelli di default per pietra lavica
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]')
    if (savedProducts.length === 0) {
      const defaultProducts: Product[] = [
        {
          id: "1",
          name: "Pietra Lavica Grezza",
          description: "Pietra lavica naturale non lavorata",
          price: 45.00,
          category: "Pietra",
          unit: "mq"
        },
        {
          id: "2", 
          name: "Taglio Pietra",
          description: "Servizio di taglio e sagomatura pietra lavica",
          price: 25.00,
          category: "Taglio",
          unit: "ml"
        },
        {
          id: "3",
          name: "Smaltatura Base",
          description: "Smaltatura colore base per pietra lavica",
          price: 35.00,
          category: "Smaltatura", 
          unit: "mq"
        },
        {
          id: "4",
          name: "Smaltatura Decorativa",
          description: "Smaltatura con decorazioni personalizzate",
          price: 65.00,
          category: "Smaltatura",
          unit: "mq"
        },
        {
          id: "5",
          name: "Finitura Lucida",
          description: "Trattamento di finitura lucida",
          price: 15.00,
          category: "Finitura",
          unit: "mq"
        }
      ]
      setProducts(defaultProducts)
      localStorage.setItem('products', JSON.stringify(defaultProducts))
    } else {
      setProducts(savedProducts)
    }
  }, [])

  // Pre-popola i dati quando si modifica un preventivo esistente
  useEffect(() => {
    if (editQuote) {
      setClientData(editQuote.client || {
        name: "",
        email: "",
        phone: "",
        address: "",
        company: ""
      })
      
      setQuoteData({
        number: editQuote.number || `PREV-${Date.now()}`,
        date: editQuote.date || new Date().toISOString().split('T')[0],
        validUntil: editQuote.validUntil || "",
        notes: editQuote.notes || ""
      })

      if (editQuote.sections && editQuote.sections.length > 0) {
        setSections(editQuote.sections.map((section: any) => ({
          ...section,
          risks: section.risks || []
        })))
      }
    }
  }, [editQuote])

  // Ricalcola totali delle sezioni quando cambia il contenuto degli items o risks
  useEffect(() => {
    setSections(prevSections => 
      prevSections.map(section => {
        const itemsTotal = section.items.reduce((sum, item) => sum + item.total, 0)
        
        // Calcola rischi per questa sezione
        const risksTotal = section.risks.reduce((sum, risk) => {
          const targetItem = section.items.find(item => item.id === risk.appliedToItemId)
          return sum + (targetItem ? targetItem.total * (risk.percentage / 100) : 0)
        }, 0)
        
        const newTotal = itemsTotal + risksTotal
        return newTotal !== section.total ? { ...section, total: newTotal } : section
      })
    )
  }, [sections.flatMap(s => [...s.items.map(i => `${i.id}-${i.total}`), ...s.risks.map(r => `${r.id}-${r.percentage}-${r.appliedToItemId}`)])])

  const addSection = () => {
    const newSection: QuoteSection = {
      id: Date.now().toString(),
      name: `Sezione ${sections.length + 1}`,
      items: [
        { id: Date.now().toString() + "-item", productId: "", productName: "", category: "", description: "", quantity: 1, price: 0, unit: "", total: 0 }
      ],
      risks: [],
      total: 0
    }
    setSections([...sections, newSection])
  }

  const updateSectionName = (sectionId: string, newName: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, name: newName } : section
    ))
  }

  const removeSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== sectionId))
    }
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
                  description: selectedProduct.description,
                  price: selectedProduct.price,
                  unit: selectedProduct.unit,
                  total: item.quantity * selectedProduct.price
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
      // Find which section contains the dragged item
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

  const saveQuote = () => {
    const quote = {
      ...quoteData,
      client: clientData,
      sections,
      totalAmount,
      status: editQuote ? editQuote.status : "Bozza",
      createdAt: editQuote ? editQuote.createdAt : new Date().toISOString()
    }

    const existingQuotes = JSON.parse(localStorage.getItem('quotes') || '[]')
    
    if (editQuote) {
      // Modifica preventivo esistente
      const index = existingQuotes.findIndex((q: any) => q.number === editQuote.number)
      if (index !== -1) {
        existingQuotes[index] = quote
      }
    } else {
      // Nuovo preventivo
      existingQuotes.push(quote)
    }
    
    localStorage.setItem('quotes', JSON.stringify(existingQuotes))

    toast({
      title: editQuote ? "Preventivo Modificato" : "Preventivo Salvato",
      description: editQuote ? "Le modifiche sono state salvate con successo" : "Il preventivo è stato salvato con successo",
    })
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
          <Button onClick={saveQuote} className="gap-2">
            <Save className="h-4 w-4" />
            Salva
          </Button>
        </div>
      </div>

      {/* Dati Preventivo */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Preventivo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quote-number">Numero Preventivo</Label>
            <Input
              id="quote-number"
              value={quoteData.number}
              onChange={(e) => setQuoteData({...quoteData, number: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote-date">Data</Label>
            <Input
              id="quote-date"
              type="date"
              value={quoteData.date}
              onChange={(e) => setQuoteData({...quoteData, date: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid-until">Valido Fino Al</Label>
            <Input
              id="valid-until"
              type="date"
              value={quoteData.validUntil}
              onChange={(e) => setQuoteData({...quoteData, validUntil: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dati Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Dati Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome / Ragione Sociale</Label>
              <Input
                id="client-name"
                value={clientData.name}
                onChange={(e) => setClientData({...clientData, name: e.target.value})}
                placeholder="Es. Mario Rossi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-company">Azienda</Label>
              <Input
                id="client-company"
                value={clientData.company}
                onChange={(e) => setClientData({...clientData, company: e.target.value})}
                placeholder="Es. Rossi S.r.l."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData({...clientData, email: e.target.value})}
                placeholder="mario.rossi@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefono</Label>
              <Input
                id="client-phone"
                value={clientData.phone}
                onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-address">Indirizzo</Label>
            <Textarea
              id="client-address"
              value={clientData.address}
              onChange={(e) => setClientData({...clientData, address: e.target.value})}
              placeholder="Via Roma 123, 00100 Roma (RM)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sezioni del Preventivo */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Progetti e Lavorazioni</h2>
          <Button onClick={addSection} variant="outline" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Nuova Sezione
          </Button>
        </div>

        {sections.map((section) => (
          <Card key={section.id} className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex-1">
                <Input
                  value={section.name}
                  onChange={(e) => updateSectionName(section.id, e.target.value)}
                  className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold text-primary">
                  Totale: € {section.total.toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => addItem(section.id)} 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Aggiungi Voce
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
                    {section.items.map((item) => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        products={products}
                        onSelectProduct={(itemId, productId) => selectProduct(section.id, itemId, productId)}
                        onUpdateItem={(itemId, field, value) => updateItem(section.id, itemId, field, value)}
                        onRemoveItem={(itemId) => removeItem(section.id, itemId)}
                        canRemove={section.items.length > 1}
                      />
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
                      const targetItem = section.items.find(item => item.id === risk.appliedToItemId)
                      const amount = targetItem ? targetItem.total * (risk.percentage / 100) : 0
                      
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
                              options={section.items.map(item => ({
                                value: item.id,
                                label: `${item.productName || 'Prodotto'} (€${item.total.toFixed(2)})`,
                              }))}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Totali */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Finale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Totali per sezione */}
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
    </div>
  )
}

export default NewQuote