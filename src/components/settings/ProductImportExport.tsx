import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, Loader2, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProducts, type Product } from "@/hooks/useProducts"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

const CSV_HEADERS = [
  "code",
  "name",
  "description",
  "category",
  "unit",
  "price_em",
  "price_dt",
  "notes",
  "archived",
] as const

type CsvHeader = typeof CSV_HEADERS[number]

const escapeCsv = (val: unknown): string => {
  if (val === null || val === undefined) return ""
  const s = String(val)
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const parseCsv = (text: string): Record<string, string>[] => {
  // Robust CSV parser supporting quoted fields, commas/semicolons, escaped quotes
  const rows: string[][] = []
  let cur: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0
  // Detect delimiter from first non-quoted line
  const firstLine = text.split(/\r?\n/).find(l => l.trim().length > 0) || ""
  const delim = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ","

  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += c; i++; continue
    }
    if (c === '"') { inQuotes = true; i++; continue }
    if (c === delim) { cur.push(field); field = ""; i++; continue }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      cur.push(field); field = ""
      if (cur.some(v => v.length > 0)) rows.push(cur)
      cur = []
      i++; continue
    }
    field += c; i++
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); if (cur.some(v => v.length > 0)) rows.push(cur) }

  if (rows.length === 0) return []
  const headers = rows[0].map(h => h.trim().toLowerCase())
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim() })
    return obj
  })
}

const parseNumber = (v: string | undefined): number => {
  if (!v) return 0
  const cleaned = v.replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "")
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

export const ProductImportExport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: products = [] } = useProducts({ includeArchived: true })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const handleExport = () => {
    const lines = [CSV_HEADERS.join(",")]
    for (const p of products) {
      const row: Record<CsvHeader, unknown> = {
        code: p.code ?? "",
        name: p.name,
        description: p.description ?? "",
        category: p.category ?? "",
        unit: p.unit ?? "",
        price_em: p.price_em ?? 0,
        price_dt: p.price_dt ?? 0,
        notes: p.notes ?? "",
        archived: p.archived ? "true" : "false",
      }
      lines.push(CSV_HEADERS.map(h => escapeCsv(row[h])).join(","))
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prodotti_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: "Esportato", description: `${products.length} prodotti scaricati.` })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) throw new Error("File CSV vuoto o non valido")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non autenticato")

      // Index existing by code and by name (lowercased)
      const byCode = new Map<string, Product>()
      const byName = new Map<string, Product>()
      for (const p of products) {
        if (p.code) byCode.set(p.code.trim().toLowerCase(), p)
        byName.set(p.name.trim().toLowerCase(), p)
      }

      let inserted = 0
      let updated = 0
      let skipped = 0
      const errors: string[] = []

      for (const [idx, r] of rows.entries()) {
        const name = (r.name || "").trim()
        if (!name) { skipped++; continue }
        const code = (r.code || "").trim() || null
        const payload = {
          name,
          description: r.description || null,
          category: r.category || "",
          unit: r.unit || "pz",
          price_em: parseNumber(r.price_em),
          price_dt: parseNumber(r.price_dt),
          code,
          notes: r.notes || null,
          archived: ["1", "true", "vero", "si", "sì", "yes"].includes((r.archived || "").toLowerCase()),
        }

        const existing =
          (code && byCode.get(code.toLowerCase())) ||
          byName.get(name.toLowerCase())

        if (existing) {
          const { error } = await supabase.from("products").update(payload).eq("id", existing.id)
          if (error) errors.push(`Riga ${idx + 2}: ${error.message}`)
          else updated++
        } else {
          const { error } = await supabase.from("products").insert({ ...payload, user_id: user.id })
          if (error) errors.push(`Riga ${idx + 2}: ${error.message}`)
          else inserted++
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["products"] })
      toast({
        title: "Importazione completata",
        description: `${inserted} nuovi, ${updated} aggiornati${skipped ? `, ${skipped} saltati` : ""}${errors.length ? `, ${errors.length} errori` : ""}.`,
        variant: errors.length ? "destructive" : "default",
      })
      if (errors.length) console.warn("Errori import prodotti:", errors)
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Impossibile importare il file", variant: "destructive" })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <CardTitle>Listino Prodotti</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scarica l'elenco completo dei tuoi prodotti in formato CSV, modificalo (es. con Excel o Google Sheets) e ricaricalo per aggiornare il listino in blocco.
          L'aggiornamento usa il <strong>codice</strong> come chiave; se assente, il <strong>nome</strong>. I prodotti non trovati vengono creati.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Scarica listino (CSV)
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-2">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Carica listino aggiornato
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Colonne attese: {CSV_HEADERS.join(", ")}. Prezzi accettano sia il punto che la virgola come separatore decimale.
        </p>
      </CardContent>
    </Card>
  )
}
