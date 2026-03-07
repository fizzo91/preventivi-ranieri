import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter } from "lucide-react"
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts"
import { LoadingSpinner, StatCard } from "@/components/shared"
import { ProductForm, type ProductFormData } from "@/components/products/ProductForm"
import { ProductCard } from "@/components/products/ProductCard"

const EMPTY_FORM: ProductFormData = { name: "", description: "", price_em: 0, price_dt: 0, category: "", unit: "" }

const Products = () => {
  const { data: products = [], isLoading } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("Tutte")
  const [editForm, setEditForm] = useState<ProductFormData>(EMPTY_FORM)

  const resetForm = () => { setIsEditing(null); setIsAdding(false); setEditForm(EMPTY_FORM) }

  const handleSave = async () => {
    if (isAdding) {
      await createProduct.mutateAsync(editForm)
    } else if (isEditing) {
      await updateProduct.mutateAsync({ id: isEditing, ...editForm })
    }
    resetForm()
  }

  const startEdit = (product: any) => {
    setIsEditing(product.id)
    setEditForm({ name: product.name, description: product.description || "", price_em: product.price_em, price_dt: product.price_dt, category: product.category, unit: product.unit })
  }

  if (isLoading) return <LoadingSpinner />

  const categories = [...new Set(products.map(p => p.category))]
  const filteredProducts = selectedCategory === "Tutte" ? products : products.filter(p => p.category === selectedCategory)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prodotti e Servizi</h1>
          <p className="text-muted-foreground mt-1">Gestisci il catalogo dei tuoi prodotti e servizi</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2"><Plus className="h-4 w-4" />Nuovo Prodotto</Button>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="flex items-center gap-2 font-semibold mb-3"><Filter className="h-5 w-5" />Filtra per Categoria</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant={selectedCategory === "Tutte" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCategory("Tutte")}>Tutte ({products.length})</Badge>
            {categories.map(cat => (
              <Badge key={cat} variant={selectedCategory === cat ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCategory(cat)}>
                {cat} ({products.filter(p => p.category === cat).length})
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Totale Prodotti" value={filteredProducts.length} />
        <StatCard title="Categorie" value={categories.length} />
        <StatCard title="Prezzo Medio" value={`€ ${products.length > 0 ? (products.reduce((sum, p) => sum + p.price_dt, 0) / products.length).toFixed(2) : '0.00'}`} className="text-success" />
      </div>

      {(isAdding || isEditing) && (
        <ProductForm
          title={isAdding ? 'Nuovo Prodotto' : 'Modifica Prodotto'}
          form={editForm}
          onChange={setEditForm}
          onSave={handleSave}
          onCancel={resetForm}
          isSaving={createProduct.isPending || updateProduct.isPending}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onEdit={startEdit} onDelete={(id) => deleteProduct.mutateAsync(id)} isDeleting={deleteProduct.isPending} />
        ))}
      </div>

      {filteredProducts.length === 0 && products.length > 0 && (
        <Card><CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nessun prodotto trovato nella categoria "{selectedCategory}"</p>
          <Button variant="outline" onClick={() => setSelectedCategory("Tutte")}>Mostra Tutti i Prodotti</Button>
        </CardContent></Card>
      )}

      {products.length === 0 && !isAdding && (
        <Card><CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nessun prodotto nel catalogo. Aggiungi il tuo primo prodotto o servizio!</p>
          <Button onClick={() => setIsAdding(true)}>Aggiungi Primo Prodotto</Button>
        </CardContent></Card>
      )}
    </div>
  )
}

export default Products
