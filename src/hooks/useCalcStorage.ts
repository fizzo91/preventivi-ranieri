import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface CalcEntry {
  id: string
  expression: string
  result: string
  note?: string | null
  quote_id?: string | null
  created_at: string
}

const LS_KEY = "scientific-calculator-history"

function loadLocal(): CalcEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]")
  } catch { return [] }
}
function saveLocal(entries: CalcEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

/**
 * Hybrid calculator storage: uses Supabase when authenticated, localStorage otherwise.
 */
export function useCalcStorage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [entries, setEntries] = useState<CalcEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setAuthChecked(true)
    })
  }, [])

  // Load data
  useEffect(() => {
    if (!authChecked) return

    if (userId) {
      supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setEntries(data as CalcEntry[])
          setLoading(false)
        })
    } else {
      setEntries(loadLocal())
      setLoading(false)
    }
  }, [authChecked, userId])

  const refetch = useCallback(async () => {
    if (userId) {
      const { data } = await supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false })
      if (data) setEntries(data as CalcEntry[])
    }
  }, [userId])

  const addEntry = useCallback(async (expression: string, result: string) => {
    if (userId) {
      await supabase.from("calculations").insert({
        user_id: userId,
        expression,
        result,
      } as any)
      await refetch()
    } else {
      const entry: CalcEntry = {
        id: crypto.randomUUID(),
        expression,
        result,
        created_at: new Date().toISOString(),
      }
      const updated = [entry, ...loadLocal()].slice(0, 100)
      saveLocal(updated)
      setEntries(updated)
    }
  }, [userId, refetch])

  const updateEntry = useCallback(async (id: string, updates: { note?: string | null; quote_id?: string | null }) => {
    if (userId) {
      await supabase.from("calculations").update(updates as any).eq("id", id)
      await refetch()
    } else {
      const all = loadLocal().map(e => e.id === id ? { ...e, ...updates } : e)
      saveLocal(all)
      setEntries(all)
    }
  }, [userId, refetch])

  const deleteEntry = useCallback(async (id: string) => {
    if (userId) {
      await supabase.from("calculations").delete().eq("id", id)
      await refetch()
    } else {
      const all = loadLocal().filter(e => e.id !== id)
      saveLocal(all)
      setEntries(all)
    }
  }, [userId, refetch])

  const clearAll = useCallback(async () => {
    if (userId) {
      await supabase.from("calculations").delete().eq("user_id", userId)
      setEntries([])
    } else {
      saveLocal([])
      setEntries([])
    }
    toast({ title: "Cronologia cancellata" })
  }, [userId, toast])

  return { entries, loading, isAuthenticated: !!userId, addEntry, updateEntry, deleteEntry, clearAll }
}
