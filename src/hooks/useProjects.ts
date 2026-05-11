import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"

export interface Project {
  id: string
  user_id: string
  name: string
  client_name: string | null
  client_company: string | null
  client_email: string | null
  client_phone: string | null
  client_address: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type ProjectInput = Omit<Project, "id" | "user_id" | "created_at" | "updated_at">

const KEY = ["projects"]

export const useProjects = () =>
  useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects" as any)
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Project[]
    },
  })

export const useProject = (id: string | undefined) =>
  useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects" as any)
        .select("*")
        .eq("id", id!)
        .maybeSingle()
      if (error) throw error
      return data as unknown as Project | null
    },
    enabled: !!id,
  })

function useProjectMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  successTitle: string,
) {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ title: successTitle })
    },
    onError: (e) =>
      toast({ title: "Errore", description: getErrorMessage(e), variant: "destructive" }),
  })
}

export const useCreateProject = () =>
  useProjectMutation(async (input: ProjectInput) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non autenticato")
    const { data, error } = await supabase
      .from("projects" as any)
      .insert({ ...input, user_id: user.id } as any)
      .select()
      .single()
    if (error) throw error
    return data as unknown as Project
  }, "Progetto creato")

export const useUpdateProject = () =>
  useProjectMutation(async ({ id, ...patch }: Partial<Project> & { id: string }) => {
    const { data, error } = await supabase
      .from("projects" as any)
      .update(patch as any)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return data as unknown as Project
  }, "Progetto aggiornato")

export const useDeleteProject = () =>
  useProjectMutation(async (id: string) => {
    const { error } = await supabase.from("projects" as any).delete().eq("id", id)
    if (error) throw error
  }, "Progetto eliminato")

export const useProjectQuotes = (projectId: string | undefined) =>
  useQuery({
    queryKey: ["projects", projectId, "quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("project_id" as any, projectId!)
        .order("date", { ascending: false })
      if (error) throw error
      return data as any[]
    },
    enabled: !!projectId,
  })
