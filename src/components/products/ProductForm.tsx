import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, X } from "lucide-react"

export interface ProductFormData {
  name: string
  description: string
  price_em: number
  price_dt: number
  category: string
  unit: string
}

interface ProductFormProps {
  title: string
  form: ProductFormData
  onChange: (form: ProductFormData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export const ProductForm = ({ title, form, onChange, onSave, onCancel, isSaving }: ProductFormProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Nome Prodotto/Servizio</Label>
          <Input id="product-name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Es. Consulenza IT" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-category">Categoria</Label>
          <Input id="product-category" value={form.category} onChange={(e) => onChange({ ...form, category: e.target.value })} placeholder="Es. Servizi" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-description">Descrizione</Label>
        <Textarea id="product-description" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="Descrizione del prodotto o servizio" rows={3} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-price">Prezzo (€)</Label>
          <Input id="product-price" type="number" step="0.01" min="0" value={form.price_dt} onChange={(e) => {
            const price = parseFloat(e.target.value) || 0
            onChange({ ...form, price_dt: price, price_em: price })
          }} placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-unit">Unità di Misura</Label>
          <Input id="product-unit" value={form.unit} onChange={(e) => onChange({ ...form, unit: e.target.value })} placeholder="Es. ora, pz, m2, giorno" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} className="gap-2" disabled={isSaving}><Save className="h-4 w-4" />Salva</Button>
        <Button variant="outline" onClick={onCancel} className="gap-2"><X className="h-4 w-4" />Annulla</Button>
      </div>
    </CardContent>
  </Card>
)
