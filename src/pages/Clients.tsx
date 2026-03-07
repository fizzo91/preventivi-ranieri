import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients"
import { LoadingSpinner, StatCard } from "@/components/shared"
import { ClientForm, type ClientFormData } from "@/components/clients/ClientForm"
import { ClientCard } from "@/components/clients/ClientCard"

const EMPTY_FORM: ClientFormData = { name: "", company: "", email: "", phone: "", address: "", notes: "", vat_number: "", fiscal_code: "" }

const Clients = () => {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editForm, setEditForm] = useState<ClientFormData>(EMPTY_FORM)

  const resetForm = () => { setIsEditing(null); setIsAdding(false); setEditForm(EMPTY_FORM) }

  const handleSave = async () => {
    if (isAdding) {
      await createClient.mutateAsync(editForm)
    } else if (isEditing) {
      await updateClient.mutateAsync({ id: isEditing, ...editForm })
    }
    resetForm()
  }

  const startEdit = (client: any) => {
    setIsEditing(client.id)
    setEditForm({
      name: client.name, company: client.company || "", email: client.email || "",
      phone: client.phone || "", address: client.address || "", notes: client.notes || "",
      vat_number: client.vat_number || "", fiscal_code: client.fiscal_code || ""
    })
  }

  if (isLoading) return <LoadingSpinner />

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clienti</h1>
          <p className="text-muted-foreground mt-1">Gestisci l'archivio dei tuoi clienti</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2"><Plus className="h-4 w-4" />Nuovo Cliente</Button>
      </div>

      <Input placeholder="Cerca clienti..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Totale Clienti" value={clients.length} />
        <StatCard title="Con Email" value={clients.filter(c => c.email).length} />
        <StatCard title="Aziende" value={clients.filter(c => c.company).length} />
      </div>

      {(isAdding || isEditing) && (
        <ClientForm
          title={isAdding ? 'Nuovo Cliente' : 'Modifica Cliente'}
          form={editForm}
          onChange={setEditForm}
          onSave={handleSave}
          onCancel={resetForm}
          isSaving={createClient.isPending || updateClient.isPending}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <ClientCard key={client.id} client={client} onEdit={startEdit} onDelete={(id) => deleteClient.mutateAsync(id)} isDeleting={deleteClient.isPending} />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card><CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {clients.length === 0 ? "Nessun cliente in archivio. Aggiungi il tuo primo cliente!" : "Nessun cliente corrisponde ai criteri di ricerca."}
          </p>
          {clients.length === 0 && <Button onClick={() => setIsAdding(true)}>Aggiungi Primo Cliente</Button>}
        </CardContent></Card>
      )}
    </div>
  )
}

export default Clients
