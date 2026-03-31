import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, MessageSquarePlus, Check, X, History, ChevronRight, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface HistoryEntry {
  id: string
  expression: string
  result: string
  timestamp: number
  note?: string
}

const STORAGE_KEY = "scientific-calculator-history"

const loadHistory = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveHistory = (entries: HistoryEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

const evaluate = (expr: string): string => {
  try {
    // Replace display symbols with JS equivalents
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

    // eslint-disable-next-line no-eval
    const result = Function(`"use strict"; return (${sanitized})`)()
    if (typeof result !== "number" || !isFinite(result)) return "Errore"
    // Format nicely
    return Number.isInteger(result) ? result.toString() : parseFloat(result.toPrecision(12)).toString()
  } catch {
    return "Errore"
  }
}

const buttons = [
  // Row 1 - scientific
  ["sin(", "cos(", "tan(", "π"],
  ["log(", "ln(", "sqrt(", "^"],
  // Row 2 - clear / ops
  ["C", "(", ")", "÷"],
  // Row 3-5 - numbers
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  // Row 6
  ["0", ",", "±", "="],
]

const getButtonStyle = (btn: string) => {
  if (btn === "=") return "bg-primary/80 text-primary-foreground hover:bg-primary/90 backdrop-blur-sm col-span-1"
  if (btn === "C") return "bg-destructive/60 text-destructive-foreground hover:bg-destructive/70 backdrop-blur-sm"
  if (["÷", "×", "−", "+", "^"].includes(btn))
    return "bg-accent/40 text-accent-foreground hover:bg-accent/60 backdrop-blur-sm"
  if (["sin(", "cos(", "tan(", "log(", "ln(", "sqrt(", "π", "(", ")"].includes(btn))
    return "bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 backdrop-blur-sm text-xs"
  return "bg-card/40 text-card-foreground hover:bg-card/60 backdrop-blur-sm"
}

export function ScientificCalculator() {
  const [display, setDisplay] = useState("0")
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const handleButton = useCallback((btn: string) => {
    setDisplay((prev) => {
      if (btn === "C") return "0"
      if (btn === "±") {
        if (prev === "0" || prev === "Errore") return prev
        return prev.startsWith("-") ? prev.slice(1) : "-" + prev
      }
      if (btn === "=") {
        const result = evaluate(prev.replace(/−/g, "-").replace(/,/g, "."))
        if (result !== "Errore") {
          const entry: HistoryEntry = {
            id: crypto.randomUUID(),
            expression: prev,
            result,
            timestamp: Date.now(),
          }
          setHistory((h) => [entry, ...h].slice(0, 100))
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
  }, [])

  const deleteEntry = (id: string) => {
    setHistory((h) => h.filter((e) => e.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
    toast({ title: "Cronologia cancellata" })
  }

  const startEditNote = (entry: HistoryEntry) => {
    setEditingNote(entry.id)
    setNoteText(entry.note || "")
  }

  const saveNote = (id: string) => {
    setHistory((h) =>
      h.map((e) => (e.id === id ? { ...e, note: noteText.trim() || undefined } : e))
    )
    setEditingNote(null)
    setNoteText("")
  }

  const useResult = (result: string) => {
    setDisplay(result)
    setShowHistory(false)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
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

        {/* Toggle history on mobile */}
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:hidden gap-2 bg-card/30 backdrop-blur-sm border-border/50"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4" />
          {showHistory ? "Nascondi cronologia" : "Mostra cronologia"}
          {history.length > 0 && (
            <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 rounded-full">
              {history.length}
            </span>
          )}
        </Button>
      </div>

      {/* History sidebar */}
      <div
        className={cn(
          "w-56 rounded-2xl border border-border/50 bg-card/20 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col",
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
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={clearHistory}
              title="Cancella tutto"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        <ScrollArea className="relative flex-1">
          {history.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              I calcoli appariranno qui
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {history.map((entry) => (
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
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditNote(entry)
                        }}
                        title="Aggiungi nota"
                      >
                        <MessageSquarePlus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteEntry(entry.id)
                        }}
                        title="Elimina"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Note display or edit */}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditNote(entry)
                      }}
                    >
                      📝 {entry.note}
                    </div>
                  ) : null}

                  <div className="text-[9px] text-muted-foreground/60 mt-1">{formatTime(entry.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
