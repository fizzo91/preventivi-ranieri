 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
 import { supabase } from "@/integrations/supabase/client"
 import { useAuth } from "@/contexts/AuthContext"
 import { useToast } from "@/hooks/use-toast"
 
 export interface SectionTemplate {
   id: string
   user_id: string
   name: string
   description: string | null
   items: any[]
   tags: string[] | null
   complexity: number | null
   risk: number | null
   created_at: string
   updated_at: string
 }
 
 export const useSectionTemplates = () => {
   const { user } = useAuth()
   
   return useQuery({
     queryKey: ["section-templates", user?.id],
     queryFn: async () => {
       if (!user) return []
       
       const { data, error } = await supabase
         .from("section_templates")
         .select("*")
         .order("name")
       
       if (error) throw error
       return data as SectionTemplate[]
     },
     enabled: !!user
   })
 }
 
 export const useCreateSectionTemplate = () => {
   const queryClient = useQueryClient()
   const { user } = useAuth()
   const { toast } = useToast()
   
   return useMutation({
     mutationFn: async (template: Omit<SectionTemplate, "id" | "user_id" | "created_at" | "updated_at">) => {
       if (!user) throw new Error("Utente non autenticato")
       
       const { data, error } = await supabase
         .from("section_templates")
         .insert([{ ...template, user_id: user.id }])
         .select()
         .single()
       
       if (error) throw error
       return data
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["section-templates"] })
       toast({
         title: "Template salvato",
         description: "Il template è stato salvato con successo"
       })
     },
     onError: (error) => {
       toast({
         title: "Errore",
         description: "Impossibile salvare il template",
         variant: "destructive"
       })
       console.error(error)
     }
   })
 }
 
 export const useDeleteSectionTemplate = () => {
   const queryClient = useQueryClient()
   const { toast } = useToast()
   
   return useMutation({
     mutationFn: async (templateId: string) => {
       const { error } = await supabase
         .from("section_templates")
         .delete()
         .eq("id", templateId)
       
       if (error) throw error
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["section-templates"] })
       toast({
         title: "Template eliminato",
         description: "Il template è stato eliminato"
       })
     },
     onError: (error) => {
       toast({
         title: "Errore",
         description: "Impossibile eliminare il template",
         variant: "destructive"
       })
       console.error(error)
     }
   })
 }