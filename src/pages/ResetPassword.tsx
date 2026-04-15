import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PASSWORD_RULES = [
  { label: "Minimo 8 caratteri", test: (p: string) => p.length >= 8 },
  { label: "Una lettera maiuscola", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un numero", test: (p: string) => /[0-9]/.test(p) },
  { label: "Un carattere speciale (!@#$%^&*)", test: (p: string) => /[!@#$%^&*]/.test(p) },
];

const getStrength = (password: string) => {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (passed <= 1) return { level: "debole", color: "bg-destructive", width: "w-1/4" };
  if (passed === 2) return { level: "media", color: "bg-yellow-500", width: "w-2/4" };
  if (passed === 3) return { level: "buona", color: "bg-yellow-400", width: "w-3/4" };
  return { level: "forte", color: "bg-green-500", width: "w-full" };
};

export const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  if (!password) return null;
  const strength = getStrength(password);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Sicurezza password</span>
        <span className="font-medium capitalize">{strength.level}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
      </div>
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => (
          <li key={rule.label} className="flex items-center gap-1.5 text-xs">
            {rule.test(password) ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={rule.test(password) ? "text-foreground" : "text-muted-foreground"}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const validatePassword = (password: string): string | null => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return `La password deve contenere: ${rule.label.toLowerCase()}`;
  }
  return null;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Check if we already have a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    // Timeout: if no session after 5 seconds, show expired message
    const timeout = setTimeout(() => {
      setExpired((prev) => {
        // Only expire if not ready
        return !ready ? true : prev;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validatePassword(password);
    if (validationError) { setError(validationError); return; }
    if (password !== confirmPassword) { setError("Le password non coincidono"); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      toast({ title: "Password aggiornata!", description: "La tua password è stata modificata con successo." });
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            {expired ? (
              <>
                <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-foreground font-medium">Link scaduto o non valido</p>
                <p className="text-sm text-muted-foreground">Richiedi un nuovo link di recupero dalla pagina di login.</p>
                <Button variant="outline" onClick={() => navigate("/auth")} className="mt-2">
                  Torna al login
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Verifica sessione in corso...</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Nuova Password</CardTitle>
          <CardDescription>Scegli una password sicura per il tuo account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <PasswordStrengthIndicator password={password} />

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Conferma Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Le password non coincidono</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || PASSWORD_RULES.some(r => !r.test(password)) || password !== confirmPassword}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aggiorna Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
