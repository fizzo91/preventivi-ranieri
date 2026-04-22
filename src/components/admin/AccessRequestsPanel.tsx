import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Check, X, Loader2, Copy, RefreshCw } from "lucide-react";
import {
  useAccessRequests,
  useApproveRequest,
  useRejectRequest,
  type AccessRequest,
} from "@/hooks/useAccessRequests";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

const PASSWORD_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
const GENERATED_PASSWORD_LENGTH = 14;
const MIN_PASSWORD_LENGTH = 8;

const generatePassword = () =>
  Array.from(
    { length: GENERATED_PASSWORD_LENGTH },
    () => PASSWORD_CHARSET[Math.floor(Math.random() * PASSWORD_CHARSET.length)],
  ).join("");

export const AccessRequestsPanel = () => {
  const { data: requests = [], isLoading } = useAccessRequests();
  const approve = useApproveRequest();
  const reject = useRejectRequest();
  const { toast } = useToast();
  const [selected, setSelected] = useState<AccessRequest | null>(null);
  const [password, setPassword] = useState("");
  const [approving, setApproving] = useState(false);

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  const openApprove = (req: AccessRequest) => {
    setSelected(req);
    setPassword(generatePassword());
  };

  const handleApprove = async () => {
    if (!selected || password.length < MIN_PASSWORD_LENGTH) return;
    setApproving(true);
    try {
      await approve.mutateAsync({ request_id: selected.id, password });
      toast({
        title: "Utente creato",
        description: `${selected.email} può ora accedere. Comunicagli la password manualmente.`,
      });
      setSelected(null);
      setPassword("");
    } catch (e: unknown) {
      toast({
        title: "Errore",
        description: getErrorMessage(e, "Impossibile approvare la richiesta"),
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (req: AccessRequest) => {
    if (!confirm(`Rifiutare la richiesta di ${req.email}?`)) return;
    try {
      await reject.mutateAsync(req.id);
      toast({ title: "Richiesta rifiutata" });
    } catch (e: unknown) {
      toast({ title: "Errore", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText(password);
    toast({ title: "Password copiata" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Richieste di accesso</CardTitle>
            {pending.length > 0 && (
              <Badge variant="destructive">{pending.length} in attesa</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">In attesa ({pending.length})</TabsTrigger>
            <TabsTrigger value="reviewed">Storico ({reviewed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nessuna richiesta in attesa
              </p>
            ) : (
              pending.map((req) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{req.full_name}</span>
                      <span className="text-sm text-muted-foreground">{req.email}</span>
                    </div>
                    {req.reason && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {req.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(req.created_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openApprove(req)}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" /> Approva
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(req)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" /> Rifiuta
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-2 mt-4">
            {reviewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nessuna richiesta storica
              </p>
            ) : (
              reviewed.map((req) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{req.full_name}</span>
                      <span className="text-xs text-muted-foreground">{req.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {req.reviewed_at
                        ? new Date(req.reviewed_at).toLocaleString("it-IT")
                        : "—"}
                    </p>
                  </div>
                  <Badge variant={req.status === "approved" ? "default" : "secondary"}>
                    {req.status === "approved" ? "Approvata" : "Rifiutata"}
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approva richiesta</DialogTitle>
              <DialogDescription>
                Crea l'account per <strong>{selected?.email}</strong>. Comunica la password
                manualmente all'utente (es. via WhatsApp).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label>Password iniziale</Label>
                <div className="flex gap-2">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 8 caratteri"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPassword(generatePassword())}
                    title="Genera nuova"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                    title="Copia"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  L'utente potrà cambiarla dopo il login con "Password dimenticata?".
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Annulla
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approving || password.length < 8}
                className="gap-1"
              >
                {approving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Check className="h-4 w-4" /> Crea account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
