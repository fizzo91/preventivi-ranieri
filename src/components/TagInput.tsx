import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSuggestedTags } from "@/hooks/useTags"
 
 interface TagInputProps {
   tags: string[]
   onChange: (tags: string[]) => void
   className?: string
 }
 
 export function TagInput({ tags, onChange, className }: TagInputProps) {
   const [inputValue, setInputValue] = useState("")
   const [showSuggestions, setShowSuggestions] = useState(false)
 
   const addTag = (tag: string) => {
     const trimmedTag = tag.trim()
     if (trimmedTag && !tags.includes(trimmedTag)) {
       onChange([...tags, trimmedTag])
     }
     setInputValue("")
     setShowSuggestions(false)
   }
 
   const removeTag = (tagToRemove: string) => {
     onChange(tags.filter(tag => tag !== tagToRemove))
   }
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === "Enter" || e.key === ",") {
       e.preventDefault()
       if (inputValue.trim()) {
         addTag(inputValue)
       }
     }
   }
 
    const filteredSuggestions = getSuggestedTags().filter(
      suggestion => 
        !tags.includes(suggestion) && 
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
    )
 
   return (
     <div className={cn("space-y-2", className)}>
       {/* Tags display */}
       {tags.length > 0 && (
         <div className="flex flex-wrap gap-1">
           {tags.map((tag) => (
             <Badge key={tag} variant="secondary" className="gap-1 text-xs">
               {tag}
               <button
                 type="button"
                 onClick={() => removeTag(tag)}
                 className="hover:bg-muted rounded-full p-0.5"
               >
                 <X className="h-3 w-3" />
               </button>
             </Badge>
           ))}
         </div>
       )}
 
       {/* Input */}
       <div className="relative">
         <Input
           value={inputValue}
           onChange={(e) => {
             setInputValue(e.target.value)
             setShowSuggestions(true)
           }}
           onFocus={() => setShowSuggestions(true)}
           onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
           onKeyDown={handleKeyDown}
           placeholder="Aggiungi tag..."
           className="h-8 text-xs"
         />
 
         {/* Suggestions dropdown */}
         {showSuggestions && filteredSuggestions.length > 0 && (
           <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md p-1">
             {filteredSuggestions.slice(0, 5).map((suggestion) => (
               <button
                 key={suggestion}
                 type="button"
                 onClick={() => addTag(suggestion)}
                 className="w-full text-left px-2 py-1 text-xs hover:bg-accent rounded-sm flex items-center gap-1"
               >
                 <Plus className="h-3 w-3" />
                 {suggestion}
               </button>
             ))}
           </div>
         )}
       </div>
     </div>
   )
 }