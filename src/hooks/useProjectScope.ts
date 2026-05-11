import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"

export interface ProjectScope {
  id: string
  user_id: string
  project_id: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export const useProjectScope = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["project-scope", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_scopes" as any)
        .select("*")
        .eq("project_id", projectId!)
        .maybeSingle()
      if (error) throw error
      return data as unknown as ProjectScope | null
    },
    enabled: !!projectId,
  })

export const useSaveProjectScope = (projectId: string) => {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non autenticato")
      const { data: result, error } = await supabase
        .from("project_scopes" as any)
        .upsert(
          { project_id: projectId, user_id: user.id, data } as any,
          { onConflict: "project_id" },
        )
        .select()
        .single()
      if (error) throw error
      return result as unknown as ProjectScope
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-scope", projectId] })
      toast({ title: "Scope salvato" })
    },
    onError: (e) =>
      toast({ title: "Errore", description: getErrorMessage(e), variant: "destructive" }),
  })
}
