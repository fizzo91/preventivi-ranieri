import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface ProjectOverviewFlags {
  hasScope: boolean
  quotesCount: number
  hasTrattativa: boolean
}

/**
 * For each project, indicates whether scope/preventivi/trattativa contain data.
 * Single roundtrip per table, no N+1.
 */
export const useProjectsOverview = (projectIds: string[]) =>
  useQuery({
    queryKey: ["projects-overview", projectIds.sort().join(",")],
    enabled: projectIds.length > 0,
    queryFn: async () => {
      const [scopes, quotes, tratt] = await Promise.all([
        supabase.from("project_scopes" as any).select("project_id").in("project_id", projectIds),
        (supabase.from("quotes") as any).select("project_id").in("project_id", projectIds),
        supabase.from("order_confirmations" as any).select("project_id").in("project_id", projectIds),
      ])
      const map: Record<string, ProjectOverviewFlags> = {}
      for (const id of projectIds) map[id] = { hasScope: false, quotesCount: 0, hasTrattativa: false }
      for (const r of (scopes.data ?? []) as any[]) if (map[r.project_id]) map[r.project_id].hasScope = true
      for (const r of (quotes.data ?? []) as any[]) if (map[r.project_id]) map[r.project_id].quotesCount++
      for (const r of (tratt.data ?? []) as any[]) if (map[r.project_id]) map[r.project_id].hasTrattativa = true
      return map
    },
  })
