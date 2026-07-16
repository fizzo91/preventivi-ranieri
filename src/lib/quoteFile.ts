/**
 * Serializzazione / parsing dei file preventivo `.rpv.json`.
 *
 * Contengono uno snapshot completo del preventivo (sezioni, voci, cliente,
 * rischi, note). Le immagini delle sezioni restano come URL firmati del
 * bucket `section-charts`: potrebbero scadere ma il file resta leggibile.
 */

import type { QuoteSection } from "@/types/quote"
import type { EnamelPieceRow } from "@/components/EnamelCostCalculator"

export const RPV_FORMAT = "rpv" as const
export const RPV_VERSION = 1 as const
export const RPV_EXTENSION = ".rpv.json"
export const RPV_MIME = "application/json"

export interface RpvClientData {
  name: string
  email: string
  phone: string
  address: string
  company: string
}

export interface RpvQuoteMeta {
  number: string
  date: string
  validUntil: string
  notes: string
  status: string
}

export interface RpvFile {
  format: typeof RPV_FORMAT
  version: typeof RPV_VERSION
  savedAt: string
  quoteId?: string | null
  client: RpvClientData
  quote: RpvQuoteMeta
  sections: QuoteSection[]
  enamelData: Record<string, EnamelPieceRow[]>
}

interface SerializeInput {
  quoteId?: string | null
  client: RpvClientData
  quote: RpvQuoteMeta
  sections: QuoteSection[]
  enamelData: Record<string, EnamelPieceRow[]>
}

export function serializeQuote(input: SerializeInput): RpvFile {
  return {
    format: RPV_FORMAT,
    version: RPV_VERSION,
    savedAt: new Date().toISOString(),
    quoteId: input.quoteId ?? null,
    client: input.client,
    quote: input.quote,
    sections: input.sections,
    enamelData: input.enamelData ?? {},
  }
}

export function quoteFileBlob(input: SerializeInput): Blob {
  return new Blob([JSON.stringify(serializeQuote(input), null, 2)], {
    type: RPV_MIME,
  })
}

export function buildQuoteFileName(quote: RpvQuoteMeta, client: RpvClientData): string {
  const slug = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
  const parts = [slug(quote.number) || "preventivo", slug(client.name)].filter(Boolean)
  return `${parts.join("-")}${RPV_EXTENSION}`
}

export async function parseQuoteFile(file: File | Blob): Promise<RpvFile> {
  const text = await file.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Il file non è un JSON valido.")
  }
  if (!data || data.format !== RPV_FORMAT) {
    throw new Error("Formato file non riconosciuto (atteso .rpv.json).")
  }
  if (typeof data.version !== "number" || data.version > RPV_VERSION) {
    throw new Error(`Versione file non supportata (${data.version}).`)
  }
  if (!Array.isArray(data.sections)) {
    throw new Error("File corrotto: sezioni mancanti.")
  }
  return {
    format: RPV_FORMAT,
    version: RPV_VERSION,
    savedAt: data.savedAt ?? new Date().toISOString(),
    quoteId: data.quoteId ?? null,
    client: {
      name: data.client?.name ?? "",
      email: data.client?.email ?? "",
      phone: data.client?.phone ?? "",
      address: data.client?.address ?? "",
      company: data.client?.company ?? "",
    },
    quote: {
      number: data.quote?.number ?? `PREV-${Date.now()}`,
      date: data.quote?.date ?? new Date().toISOString().split("T")[0],
      validUntil: data.quote?.validUntil ?? "",
      notes: data.quote?.notes ?? "",
      status: data.quote?.status ?? "draft",
    },
    sections: data.sections,
    enamelData: data.enamelData ?? {},
  }
}

/**
 * Scarica il file (fallback classico). Se `handle` è un FileSystemFileHandle
 * writable (Chromium), sovrascrive il file sorgente senza dialog.
 */
export async function writeQuoteFile(
  input: SerializeInput,
  handle: FileSystemFileHandle | null,
): Promise<"overwritten" | "downloaded"> {
  const blob = quoteFileBlob(input)
  if (handle && typeof (handle as any).createWritable === "function") {
    try {
      // @ts-ignore - permission API sperimentale
      const perm = handle.queryPermission ? await handle.queryPermission({ mode: "readwrite" }) : "granted"
      let granted = perm === "granted"
      if (!granted && (handle as any).requestPermission) {
        // @ts-ignore
        granted = (await handle.requestPermission({ mode: "readwrite" })) === "granted"
      }
      if (granted) {
        const writable = await (handle as any).createWritable()
        await writable.write(blob)
        await writable.close()
        return "overwritten"
      }
    } catch (err) {
      console.warn("Overwrite file fallito, fallback su download:", err)
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = buildQuoteFileName(input.quote, input.client)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return "downloaded"
}
