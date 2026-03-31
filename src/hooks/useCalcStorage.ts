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

function loadLocal(quoteId?: string | null): CalcEntry[] {
  try {
    const all: CalcEntry[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]")
    if (quoteId) return all.filter(e => e.quote_id === quoteId)
    return all.filter(e => !e.quote_id)
  } catch { return [] }
}
function loadAllLocal(): CalcEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]")
  } catch { return [] }
}
function saveLocal(entries: CalcEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

interface UseCalcStorageOptions {
  quoteId?: string | null
}

/**
 * Hybrid calculator storage: uses Supabase when authenticated, localStorage otherwise.
 * When quoteId is provided, only shows calculations for that quote.
 * When quoteId is not provided, shows only unlinked calculations.
 */
export function useCalcStorage(options?: UseCalcStorageOptions) {
  const filterQuoteId = options?.quoteId
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

  // Load data filtered by quoteId
  useEffect(() => {
    if (!authChecked) return

    if (userId) {
      let query = supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false })

      if (filterQuoteId) {
        query = query.eq("quote_id", filterQuoteId)
      } else {
        query = query.is("quote_id", null)
      }

      query.then(({ data, error }) => {
        if (!error && data) setEntries(data as CalcEntry[])
        setLoading(false)
      })
    } else {
      setEntries(loadLocal(filterQuoteId))
      setLoading(false)
    }
  }, [authChecked, userId, filterQuoteId])

  const refetch = useCallback(async () => {
    if (userId) {
      let query = supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false })

      if (filterQuoteId) {
        query = query.eq("quote_id", filterQuoteId)
      } else {
        query = query.is("quote_id", null)
      }

      const { data } = await query
      if (data) setEntries(data as CalcEntry[])
    } else {
      setEntries(loadLocal(filterQuoteId))
    }
  }, [userId, filterQuoteId])

  const addEntry = useCallback(async (expression: string, result: string, quoteId?: string | null) => {
    const effectiveQuoteId = quoteId ?? filterQuoteId ?? null
    if (userId) {
      await supabase.from("calculations").insert({
        user_id: userId,
        expression,
        result,
        quote_id: effectiveQuoteId,
      } as any)
      await refetch()
    } else {
      const entry: CalcEntry = {
        id: crypto.randomUUID(),
        expression,
        result,
        quote_id: effectiveQuoteId,
        created_at: new Date().toISOString(),
      }
      const all = loadAllLocal()
      const updated = [entry, ...all].slice(0, 500)
      saveLocal(updated)
      setEntries(loadLocal(filterQuoteId))
    }
  }, [userId, refetch, filterQuoteId])

  const updateEntry = useCallback(async (id: string, updates: { note?: string | null; quote_id?: string | null }) => {
    if (userId) {
      await supabase.from("calculations").update(updates as any).eq("id", id)
      await refetch()
    } else {
      const all = loadAllLocal().map(e => e.id === id ? { ...e, ...updates } : e)
      saveLocal(all)
      setEntries(loadLocal(filterQuoteId))
    }
  }, [userId, refetch, filterQuoteId])

  const deleteEntry = useCallback(async (id: string) => {
    if (userId) {
      await supabase.from("calculations").delete().eq("id", id)
      await refetch()
    } else {
      const all = loadAllLocal().filter(e => e.id !== id)
      saveLocal(all)
      setEntries(loadLocal(filterQuoteId))
    }
  }, [userId, refetch, filterQuoteId])

  const clearAll = useCallback(async () => {
    if (userId) {
      let query = supabase.from("calculations").delete()
      if (filterQuoteId) {
        query = query.eq("quote_id", filterQuoteId)
      } else {
        query = query.eq("user_id", userId).is("quote_id", null)
      }
      await query
      setEntries([])
    } else {
      if (filterQuoteId) {
        const all = loadAllLocal().filter(e => e.quote_id !== filterQuoteId)
        saveLocal(all)
      } else {
        const all = loadAllLocal().filter(e => !!e.quote_id)
        saveLocal(all)
      }
      setEntries([])
    }
    toast({ title: "Cronologia cancellata" })
  }, [userId, filterQuoteId, toast])

  return { entries, loading, isAuthenticated: !!userId, addEntry, updateEntry, deleteEntry, clearAll }
}
