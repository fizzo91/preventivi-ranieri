import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export interface AccessRequest {
  id: string;
  email: string;
  full_name: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => {
        setIsAdmin(!!data);
        setLoading(false);
      });
  }, [user]);

  return { isAdmin, loading };
};

export const useAccessRequests = () => {
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["access_requests"],
    enabled: isAdmin,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AccessRequest[];
    },
  });
};

export const usePendingRequestsCount = () => {
  const { data = [] } = useAccessRequests();
  return data.filter((r) => r.status === "pending").length;
};

export const useApproveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ request_id, password }: { request_id: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke("approve-access-request", {
        body: { request_id, password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access_requests"] }),
  });
};

export const useRejectRequest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (request_id: string) => {
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", request_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access_requests"] }),
  });
};

export const submitAccessRequest = async (data: {
  email: string;
  full_name: string;
  reason: string;
}) => {
  const { error } = await supabase.from("access_requests").insert({
    email: data.email.trim().toLowerCase(),
    full_name: data.full_name.trim(),
    reason: data.reason.trim() || null,
    status: "pending",
  });
  return { error };
};
