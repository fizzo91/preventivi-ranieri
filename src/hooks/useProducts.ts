import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price_em: number;
  price_dt: number;
  category: string;
  unit: string;
  category_id: string | null;
  subcategory_id: string | null;
  code: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface UseProductsOptions {
  includeArchived?: boolean;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { includeArchived = false } = options;
  return useQuery({
    queryKey: ["products", { includeArchived }],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .order("category")
        .order("name");

      if (!includeArchived) {
        query = query.eq("archived", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<Product, "id" | "user_id" | "created_at" | "updated_at" | "archived"> & { archived?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Prodotto creato",
        description: "Il prodotto è stato aggiunto con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Prodotto aggiornato",
        description: "Le modifiche sono state salvate.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * "Cancella" un prodotto = lo archivia.
 * In questo modo i preventivi storici che lo referenziano
 * continuano a essere visualizzati correttamente.
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Prodotto archiviato",
        description: "Il prodotto non comparirà nei nuovi preventivi, ma resta visibile in quelli esistenti.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRestoreProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ archived: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Prodotto ripristinato",
        description: "Il prodotto è di nuovo selezionabile nei preventivi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
