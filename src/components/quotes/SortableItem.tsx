import { useState } from "react"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { QuoteItem } from "@/types/quote"
import type { Product } from "@/hooks/useProducts"

const PRODUCT_CATEGORIES = ["PIETRA", "LAVORAZIONE", "PRODOTTO COMPLETTO"] as const

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

/** A draggable row representing a single quote item (product + qty + price). */
export function SortableItem({
  item, products, recentProductIds,
  onSelectProduct, onUpdateItem, onRemoveItem, canRemove, onAddProduct,
}: SortableItemProps) {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price_em: 0, price_dt: 0, category: "LAVORAZIONE", unit: "mq",
  })

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const productOptions = products.map((p) => ({ value: p.id, label: p.name, unit: p.unit }))

  const canCreateProduct =
    !!newProduct.name && !!newProduct.category && (newProduct.price_em > 0 || newProduct.price_dt > 0)

  const handleAddProduct = () => {
    if (!canCreateProduct) return
    onAddProduct(newProduct)
    setNewProduct({ name: "", description: "", price_em: 0, price_dt: 0, category: "LAVORAZIONE", unit: "mq" })
    setIsAddProductOpen(false)
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
              <Button variant="outline" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
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
                    <Select value={newProduct.category} onValueChange={(val) => setNewProduct({ ...newProduct, category: val })}>
                      <SelectTrigger><SelectValue placeholder="Seleziona categoria" /></SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <Button onClick={handleAddProduct} disabled={!canCreateProduct}>Aggiungi Prodotto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label>Quantità</Label>
        <div className="flex items-center gap-2">
          <Input type="number" step="0.01" value={item.quantity} onChange={(e) => onUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} />
          {item.unit && <span className="text-sm text-muted-foreground">{item.unit}</span>}
        </div>
      </div>

      <div className="md:col-span-2 space-y-2">
        <Label>Prezzo €</Label>
        <Input type="number" step="0.01" value={item.price} onChange={(e) => onUpdateItem(item.id, "price", parseFloat(e.target.value) || 0)} />
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
