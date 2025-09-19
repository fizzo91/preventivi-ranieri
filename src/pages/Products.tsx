import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  unit: string
}

const Products = () => {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("Tutte")
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    unit: ""
  })

  useEffect(() => {
    // Carica prodotti dal localStorage
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]')
    if (savedProducts.length === 0) {
      // Prodotti di esempio per iniziare
      const defaultProducts: Product[] = [
        {
          id: "1",
          name: "Consulenza Strategica",
          description: "Consulenza strategica aziendale per ottimizzazione processi",
          price: 500,
          category: "Servizi",
          unit: "ora"
        },
        {
          id: "2", 
          name: "Sviluppo Software",
          description: "Sviluppo applicazioni web personalizzate",
          price: 80,
          category: "Sviluppo",
          unit: "ora"
        },
        {
          id: "3",
          name: "Formazione Team",
          description: "Corso di formazione per team aziendali",
          price: 300,
          category: "Formazione",
          unit: "giorno"
        }
      ]
      setProducts(defaultProducts)
      localStorage.setItem('products', JSON.stringify(defaultProducts))
    } else {
      setProducts(savedProducts)
    }
  }, [])

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts)
    localStorage.setItem('products', JSON.stringify(newProducts))
  }

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      ...editForm
    }
    const updatedProducts = [...products, newProduct]
    saveProducts(updatedProducts)
    setIsAdding(false)
    setEditForm({ name: "", description: "", price: 0, category: "", unit: "" })
    toast({
      title: "Prodotto Aggiunto",
      description: "Il nuovo prodotto è stato salvato con successo",
    })
  }

  const updateProduct = () => {
    if (!isEditing) return
    
    const updatedProducts = products.map(p => 
      p.id === isEditing ? { ...p, ...editForm } : p
    )
    saveProducts(updatedProducts)
    setIsEditing(null)
    setEditForm({ name: "", description: "", price: 0, category: "", unit: "" })
    toast({
      title: "Prodotto Aggiornato",
      description: "Le modifiche sono state salvate con successo",
    })
  }

  const deleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id)
    saveProducts(updatedProducts)
    toast({
      title: "Prodotto Eliminato",
      description: "Il prodotto è stato rimosso dal catalogo",
    })
  }

  const startEdit = (product: Product) => {
    setIsEditing(product.id)
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      unit: product.unit
    })
  }

  const cancelEdit = () => {
    setIsEditing(null)
    setIsAdding(false)
    setEditForm({ name: "", description: "", price: 0, category: "", unit: "" })
  }

  const categories = [...new Set(products.map(p => p.category))]
  const filteredProducts = selectedCategory === "Tutte" 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prodotti e Servizi</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci il catalogo dei tuoi prodotti e servizi
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtra per Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedCategory === "Tutte" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("Tutte")}
            >
              Tutte ({products.length})
            </Badge>
            {categories.map(category => (
              <Badge 
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({products.filter(p => p.category === category).length})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale Prodotti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prezzo Medio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              € {products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isAdding ? 'Nuovo Prodotto' : 'Modifica Prodotto'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nome Prodotto/Servizio</Label>
                <Input
                  id="product-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Es. Consulenza IT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Categoria</Label>
                <Input
                  id="product-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  placeholder="Es. Servizi"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Descrizione</Label>
              <Textarea
                id="product-description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Descrizione del prodotto o servizio"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Prezzo (€)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-unit">Unità di Misura</Label>
                <Input
                  id="product-unit"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                  placeholder="Es. ora, pz, m2, giorno"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={isAdding ? addProduct : updateProduct}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Salva
              </Button>
              <Button variant="outline" onClick={cancelEdit} className="gap-2">
                <X className="h-4 w-4" />
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {product.category}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {product.description}
              </p>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-success">
                  € {product.price.toFixed(2)} / {product.unit}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && products.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nessun prodotto trovato nella categoria "{selectedCategory}"
            </p>
            <Button variant="outline" onClick={() => setSelectedCategory("Tutte")}>
              Mostra Tutti i Prodotti
            </Button>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && !isAdding && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nessun prodotto nel catalogo. Aggiungi il tuo primo prodotto o servizio!
            </p>
            <Button onClick={() => setIsAdding(true)}>
              Aggiungi Primo Prodotto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Products