import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "custom_suggested_tags"
const DEFAULT_TAGS = ["Cucina", "Bagno", "Esterno", "Top", "Rivestimento", "Interno", "Premium"]

export function useTags() {
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_TAGS
    } catch {
      return DEFAULT_TAGS
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags))
  }, [tags])

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed])
    }
  }, [tags])

  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }, [])

  const resetToDefaults = useCallback(() => {
    setTags(DEFAULT_TAGS)
  }, [])

  return { tags, addTag, removeTag, resetToDefaults }
}

export function getSuggestedTags(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_TAGS
  } catch {
    return DEFAULT_TAGS
  }
}
