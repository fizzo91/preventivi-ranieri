import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bug, Loader2, Trash2, ExternalLink } from "lucide-react";
import {
  useBugReports,
  useUpdateBugReport,
  useDeleteBugReport,
  type BugReport,
} from "@/hooks/useBugReports";
import { useToast } from "@/hooks/use-toast";

export const BugReportsPanel = () => {
  const { data: reports = [], isLoading } = useBugReports();
  const update = useUpdateBugReport();
  const del = useDeleteBugReport();
  const { toast } = useToast();
  const [selected, setSelected] = useState<BugReport | null>(null);
  const [notes, setNotes] = useState("");

  const news = reports.filter((r) => r.status === "new");
  const inProgress = reports.filter((r) => r.status === "in_progress");
  const resolved = reports.filter((r) => r.status === "resolved");

  const openDetail = (r: BugReport) => {
    setSelected(r);
    setNotes(r.admin_notes || "");
  };

  const setStatus = async (r: BugReport, status: BugReport["status"]) => {
    try {
      await update.mutateAsync({ id: r.id, status });
      toast({ title: "Stato aggiornato" });
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    try {
      await update.mutateAsync({ id: selected.id, admin_notes: notes });
      toast({ title: "Note salvate" });
      setSelected(null);
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (r: BugReport) => {
    if (!confirm(`Eliminare la segnalazione "${r.title}"?`)) return;
    try {
      await del.mutateAsync(r.id);
      toast({ title: "Eliminata" });
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    }
  };

  const renderList = (list: BugReport[]) =>
    list.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-8">Nessuna segnalazione</p>
    ) : (
      <div className="space-y-2">
        {list.map((r) => (
          <div key={r.id} className="border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => openDetail(r)}
                  className="font-medium text-left hover:underline"
                >
                  {r.title}
                </button>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-xs text-muted-foreground">{r.user_name || r.user_email}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("it-IT")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
              </div>
              <div className="flex flex-col gap-1">
                {r.status === "new" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(r, "in_progress")}>
                    Prendi
                  </Button>
                )}
                {r.status !== "resolved" && (
                  <Button size="sm" onClick={() => setStatus(r, "resolved")}>
                    Risolvi
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(r)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" />
          <CardTitle>Segnalazioni bug</CardTitle>
          {news.length > 0 && <Badge variant="destructive">{news.length} nuove</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="new">
            <TabsList>
              <TabsTrigger value="new">Nuove ({news.length})</TabsTrigger>
              <TabsTrigger value="in_progress">In lavorazione ({inProgress.length})</TabsTrigger>
              <TabsTrigger value="resolved">Risolte ({resolved.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="mt-4">{renderList(news)}</TabsContent>
            <TabsContent value="in_progress" className="mt-4">{renderList(inProgress)}</TabsContent>
            <TabsContent value="resolved" className="mt-4">{renderList(resolved)}</TabsContent>
          </Tabs>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selected?.title}</DialogTitle>
              <DialogDescription>
                Da {selected?.user_name || selected?.user_email} ·{" "}
                {selected && new Date(selected.created_at).toLocaleString("it-IT")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                {selected?.description}
              </div>
              {selected?.page_url && (
                <a
                  href={selected.page_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> {selected.page_url}
                </a>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Note admin (visibili all'utente)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Risposta o aggiornamento per l'utente..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Chiudi</Button>
              <Button onClick={saveNotes}>Salva note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
