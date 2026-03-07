import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Building, Mail, Phone, Edit, Trash2 } from "lucide-react"
import type { Client } from "@/hooks/useClients"

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export const ClientCard = ({ client, onEdit, onDelete, isDeleting }: ClientCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">{client.name}</CardTitle>
            {client.company && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building className="h-3 w-3" />{client.company}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => onEdit(client)}><Edit className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(client.id)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {client.email && (
        <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{client.email}</span></div>
      )}
      {client.phone && (
        <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{client.phone}</span></div>
      )}
      {client.address && <div className="text-sm text-muted-foreground">{client.address}</div>}
      {client.notes && <div className="text-sm text-muted-foreground border-t pt-2">{client.notes}</div>}
      <div className="text-xs text-muted-foreground border-t pt-2">
        Aggiunto: {new Date(client.created_at).toLocaleDateString('it-IT')}
      </div>
    </CardContent>
  </Card>
)
