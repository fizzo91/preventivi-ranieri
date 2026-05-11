import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateProject,
  useUpdateProject,
  type Project,
  type ProjectInput,
} from "@/hooks/useProjects"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  project: Project | null
}

const empty: ProjectInput = {
  name: "",
  client_name: "",
  client_company: "",
  client_email: "",
  client_phone: "",
  client_address: "",
  status: "active",
  notes: "",
}

export const ProjectFormDialog = ({ open, onOpenChange, project }: Props) => {
  const create = useCreateProject()
  const update = useUpdateProject()
  const [form, setForm] = useState<ProjectInput>(empty)

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        client_name: project.client_name ?? "",
        client_company: project.client_company ?? "",
        client_email: project.client_email ?? "",
        client_phone: project.client_phone ?? "",
        client_address: project.client_address ?? "",
        status: project.status,
        notes: project.notes ?? "",
      })
    } else {
      setForm(empty)
    }
  }, [project, open])

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (project) {
      await update.mutateAsync({ id: project.id, ...form })
    } else {
      await create.mutateAsync(form)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Modifica progetto" : "Nuovo progetto"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="p-name">Nome progetto *</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Es. Villa Rossi - Cucina"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-client">Cliente</Label>
            <Input id="p-client" value={form.client_name ?? ""} onChange={(e) => set("client_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-company">Azienda</Label>
            <Input id="p-company" value={form.client_company ?? ""} onChange={(e) => set("client_company", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" type="email" value={form.client_email ?? ""} onChange={(e) => set("client_email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-phone">Telefono</Label>
            <Input id="p-phone" value={form.client_phone ?? ""} onChange={(e) => set("client_phone", e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="p-address">Indirizzo</Label>
            <Input id="p-address" value={form.client_address ?? ""} onChange={(e) => set("client_address", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-status">Stato</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger id="p-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Attivo</SelectItem>
                <SelectItem value="closed">Chiuso</SelectItem>
                <SelectItem value="archived">Archiviato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="p-notes">Note</Label>
            <Textarea
              id="p-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || create.isPending || update.isPending}>
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
