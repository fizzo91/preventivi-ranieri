import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

export interface Quote {
  id: string;
  user_id: string;
  quote_number: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  client_address: string | null;
  client_vat_number: string | null;
  client_fiscal_code: string | null;
  date: string;
  validity_days: number;
  sections: any;
  payment_terms: string | null;
  notes: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  enamel_data: any | null;
  owner_name?: string;
}

export const useQuotes = () => {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data as any[]).map((q) => q.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p.full_name || "Utente"])
      );

      return (data as any[]).map((q) => ({
        ...q,
        owner_name: profileMap.get(q.user_id) || "Utente",
      })) as Quote[];
    },
  });
};

export const useQuote = (id: string) => {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Quote;
    },
    enabled: !!id,
  });
};

/** Shared mutation factory: handles success toast, cache invalidation and error toast. */
function useQuoteMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  successTitle: string,
  successDescription: string
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({ title: successTitle, description: successDescription });
    },
    onError: (error) => {
      toast({ title: "Errore", description: getErrorMessage(error), variant: "destructive" });
    },
  });
}

export const useCreateQuote = () =>
  useQuoteMutation(
    async (quote: Omit<Quote, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("quotes")
        .insert({ ...quote, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    "Preventivo creato",
    "Il preventivo è stato salvato con successo."
  );

export const useUpdateQuote = () =>
  useQuoteMutation(
    async ({ id, ...quote }: Partial<Quote> & { id: string }) => {
      const { data, error } = await supabase
        .from("quotes")
        .update(quote as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    "Preventivo aggiornato",
    "Le modifiche sono state salvate."
  );

export const useDeleteQuote = () =>
  useQuoteMutation(
    async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    "Preventivo eliminato",
    "Il preventivo è stato rimosso."
  );
