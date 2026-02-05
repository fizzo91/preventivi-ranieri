 import { useState } from "react"
 import { Save, FolderOpen, Trash2, Loader2 } from "lucide-react"
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog"
 import { Button } from "@/components/ui/button"
 import { Input } from "@/components/ui/input"
 import { Label } from "@/components/ui/label"
 import { Textarea } from "@/components/ui/textarea"
 import { Badge } from "@/components/ui/badge"
 import { ScrollArea } from "@/components/ui/scroll-area"
 import { useSectionTemplates, useCreateSectionTemplate, useDeleteSectionTemplate, SectionTemplate } from "@/hooks/useSectionTemplates"
 
 interface SaveTemplateDialogProps {
   sectionName: string
   items: any[]
   tags?: string[]
   complexity?: number
   risk?: number
   onSaved?: () => void
 }
 
 export function SaveTemplateDialog({ sectionName, items, tags, complexity, risk, onSaved }: SaveTemplateDialogProps) {
   const [open, setOpen] = useState(false)
   const [templateName, setTemplateName] = useState(sectionName)
   const [description, setDescription] = useState("")
   const createTemplate = useCreateSectionTemplate()
 
   const handleSave = async () => {
     await createTemplate.mutateAsync({
       name: templateName,
       description: description || null,
       items,
       tags: tags || null,
       complexity: complexity || null,
       risk: risk || null
     })
     setOpen(false)
     setTemplateName("")
     setDescription("")
     onSaved?.()
   }
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button variant="outline" size="sm" className="gap-2">
           <Save className="h-4 w-4" />
           Salva Template
         </Button>
       </DialogTrigger>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Salva come Template</DialogTitle>
           <DialogDescription>
             Salva questa configurazione per riutilizzarla in futuro
           </DialogDescription>
         </DialogHeader>
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="template-name">Nome Template</Label>
             <Input
               id="template-name"
               value={templateName}
               onChange={(e) => setTemplateName(e.target.value)}
               placeholder="Es. Top Cucina Standard"
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="template-description">Descrizione (opzionale)</Label>
             <Textarea
               id="template-description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Descrizione del template..."
               rows={2}
             />
           </div>
           <div className="text-sm text-muted-foreground">
             <p>Il template includerà:</p>
             <ul className="list-disc list-inside mt-1">
               <li>{items.length} prodotti</li>
               {tags && tags.length > 0 && <li>{tags.length} tag</li>}
               {complexity && <li>Complessità: {complexity}</li>}
               {risk && <li>Rischio: {risk}</li>}
             </ul>
           </div>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={() => setOpen(false)}>
             Annulla
           </Button>
           <Button onClick={handleSave} disabled={!templateName.trim() || createTemplate.isPending}>
             {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   )
 }
 
 interface LoadTemplateDialogProps {
   onLoad: (template: SectionTemplate) => void
 }
 
 export function LoadTemplateDialog({ onLoad }: LoadTemplateDialogProps) {
   const [open, setOpen] = useState(false)
   const { data: templates = [], isLoading } = useSectionTemplates()
   const deleteTemplate = useDeleteSectionTemplate()
 
   const handleLoad = (template: SectionTemplate) => {
     onLoad(template)
     setOpen(false)
   }
 
   const handleDelete = async (e: React.MouseEvent, templateId: string) => {
     e.stopPropagation()
     await deleteTemplate.mutateAsync(templateId)
   }
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button variant="outline" size="sm" className="gap-2">
           <FolderOpen className="h-4 w-4" />
           Carica Template
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-xl">
         <DialogHeader>
           <DialogTitle>Carica Template</DialogTitle>
           <DialogDescription>
             Seleziona un template salvato per creare una nuova sezione
           </DialogDescription>
         </DialogHeader>
         <ScrollArea className="h-[400px] pr-4">
           {isLoading ? (
             <div className="flex items-center justify-center py-8">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
             </div>
           ) : templates.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
               <p>Nessun template salvato</p>
               <p className="text-xs mt-1">Salva una sezione come template per vederla qui</p>
             </div>
           ) : (
             <div className="space-y-3">
               {templates.map((template) => (
                 <div
                   key={template.id}
                   className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                   onClick={() => handleLoad(template)}
                 >
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex-1 min-w-0">
                       <h4 className="font-semibold truncate">{template.name}</h4>
                       {template.description && (
                         <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                           {template.description}
                         </p>
                       )}
                       <div className="flex flex-wrap items-center gap-2 mt-2">
                         <span className="text-xs text-muted-foreground">
                           {template.items.length} prodotti
                         </span>
                         {template.tags && template.tags.length > 0 && (
                           <div className="flex gap-1">
                             {template.tags.slice(0, 3).map((tag) => (
                               <Badge key={tag} variant="outline" className="text-xs">
                                 {tag}
                               </Badge>
                             ))}
                             {template.tags.length > 3 && (
                               <Badge variant="outline" className="text-xs">
                                 +{template.tags.length - 3}
                               </Badge>
                             )}
                           </div>
                         )}
                         {template.complexity && (
                           <Badge variant="secondary" className="text-xs">
                             C:{template.complexity}
                           </Badge>
                         )}
                         {template.risk && (
                           <Badge variant="secondary" className="text-xs">
                             R:{template.risk}
                           </Badge>
                         )}
                       </div>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                       onClick={(e) => handleDelete(e, template.id)}
                       disabled={deleteTemplate.isPending}
                     >
                       {deleteTemplate.isPending ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <Trash2 className="h-4 w-4" />
                       )}
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </ScrollArea>
       </DialogContent>
     </Dialog>
   )
 }