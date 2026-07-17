import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Typed local wrapper for the beta supabase.auth.oauth namespace
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const authorizationId = params.get("authorization_id") ?? "";

  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!authorizationId) {
      setError("Parametro authorization_id mancante.");
      setReady(true);
      return;
    }
    if (!session) {
      const next = window.location.pathname + window.location.search;
      navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }
    let active = true;
    (async () => {
      try {
        if (!oauth?.getAuthorizationDetails) {
          throw new Error("OAuth non disponibile su questo client Supabase.");
        }
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message || "Impossibile caricare l'autorizzazione.");
          setReady(true);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
        setReady(true);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Errore imprevisto.");
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, session, loading, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message || "Operazione non riuscita.");
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("Il server di autorizzazione non ha restituito un URL di redirect.");
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message || "Errore imprevisto.");
    }
  }

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autorizzazione non disponibile</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>Torna alla home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "Un'applicazione";
  const redirectUri = details?.client?.redirect_uris?.[0] ?? details?.client?.redirect_uri;
  const scopes: string[] = Array.isArray(details?.scopes)
    ? details.scopes
    : typeof details?.scope === "string"
    ? details.scope.split(/\s+/).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Collega {clientName} al tuo account</CardTitle>
          <CardDescription>
            {clientName} potrà usare gli strumenti Preventivi Ranieri agendo come te.
            Vedrà solo i dati che tu vedi nell'app (RLS applicata).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">Account:</span>{" "}
              <span className="font-medium">{session?.user?.email}</span>
            </div>
            {redirectUri && (
              <div className="break-all">
                <span className="text-muted-foreground">Redirect:</span>{" "}
                <span className="font-mono text-xs">{redirectUri}</span>
              </div>
            )}
            {scopes.length > 0 && (
              <div>
                <span className="text-muted-foreground">Permessi richiesti:</span>{" "}
                <span className="font-mono text-xs">{scopes.join(" ")}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Questa autorizzazione non aggira le policy dell'app: le RLS del database restano attive.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => decide(true)} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approva
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => decide(false)} disabled={busy}>
              Rifiuta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
