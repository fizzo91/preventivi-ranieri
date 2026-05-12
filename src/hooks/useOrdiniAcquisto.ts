import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type OdaStato = "Costi da confermare presso i fornitori" | "Confermato" | "Annullato";

export interface OdaRiga {
  id?: string;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
}

export interface OrdineAcquisto {
  id: string;
  user_id: string;
  numero_oda: number;
  numero_oda_formatted?: string;
  progetto_id: string | null;
  fornitore_id: string | null;
  stato: string;
  note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  fornitore?: { ragione_sociale: string } | null;
  righe?: OdaRiga[];
}

export interface OrdineAcquistoInput {
  progetto_id: string | null;
  fornitore_id: string | null;
  stato: string;
  note: string | null;
  righe: OdaRiga[];
}

const formatNumeroOda = (numero: number, anno: number) =>
  `ODA-${anno}-${String(numero).padStart(4, "0")}`;

export const useOrdiniAcquisto = (progettoId?: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const list = useQuery({
    queryKey: ["ordini_acquisto", progettoId, user?.id],
    enabled: !!user && !!progettoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordini_acquisto" as any)
        .select("*, fornitore:fornitori(ragione_sociale), righe:oda_righe(*)")
        .eq("progetto_id", progettoId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((o) => ({
        ...o,
        numero_oda_formatted: formatNumeroOda(o.numero_oda, new Date(o.created_at).getFullYear()),
      })) as OrdineAcquisto[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: OrdineAcquistoInput) => {
      if (!user) throw new Error("Non autenticato");
      const { data: numero, error: rpcErr } = await supabase.rpc("incrementa_oda_counter" as any);
      if (rpcErr) throw rpcErr;

      const { data: oda, error: insErr } = await supabase
        .from("ordini_acquisto" as any)
        .insert({
          user_id: user.id,
          created_by: user.id,
          numero_oda: numero as number,
          progetto_id: input.progetto_id,
          fornitore_id: input.fornitore_id,
          stato: input.stato,
          note: input.note,
        } as any)
        .select()
        .single();
      if (insErr) throw insErr;

      const righe = input.righe.filter((r) => r.descrizione.trim());
      if (righe.length > 0) {
        const { error: righeErr } = await supabase.from("oda_righe" as any).insert(
          righe.map((r) => ({
            user_id: user.id,
            oda_id: (oda as any).id,
            descrizione: r.descrizione,
            quantita: r.quantita,
            prezzo_unitario: r.prezzo_unitario,
          })) as any
        );
        if (righeErr) throw righeErr;
      }
      return oda;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordini_acquisto"] });
      toast({ title: "Ordine di acquisto creato" });
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("oda_righe" as any).delete().eq("oda_id", id);
      const { error } = await supabase.from("ordini_acquisto" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordini_acquisto"] });
      toast({ title: "Ordine eliminato" });
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  return { list, create, remove, formatNumeroOda };
};
