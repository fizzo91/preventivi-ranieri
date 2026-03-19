import { useState, useMemo } from "react"
import { useQuotes } from "@/hooks/useQuotes"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, Search, FileText, AlignLeft } from "lucide-react"
import { downloadJson } from "@/utils/exportUtils"
import { formatDate } from "@/utils/formatting"

interface DescriptionEntry {
  section_name: string
  description: string
  quote_number: string
  client_name: string
  date: string
}

const Descriptions = () => {
  const { data: quotes, isLoading } = useQuotes()
  const [search, setSearch] = useState("")

  const entries = useMemo(() => {
    if (!quotes) return []
    const result: DescriptionEntry[] = []
    for (const q of quotes) {
      const sections = Array.isArray(q.sections) ? q.sections : []
      for (const s of sections as any[]) {
        if (s.description?.trim()) {
          result.push({
            section_name: s.name || "Senza nome",
            description: s.description.trim(),
            quote_number: q.quote_number,
            client_name: q.client_name,
            date: q.date,
          })
        }
      }
    }
    return result
  }, [quotes])

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.section_name.toLowerCase().includes(q) ||
        e.quote_number.toLowerCase().includes(q) ||
        e.client_name.toLowerCase().includes(q)
    )
  }, [entries, search])

  const handleDownloadJson = () => {
    downloadJson(filtered, `descrizioni-training-${new Date().toISOString().split("T")[0]}.json`)
  }

  const handleDownloadTxt = () => {
    const text = filtered
      .map(
        (e) =>
          `[${e.quote_number} — ${e.client_name}]\nSezione: ${e.section_name}\n\n${e.description}`
      )
      .join("\n\n---\n\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `descrizioni-training-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <LoadingSpinner message="Caricamento descrizioni..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archivio Descrizioni"
        description={`${entries.length} descrizioni estratte dai preventivi`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTxt} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1" /> TXT
            </Button>
            <Button size="sm" onClick={handleDownloadJson} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1" /> JSON
            </Button>
          </div>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per descrizione, sezione, preventivo o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlignLeft} message="Nessuna descrizione trovata." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((entry, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground">{entry.section_name}</h3>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {entry.quote_number}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {entry.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                  <FileText className="h-3 w-3" />
                  <span>{entry.client_name}</span>
                  <span>·</span>
                  <span>{formatDate(entry.date)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Descriptions
