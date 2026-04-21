import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bug, Loader2, Send } from "lucide-react";
import { useBugReports, useCreateBugReport } from "@/hooks/useBugReports";
import { useToast } from "@/hooks/use-toast";

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  new: { label: "Nuovo", variant: "destructive" },
  in_progress: { label: "In lavorazione", variant: "default" },
  resolved: { label: "Risolto", variant: "secondary" },
};

const BugReport = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const create = useCreateBugReport();
  const { data: myReports = [] } = useBugReports();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3 || description.trim().length < 5) {
      toast({ title: "Compila titolo e descrizione", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await create.mutateAsync({
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        page_url: window.location.href,
      });
      toast({ title: "Segnalazione inviata", description: "Grazie! Verrà esaminata al più presto." });
      setTitle("");
      setDescription("");
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bug className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Segnala un bug</h1>
          <p className="text-sm text-muted-foreground">
            Hai trovato un problema o vuoi proporre un miglioramento? Scrivilo qui.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuova segnalazione</CardTitle>
          <CardDescription>Descrivi cosa è successo e dove.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es: Errore nel salvataggio preventivo"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrizione *</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cosa stavi facendo? Cosa è successo? Cosa ti aspettavi?"
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">{description.length}/2000</p>
            </div>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Invia segnalazione
            </Button>
          </form>
        </CardContent>
      </Card>

      {myReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Le tue segnalazioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myReports.map((r) => {
              const s = statusLabel[r.status] || statusLabel.new;
              return (
                <div key={r.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium">{r.title}</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleString("it-IT")}
                  </p>
                  {r.admin_notes && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <span className="font-medium">Risposta admin: </span>
                      {r.admin_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BugReport;
