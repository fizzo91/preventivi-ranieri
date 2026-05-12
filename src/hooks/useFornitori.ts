import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Fornitore {
  id: string;
  user_id: string;
  ragione_sociale: string;
  piva: string | null;
  referente: string | null;
  telefono: string | null;
  email: string | null;
  categoria: string | null;
  pagamento_default: string | null;
  created_at: string;
  updated_at: string;
}

export type FornitoreInput = Omit<Fornitore, "id" | "user_id" | "created_at" | "updated_at">;

export const useFornitori = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const list = useQuery({
    queryKey: ["fornitori", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornitori")
        .select("*")
        .order("ragione_sociale", { ascending: true });
      if (error) throw error;
      return data as Fornitore[];
    },
  });

  const upsert = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Fornitore> & { ragione_sociale: string }) => {
      if (!user) throw new Error("Not authenticated");
      if (id) {
        const { error } = await supabase.from("fornitori").update(input).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fornitori")
          .insert({ ...input, user_id: user.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["fornitori"] });
      toast({ title: vars.id ? "Fornitore aggiornato" : "Fornitore creato" });
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornitori").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornitori"] });
      toast({ title: "Fornitore eliminato" });
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });

  return { list, upsert, remove };
};
