import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"

export interface OrderConfirmation {
  id: string
  user_id: string
  project_id: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const useOrderConfirmation = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["order-confirmation", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_confirmations" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as unknown as OrderConfirmation | null
    },
    enabled: !!projectId,
  })

export const useSaveOrderConfirmation = (projectId: string) => {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non autenticato")
      if (id) {
        const { data: result, error } = await supabase
          .from("order_confirmations" as any)
          .update({ data } as any)
          .eq("id", id)
          .select()
          .single()
        if (error) throw error
        return result
      }
      const { data: result, error } = await supabase
        .from("order_confirmations" as any)
        .insert({ project_id: projectId, user_id: user.id, data } as any)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order-confirmation", projectId] })
      toast({ title: "Conferma ordine salvata" })
    },
    onError: (e) =>
      toast({ title: "Errore", description: getErrorMessage(e), variant: "destructive" }),
  })
}
