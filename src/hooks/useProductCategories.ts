import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProductCategory {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSubcategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useProductCategories = () => {
  return useQuery({
    queryKey: ["product_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data as ProductCategory[];
    },
  });
};

export const useProductSubcategories = (categoryId?: string | null) => {
  return useQuery({
    queryKey: ["product_subcategories", categoryId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("product_subcategories")
        .select("*")
        .order("sort_order")
        .order("name");
      if (categoryId) q = q.eq("category_id", categoryId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProductSubcategory[];
    },
  });
};

export const useCreateProductCategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { name: string; sort_order?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("product_categories")
        .insert({ user_id: user.id, name: input.name, sort_order: input.sort_order ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_categories"] });
      toast({ title: "Categoria creata" });
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });
};

export const useCreateProductSubcategory = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { category_id: string; name: string; sort_order?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("product_subcategories")
        .insert({
          user_id: user.id,
          category_id: input.category_id,
          name: input.name,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_subcategories"] });
      toast({ title: "Sottocategoria creata" });
    },
    onError: (e: any) => toast({ title: "Errore", description: e.message, variant: "destructive" }),
  });
};
