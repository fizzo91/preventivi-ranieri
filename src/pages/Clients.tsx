import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Save, X, User, Building, Mail, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  notes: string
  createdAt: string
}

const Clients = () => {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editForm, setEditForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  })

  useEffect(() => {
    // Carica clienti dal localStorage
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
    setClients(savedClients)
  }, [])

  const saveClients = (newClients: Client[]) => {
    setClients(newClients)
    localStorage.setItem('clients', JSON.stringify(newClients))
  }

  const addClient = () => {
    const newClient: Client = {
      id: Date.now().toString(),
      ...editForm,
      createdAt: new Date().toISOString()
    }
    const updatedClients = [...clients, newClient]
    saveClients(updatedClients)
    setIsAdding(false)
    setEditForm({ name: "", company: "", email: "", phone: "", address: "", notes: "" })
    toast({
      title: "Cliente Aggiunto",
      description: "Il nuovo cliente è stato salvato con successo",
    })
  }

  const updateClient = () => {
    if (!isEditing) return
    
    const updatedClients = clients.map(c => 
      c.id === isEditing ? { ...c, ...editForm } : c
    )
    saveClients(updatedClients)
    setIsEditing(null)
    setEditForm({ name: "", company: "", email: "", phone: "", address: "", notes: "" })
    toast({
      title: "Cliente Aggiornato",
      description: "Le modifiche sono state salvate con successo",
    })
  }

  const deleteClient = (id: string) => {
    const updatedClients = clients.filter(c => c.id !== id)
    saveClients(updatedClients)
    toast({
      title: "Cliente Eliminato",
      description: "Il cliente è stato rimosso dall'archivio",
    })
  }

  const startEdit = (client: Client) => {
    setIsEditing(client.id)
    setEditForm({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes
    })
  }

  const cancelEdit = () => {
    setIsEditing(null)
    setIsAdding(false)
    setEditForm({ name: "", company: "", email: "", phone: "", address: "", notes: "" })
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clienti</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci l'archivio dei tuoi clienti
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuovo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Cerca clienti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale Clienti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Con Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.email).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aziende</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.company).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isAdding ? 'Nuovo Cliente' : 'Modifica Cliente'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nome Completo</Label>
                <Input
                  id="client-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-company">Azienda</Label>
                <Input
                  id="client-company"
                  value={editForm.company}
                  onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                  placeholder="Rossi S.r.l."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="mario@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Telefono</Label>
                <Input
                  id="client-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  placeholder="+39 123 456 7890"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-address">Indirizzo</Label>
              <Textarea
                id="client-address"
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                placeholder="Via Roma 123, 00100 Roma (RM)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-notes">Note</Label>
              <Textarea
                id="client-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="Note aggiuntive sul cliente..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={isAdding ? addClient : updateClient}
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

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEdit(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteClient(client.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="text-sm text-muted-foreground">
                  {client.address}
                </div>
              )}
              {client.notes && (
                <div className="text-sm text-muted-foreground border-t pt-2">
                  {client.notes}
                </div>
              )}
              <div className="text-xs text-muted-foreground border-t pt-2">
                Aggiunto: {new Date(client.createdAt).toLocaleDateString('it-IT')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {clients.length === 0 
                ? "Nessun cliente in archivio. Aggiungi il tuo primo cliente!"
                : "Nessun cliente corrisponde ai criteri di ricerca."}
            </p>
            {clients.length === 0 && (
              <Button onClick={() => setIsAdding(true)}>
                Aggiungi Primo Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Clients