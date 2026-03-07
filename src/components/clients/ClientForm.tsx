import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, X } from "lucide-react"

export interface ClientFormData {
  name: string
  company: string
  email: string
  phone: string
  address: string
  notes: string
  vat_number: string
  fiscal_code: string
}

interface ClientFormProps {
  title: string
  form: ClientFormData
  onChange: (form: ClientFormData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export const ClientForm = ({ title, form, onChange, onSave, onCancel, isSaving }: ClientFormProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client-name">Nome Completo</Label>
          <Input id="client-name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Mario Rossi" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-company">Azienda</Label>
          <Input id="client-company" value={form.company} onChange={(e) => onChange({ ...form, company: e.target.value })} placeholder="Rossi S.r.l." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-email">Email</Label>
          <Input id="client-email" type="email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} placeholder="mario@email.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-phone">Telefono</Label>
          <Input id="client-phone" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} placeholder="+39 123 456 7890" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-address">Indirizzo</Label>
        <Textarea id="client-address" value={form.address} onChange={(e) => onChange({ ...form, address: e.target.value })} placeholder="Via Roma 123, 00100 Roma (RM)" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-notes">Note</Label>
        <Textarea id="client-notes" value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} placeholder="Note aggiuntive sul cliente..." rows={3} />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} className="gap-2" disabled={isSaving}><Save className="h-4 w-4" />Salva</Button>
        <Button variant="outline" onClick={onCancel} className="gap-2"><X className="h-4 w-4" />Annulla</Button>
      </div>
    </CardContent>
  </Card>
)
