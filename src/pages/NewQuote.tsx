import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Save, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QuoteItem {
  id: string
  description: string
  quantity: number
  price: number
  total: number
}

const NewQuote = () => {
  const { toast } = useToast()
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

  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", description: "", quantity: 1, price: 0, total: 0 }
  ])

  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(22) // IVA 22%

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      price: 0,
      total: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price
        }
        return updated
      }
      return item
    }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = subtotal * (discount / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (taxRate / 100)
  const totalAmount = taxableAmount + taxAmount

  const saveQuote = () => {
    // Salva nel localStorage per ora
    const quote = {
      ...quoteData,
      client: clientData,
      items,
      discount,
      taxRate,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      status: "Bozza",
      createdAt: new Date().toISOString()
    }

    const existingQuotes = JSON.parse(localStorage.getItem('quotes') || '[]')
    existingQuotes.push(quote)
    localStorage.setItem('quotes', JSON.stringify(existingQuotes))

    toast({
      title: "Preventivo Salvato",
      description: "Il preventivo è stato salvato con successo",
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuovo Preventivo</h1>
          <p className="text-muted-foreground mt-1">
            Crea un preventivo professionale
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

      {/* Articoli */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Articoli e Servizi</CardTitle>
          <Button onClick={addItem} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Aggiungi
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg">
              <div className="md:col-span-5 space-y-2">
                <Label>Descrizione</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Descrizione del prodotto/servizio"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Quantità</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Prezzo €</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Totale</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-medium">
                  € {item.total.toFixed(2)}
                </div>
              </div>
              <div className="md:col-span-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totali */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Sconto %</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">IVA %</Label>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotale:</span>
              <span>€ {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Sconto ({discount}%):</span>
                <span>- € {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Imponibile:</span>
              <span>€ {taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({taxRate}%):</span>
              <span>€ {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>TOTALE:</span>
              <span className="text-success">€ {totalAmount.toFixed(2)}</span>
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
            placeholder="Note aggiuntive per il cliente..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default NewQuote