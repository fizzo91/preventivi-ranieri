import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import {
  hasLocalStorageData,
  readLocalStorageData,
  performFullMigration,
  clearLocalStorageAfterMigration,
  MigrationResult,
} from "@/lib/migrate";

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MigrationDialog = ({ open, onOpenChange }: MigrationDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"preview" | "migrating" | "complete">("preview");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const data = readLocalStorageData();
  const hasData = hasLocalStorageData();

  const handleMigrate = async () => {
    if (!user) return;

    setStep("migrating");
    setProgress(10);

    try {
      setProgress(30);
      const migrationResult = await performFullMigration(user.id);
      setProgress(80);
      
      setResult(migrationResult);
      setProgress(100);
      setStep("complete");

      if (migrationResult.success) {
        clearLocalStorageAfterMigration();
      }
    } catch (error: any) {
      setResult({
        success: false,
        counts: { products: 0, clients: 0, quotes: 0, settings: false },
        errors: [error.message],
      });
      setStep("complete");
    }
  };

  const handleClose = () => {
    if (result?.success) {
      window.location.reload();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Migrazione Dati
          </DialogTitle>
          <DialogDescription>
            {step === "preview" && "Trasferimento dei tuoi dati nel database sicuro"}
            {step === "migrating" && "Migrazione in corso..."}
            {step === "complete" && (result?.success ? "Migrazione completata!" : "Migrazione completata con avvisi")}
          </DialogDescription>
        </DialogHeader>

        {step === "preview" && hasData && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Dati rilevati:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {data.products.length > 0 && <li>• {data.products.length} prodotti</li>}
                {data.clients.length > 0 && <li>• {data.clients.length} clienti</li>}
                {data.quotes.length > 0 && <li>• {data.quotes.length} preventivi</li>}
                {data.settings && <li>• Impostazioni aziendali</li>}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              I tuoi dati saranno trasferiti in modo sicuro nel database. Questo processo potrebbe richiedere qualche secondo.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleMigrate} className="flex-1">
                Inizia Migrazione
              </Button>
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Annulla
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && !hasData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nessun dato da migrare rilevato nel localStorage.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Chiudi
            </Button>
          </div>
        )}

        {step === "migrating" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Trasferimento dati in corso...
            </p>
          </div>
        )}

        {step === "complete" && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              {result.success ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <AlertCircle className="h-16 w-16 text-yellow-500" />
              )}
            </div>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Riepilogo:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ {result.counts.products} prodotti migrati</li>
                <li>✓ {result.counts.clients} clienti migrati</li>
                <li>✓ {result.counts.quotes} preventivi migrati</li>
                {result.counts.settings && <li>✓ Impostazioni migrate</li>}
              </ul>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">Avvisi:</p>
                <ul className="space-y-1 text-xs text-yellow-700">
                  {result.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              {result.success ? "Completa e Ricarica" : "Chiudi"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
