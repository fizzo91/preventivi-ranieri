 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select"
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip"
 import { cn } from "@/lib/utils"
 
 interface ComplexityRiskIndicatorProps {
   type: "C" | "R"
   value: number | undefined
   onChange: (value: number) => void
 }
 
 const LEVEL_COLORS: Record<number, string> = {
   1: "bg-green-500",
   2: "bg-yellow-500",
   3: "bg-orange-500",
   4: "bg-red-500"
 }
 
 const LEVEL_BG_COLORS: Record<number, string> = {
   1: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
   2: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
   3: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
   4: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
 }
 
 const COMPLEXITY_LABELS: Record<number, string> = {
   1: "Semplice",
   2: "Media",
   3: "Complessa",
   4: "Molto Complessa"
 }
 
 const RISK_LABELS: Record<number, string> = {
   1: "Basso",
   2: "Moderato",
   3: "Alto",
   4: "Molto Alto"
 }
 
 export function ComplexityRiskIndicator({ type, value, onChange }: ComplexityRiskIndicatorProps) {
   const labels = type === "C" ? COMPLEXITY_LABELS : RISK_LABELS
   const tooltip = type === "C" ? "Complessità lavorazione" : "Rischio generale"
 
   return (
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger asChild>
           <div>
             <Select
               value={value?.toString() || ""}
               onValueChange={(v) => onChange(parseInt(v))}
             >
               <SelectTrigger 
                 className={cn(
                   "h-8 w-12 p-0 text-xs font-bold border",
                   value ? LEVEL_BG_COLORS[value] : "bg-muted"
                 )}
               >
                 <SelectValue placeholder={type}>
                   {value ? `${type}:${value}` : type}
                 </SelectValue>
               </SelectTrigger>
               <SelectContent>
                 {[1, 2, 3, 4].map((level) => (
                   <SelectItem key={level} value={level.toString()}>
                     <div className="flex items-center gap-2">
                       <div className={cn("w-3 h-3 rounded-full", LEVEL_COLORS[level])} />
                       <span>{level} - {labels[level]}</span>
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </TooltipTrigger>
         <TooltipContent>
           <p>{tooltip}</p>
           {value && <p className="text-xs text-muted-foreground">{labels[value]}</p>}
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   )
 }