import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"

export interface TrattativaRiga {
  id: string
  descrizione: string
  quantita: number
  prezzo_unitario: number
  fornitore_id: string | null
  note?: string
}

export interface TrattativaData {
  data_trattativa?: string
  note?: string
  righe: TrattativaRiga[]
}

export interface Trattativa {
  id: string
  user_id: string
  project_id: string
  data: TrattativaData
  created_at: string
  updated_at: string
}

export const useTrattativa = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["trattativa", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_confirmations" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as unknown as Trattativa | null
    },
    enabled: !!projectId,
  })

export const useSaveTrattativa = (projectId: string) => {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: TrattativaData }) => {
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
      qc.invalidateQueries({ queryKey: ["trattativa", projectId] })
      toast({ title: "Trattativa salvata" })
    },
    onError: (e) =>
      toast({ title: "Errore", description: getErrorMessage(e), variant: "destructive" }),
  })
}
