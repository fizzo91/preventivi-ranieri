import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BugReport {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  title: string;
  description: string;
  page_url: string | null;
  status: "new" | "in_progress" | "resolved";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useBugReports = () => {
  return useQuery({
    queryKey: ["bug_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BugReport[];
    },
  });
};

export const usePendingBugsCount = () => {
  const { data } = useBugReports();
  return (data || []).filter((b) => b.status === "new").length;
};

export const useCreateBugReport = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; description: string; page_url?: string }) => {
      if (!user) throw new Error("Non autenticato");
      const { error } = await supabase.from("bug_reports").insert({
        user_id: user.id,
        user_email: user.email || "",
        user_name: (user.user_metadata as any)?.full_name || null,
        title: input.title,
        description: input.description,
        page_url: input.page_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bug_reports"] }),
  });
};

export const useUpdateBugReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status?: BugReport["status"]; admin_notes?: string }) => {
      const patch: any = {};
      if (input.status) patch.status = input.status;
      if (input.admin_notes !== undefined) patch.admin_notes = input.admin_notes;
      const { error } = await supabase.from("bug_reports").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bug_reports"] }),
  });
};

export const useDeleteBugReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bug_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bug_reports"] }),
  });
};
