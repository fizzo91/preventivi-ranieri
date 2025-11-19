import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Save, X, Filter, Download, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProductArraySchema } from "@/lib/validation"

interface Product {
  id: string
  name: string
  description: string
  priceEM: number
  priceDT: number
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
    priceEM: 0,
    priceDT: 0,
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
          priceEM: 500,
          priceDT: 480,
          category: "Servizi",
          unit: "ora"
        },
        {
          id: "2", 
          name: "Sviluppo Software",
          description: "Sviluppo applicazioni web personalizzate",
          priceEM: 80,
          priceDT: 75,
          category: "Sviluppo",
          unit: "ora"
        },
        {
          id: "3",
          name: "Formazione Team",
          description: "Corso di formazione per team aziendali",
          priceEM: 300,
          priceDT: 290,
          category: "Formazione",
          unit: "giorno"
        }
      ]
      setProducts(defaultProducts)
      localStorage.setItem('products', JSON.stringify(defaultProducts))
    } else {
      // Migra vecchi prodotti che hanno solo "price" al nuovo formato con priceEM e priceDT
      const migratedProducts = savedProducts.map((p: any) => {
        if (p.price !== undefined && (p.priceEM === undefined || p.priceDT === undefined)) {
          return {
            ...p,
            priceEM: p.price,
            priceDT: p.price,
            price: undefined
          }
        }
        // Assicura che priceEM e priceDT esistano
        return {
          ...p,
          priceEM: p.priceEM || 0,
          priceDT: p.priceDT || 0
        }
      })
      setProducts(migratedProducts)
      localStorage.setItem('products', JSON.stringify(migratedProducts))
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
    setEditForm({ name: "", description: "", priceEM: 0, priceDT: 0, category: "", unit: "" })
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
    setEditForm({ name: "", description: "", priceEM: 0, priceDT: 0, category: "", unit: "" })
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
      priceEM: product.priceEM,
      priceDT: product.priceDT,
      category: product.category,
      unit: product.unit
    })
  }

  const cancelEdit = () => {
    setIsEditing(null)
    setIsAdding(false)
    setEditForm({ name: "", description: "", priceEM: 0, priceDT: 0, category: "", unit: "" })
  }

  const exportAllProducts = () => {
    const dataStr = JSON.stringify(products, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prodotti-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Prodotti Esportati",
      description: `${products.length} prodotti esportati con successo`,
    })
  }

  const importProducts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        // Validate the imported data
        const validationResult = ProductArraySchema.safeParse(importedData)
        
        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors.map(err => 
            `${err.path.join('.')}: ${err.message}`
          ).join(', ')
          
          toast({
            title: "Errore Validazione",
            description: `I dati importati non sono validi: ${errorMessages.substring(0, 100)}...`,
            variant: "destructive"
          })
          return
        }

        const importedProducts = validationResult.data as Product[]

        const shouldOverwrite = confirm(
          `Vuoi sovrascrivere i ${products.length} prodotti esistenti con i ${importedProducts.length} prodotti importati?\n\nClicca OK per sovrascrivere, Annulla per aggiungere ai prodotti esistenti.`
        )

        let updatedProducts: Product[]
        if (shouldOverwrite) {
          updatedProducts = importedProducts
        } else {
          updatedProducts = [...products, ...importedProducts]
        }

        saveProducts(updatedProducts)
        toast({
          title: "Prodotti Importati",
          description: `${importedProducts.length} prodotti importati con successo`,
        })
      } catch (error) {
        toast({
          title: "Errore",
          description: "Errore durante l'importazione. Verifica che il file sia corretto.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
    
    // Reset input per permettere di caricare lo stesso file più volte
    event.target.value = ''
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
        <div className="flex gap-2">
          <label htmlFor="import-products">
            <Button variant="outline" asChild>
              <span className="cursor-pointer gap-2">
                <Upload className="h-4 w-4" />
                Importa
              </span>
            </Button>
          </label>
          <input
            id="import-products"
            type="file"
            accept=".json"
            onChange={importProducts}
            className="hidden"
          />
          <Button variant="outline" onClick={exportAllProducts} className="gap-2">
            <Download className="h-4 w-4" />
            Esporta
          </Button>
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Prodotto
          </Button>
        </div>
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
            <CardTitle className="text-sm font-medium">Prezzo Medio EM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              € {products.length > 0 ? (products.reduce((sum, p) => sum + p.priceEM, 0) / products.length).toFixed(2) : '0.00'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price-em">Prezzo EM (€)</Label>
                <Input
                  id="product-price-em"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.priceEM}
                  onChange={(e) => setEditForm({...editForm, priceEM: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price-dt">Prezzo DT (€)</Label>
                <Input
                  id="product-price-dt"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.priceDT}
                  onChange={(e) => setEditForm({...editForm, priceDT: parseFloat(e.target.value) || 0})}
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
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Fornitore EM:</span>
                  <span className="font-semibold text-success">€ {(product.priceEM || 0).toFixed(2)} / {product.unit}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Fornitore DT:</span>
                  <span className="font-semibold text-success">€ {(product.priceDT || 0).toFixed(2)} / {product.unit}</span>
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