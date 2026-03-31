import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Calculation {
  id: string;
  user_id: string;
  quote_id: string | null;
  expression: string;
  result: string;
  note: string | null;
  created_at: string;
}

export const useCalculations = (quoteId?: string | null) => {
  return useQuery({
    queryKey: ["calculations", quoteId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false });

      if (quoteId) {
        query = query.eq("quote_id", quoteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Calculation[];
    },
  });
};

export const useCreateCalculation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calc: { expression: string; result: string; note?: string; quote_id?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("calculations")
        .insert({
          user_id: user.id,
          expression: calc.expression,
          result: calc.result,
          note: calc.note || null,
          quote_id: calc.quote_id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as Calculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
    },
  });
};

export const useUpdateCalculation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; note?: string | null; quote_id?: string | null }) => {
      const { data, error } = await supabase
        .from("calculations")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
    },
  });
};

export const useDeleteCalculation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calculations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
    },
  });
};

export const useClearCalculations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quoteId?: string | null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase.from("calculations").delete().eq("user_id", user.id);
      if (quoteId) {
        query = query.eq("quote_id", quoteId);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
      toast({ title: "Cronologia cancellata" });
    },
  });
};
