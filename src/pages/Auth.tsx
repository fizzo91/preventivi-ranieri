import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitAccessRequest } from "@/hooks/useAccessRequests";

type Mode = "login" | "reset" | "request";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, session, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [resetForm, setResetForm] = useState({ email: "" });
  const [requestForm, setRequestForm] = useState({ email: "", full_name: "", reason: "" });

  if (session) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!loginForm.email || !loginForm.password) {
      setError("Inserisci email e password");
      setLoading(false);
      return;
    }
    const { error } = await signIn(loginForm.email, loginForm.password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!resetForm.email) {
      setError("Inserisci la tua email");
      setLoading(false);
      return;
    }
    const { error } = await resetPassword(resetForm.email);
    if (!error) {
      setMode("login");
      setResetForm({ email: "" });
    }
    setLoading(false);
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!requestForm.email || !requestForm.full_name) {
      setError("Email e nome sono obbligatori");
      return;
    }
    setLoading(true);
    const { error } = await submitAccessRequest(requestForm);
    setLoading(false);
    if (error) {
      setError(error.message || "Errore nell'invio della richiesta");
      return;
    }
    toast({
      title: "Richiesta inviata",
      description: "L'amministratore valuterà la tua richiesta. Riceverai le credenziali appena approvata.",
    });
    setRequestForm({ email: "", full_name: "", reason: "" });
    setMode("login");
  };

  const titles: Record<Mode, string> = {
    login: "Accedi al sistema preventivi",
    reset: "Recupera la tua password",
    request: "Richiedi l'accesso",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-mono text-center">
            COSTI DI PRODUZIONE
          </CardTitle>
          <CardDescription>{titles[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" placeholder="tuo@email.com" value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} disabled={loading} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" placeholder="••••••••" value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} disabled={loading} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accedi
              </Button>
              <div className="flex flex-col gap-1">
                <Button type="button" variant="link" className="w-full text-sm" onClick={() => { setMode("reset"); setError(""); }}>
                  Password dimenticata?
                </Button>
                <Button type="button" variant="link" className="w-full text-sm" onClick={() => { setMode("request"); setError(""); }}>
                  Non hai un account? Richiedi l'accesso
                </Button>
              </div>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" placeholder="tuo@email.com" value={resetForm.email}
                  onChange={(e) => setResetForm({ email: e.target.value })} disabled={loading} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invia link di recupero
              </Button>
              <Button type="button" variant="link" className="w-full text-sm" onClick={() => { setMode("login"); setError(""); }}>
                Torna al login
              </Button>
            </form>
          )}

          {mode === "request" && (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="req-name">Nome completo</Label>
                <Input id="req-name" type="text" placeholder="Mario Rossi" value={requestForm.full_name}
                  onChange={(e) => setRequestForm({ ...requestForm, full_name: e.target.value })} disabled={loading} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-email">Email</Label>
                <Input id="req-email" type="email" placeholder="tuo@email.com" value={requestForm.email}
                  onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })} disabled={loading} required maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-reason">Motivo (opzionale)</Label>
                <Textarea id="req-reason" placeholder="Perché vuoi accedere?" value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} disabled={loading} rows={3} maxLength={500} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invia richiesta
              </Button>
              <Button type="button" variant="link" className="w-full text-sm" onClick={() => { setMode("login"); setError(""); }}>
                Torna al login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
