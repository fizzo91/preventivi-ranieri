import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, MessageSquarePlus, Check, X, History, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  useCalculations,
  useCreateCalculation,
  useUpdateCalculation,
  useDeleteCalculation,
  useClearCalculations,
} from "@/hooks/useCalculations"
import { useQuotes } from "@/hooks/useQuotes"

const evaluate = (expr: string): string => {
  try {
    let sanitized = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![x])/g, `(${Math.E})`)
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/\^/g, "**")

    const result = Function(`"use strict"; return (${sanitized})`)()
    if (typeof result !== "number" || !isFinite(result)) return "Errore"
    return Number.isInteger(result) ? result.toString() : parseFloat(result.toPrecision(12)).toString()
  } catch {
    return "Errore"
  }
}

const buttons = [
  ["sin(", "cos(", "tan(", "π"],
  ["log(", "ln(", "sqrt(", "^"],
  ["C", "(", ")", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ",", "±", "="],
]

const getButtonStyle = (btn: string) => {
  if (btn === "=") return "bg-primary/80 text-primary-foreground hover:bg-primary/90 backdrop-blur-sm"
  if (btn === "C") return "bg-destructive/60 text-destructive-foreground hover:bg-destructive/70 backdrop-blur-sm"
  if (["÷", "×", "−", "+", "^"].includes(btn))
    return "bg-accent/40 text-accent-foreground hover:bg-accent/60 backdrop-blur-sm"
  if (["sin(", "cos(", "tan(", "log(", "ln(", "sqrt(", "π", "(", ")"].includes(btn))
    return "bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 backdrop-blur-sm text-xs"
  return "bg-card/40 text-card-foreground hover:bg-card/60 backdrop-blur-sm"
}

export function ScientificCalculator() {
  const [display, setDisplay] = useState("0")
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const { toast } = useToast()

  const { data: calculations = [], isLoading } = useCalculations()
  const { data: quotes = [] } = useQuotes()
  const createCalc = useCreateCalculation()
  const updateCalc = useUpdateCalculation()
  const deleteCalc = useDeleteCalculation()
  const clearCalcs = useClearCalculations()
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard support
  useEffect(() => {
    const keyMap: Record<string, string> = {
      "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
      "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
      "+": "+", "-": "−", "*": "×", "/": "÷",
      ".": ",", ",": ",",
      "(": "(", ")": ")",
      "^": "^",
      "Enter": "=", "=": "=",
      "Escape": "C", "Delete": "C", "Backspace": "C",
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when editing note or linking
      if (editingNote || linkingId) return
      const btn = keyMap[e.key]
      if (btn) {
        e.preventDefault()
        handleButton(btn)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleButton, editingNote, linkingId])


    setDisplay((prev) => {
      if (btn === "C") return "0"
      if (btn === "±") {
        if (prev === "0" || prev === "Errore") return prev
        return prev.startsWith("-") ? prev.slice(1) : "-" + prev
      }
      if (btn === "=") {
        const result = evaluate(prev.replace(/−/g, "-").replace(/,/g, "."))
        if (result !== "Errore") {
          createCalc.mutate({ expression: prev, result })
        }
        return result
      }
      if (prev === "0" || prev === "Errore") {
        if ("0123456789".includes(btn)) return btn
        if (btn === ",") return "0,"
        return btn
      }
      return prev + btn
    })
  }, [createCalc])

  const startEditNote = (id: string, currentNote?: string | null) => {
    setEditingNote(id)
    setNoteText(currentNote || "")
  }

  const saveNote = (id: string) => {
    updateCalc.mutate({ id, note: noteText.trim() || null })
    setEditingNote(null)
    setNoteText("")
  }

  const linkToQuote = (calcId: string, quoteId: string | null) => {
    updateCalc.mutate({ id: calcId, quote_id: quoteId })
    setLinkingId(null)
    toast({ title: quoteId ? "Calcolo associato al preventivo" : "Associazione rimossa" })
  }

  const useResult = (result: string) => {
    setDisplay(result)
    setShowHistory(false)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  }

  const getQuoteName = (quoteId: string | null) => {
    if (!quoteId) return null
    const q = quotes.find((q) => q.id === quoteId)
    return q ? `#${q.quote_number}` : null
  }

  return (
    <div className="flex gap-3 w-full max-w-2xl mx-auto">
      {/* Calculator */}
      <div className="flex-1 space-y-3">
        {/* Display */}
        <div className="relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative p-4">
            <div className="text-right text-2xl font-mono font-bold text-foreground tracking-wide min-h-[2.5rem] break-all leading-tight">
              {display}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="relative rounded-2xl border border-border/50 bg-card/20 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative p-3 grid grid-cols-4 gap-1.5">
            {buttons.flat().map((btn, i) => (
              <Button
                key={`${btn}-${i}`}
                variant="ghost"
                className={cn(
                  "h-11 rounded-xl font-semibold text-sm transition-all border border-border/30",
                  getButtonStyle(btn)
                )}
                onClick={() => handleButton(btn)}
              >
                {btn}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full sm:hidden gap-2 bg-card/30 backdrop-blur-sm border-border/50"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4" />
          {showHistory ? "Nascondi cronologia" : "Mostra cronologia"}
          {calculations.length > 0 && (
            <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">
              {calculations.length}
            </span>
          )}
        </Button>
      </div>

      {/* History sidebar */}
      <div
        className={cn(
          "w-60 rounded-2xl border border-border/50 bg-card/20 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col",
          "hidden sm:flex",
          showHistory && "!flex absolute right-0 top-0 bottom-0 z-10 sm:relative"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none rounded-2xl" />
        <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-border/30">
          <div className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Cronologia</span>
          </div>
          {calculations.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => clearCalcs.mutate(null)}
              title="Cancella tutto"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        <ScrollArea className="relative flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Caricamento...</div>
          ) : calculations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              I calcoli appariranno qui
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {calculations.map((entry) => (
                <div
                  key={entry.id}
                  className="group rounded-lg bg-card/30 backdrop-blur-sm border border-border/20 p-2 hover:bg-card/50 transition-colors cursor-pointer"
                  onClick={() => useResult(entry.result)}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-muted-foreground truncate">{entry.expression}</div>
                      <div className="text-sm font-bold text-foreground font-mono">= {entry.result}</div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => { e.stopPropagation(); setLinkingId(linkingId === entry.id ? null : entry.id) }}
                        title="Associa a preventivo"
                      >
                        <Link className={cn("h-3 w-3", entry.quote_id && "text-primary")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => { e.stopPropagation(); startEditNote(entry.id, entry.note) }}
                        title="Aggiungi nota"
                      >
                        <MessageSquarePlus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteCalc.mutate(entry.id) }}
                        title="Elimina"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Quote link selector */}
                  {linkingId === entry.id && (
                    <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={entry.quote_id || "none"}
                        onValueChange={(v) => linkToQuote(entry.id, v === "none" ? null : v)}
                      >
                        <SelectTrigger className="h-7 text-[10px]">
                          <SelectValue placeholder="Seleziona preventivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nessun preventivo</SelectItem>
                          {quotes.map((q) => (
                            <SelectItem key={q.id} value={q.id}>
                              #{q.quote_number} - {q.client_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quote badge */}
                  {entry.quote_id && linkingId !== entry.id && (
                    <div className="mt-1 text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5 inline-block">
                      🔗 {getQuoteName(entry.quote_id)}
                    </div>
                  )}

                  {/* Note edit */}
                  {editingNote === entry.id ? (
                    <div className="mt-1.5 flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Nota..."
                        className="h-6 text-[10px] bg-background/50 border-border/30"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && saveNote(entry.id)}
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => saveNote(entry.id)}>
                        <Check className="h-3 w-3 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setEditingNote(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : entry.note ? (
                    <div
                      className="mt-1 text-[10px] text-muted-foreground italic bg-accent/20 rounded px-1.5 py-0.5"
                      onClick={(e) => { e.stopPropagation(); startEditNote(entry.id, entry.note) }}
                    >
                      📝 {entry.note}
                    </div>
                  ) : null}

                  <div className="text-[9px] text-muted-foreground/60 mt-1">{formatTime(entry.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
