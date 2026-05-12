import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useFornitori, type Fornitore } from "@/hooks/useFornitori";

type FormState = {
  ragione_sociale: string;
  piva: string;
  referente: string;
  telefono: string;
  email: string;
  categoria: string;
  pagamento_default: string;
};

const empty: FormState = {
  ragione_sociale: "",
  piva: "",
  referente: "",
  telefono: "",
  email: "",
  categoria: "",
  pagamento_default: "",
};

export default function Fornitori() {
  const { list, upsert, remove } = useFornitori();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Fornitore | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<Fornitore | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list.data ?? [];
    return (list.data ?? []).filter(
      (f) =>
        f.ragione_sociale.toLowerCase().includes(q) ||
        (f.categoria ?? "").toLowerCase().includes(q),
    );
  }, [list.data, search]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (f: Fornitore) => {
    setEditing(f);
    setForm({
      ragione_sociale: f.ragione_sociale,
      piva: f.piva ?? "",
      referente: f.referente ?? "",
      telefono: f.telefono ?? "",
      email: f.email ?? "",
      categoria: f.categoria ?? "",
      pagamento_default: f.pagamento_default ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.ragione_sociale.trim()) return;
    const payload = {
      ragione_sociale: form.ragione_sociale.trim(),
      piva: form.piva.trim() || null,
      referente: form.referente.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      categoria: form.categoria.trim() || null,
      pagamento_default: form.pagamento_default.trim() || null,
    };
    await upsert.mutateAsync(editing ? { id: editing.id, ...payload } : payload);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fornitori"
        description="Gestisci l'anagrafica dei fornitori"
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuovo fornitore
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cerca per ragione sociale o categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {list.isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          message={search ? "Nessun fornitore corrisponde alla ricerca" : "Nessun fornitore. Aggiungi il primo!"}
          actionLabel={search ? undefined : "Nuovo fornitore"}
          onAction={search ? undefined : openNew}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((f) => (
            <Card key={f.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{f.ragione_sociale}</h3>
                  {f.categoria && <Badge variant="secondary">{f.categoria}</Badge>}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {f.referente && <span>{f.referente}</span>}
                  {f.email && <span>{f.email}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setToDelete(f)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifica fornitore" : "Nuovo fornitore"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Ragione sociale *</Label>
              <Input
                value={form.ragione_sociale}
                onChange={(e) => setForm({ ...form, ragione_sociale: e.target.value })}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label>P.IVA</Label>
              <Input value={form.piva} onChange={(e) => setForm({ ...form, piva: e.target.value })} maxLength={32} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Referente</Label>
              <Input
                value={form.referente}
                onChange={(e) => setForm({ ...form, referente: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefono</Label>
              <Input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                maxLength={40}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Condizioni di pagamento default</Label>
              <Input
                value={form.pagamento_default}
                onChange={(e) => setForm({ ...form, pagamento_default: e.target.value })}
                placeholder="Es. Bonifico 30 gg d.f."
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending || !form.ragione_sociale.trim()}>
              {editing ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il fornitore?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.ragione_sociale}" sarà eliminato definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await remove.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
