import type { SupabaseClient } from "npm:@supabase/supabase-js@2"

export interface ZohoAttachmentRef {
  id: string
  name: string
  size: number | null
  createdTime: string | null
  modifiedTime: string | null
  sourceModule: "Deals" | "Quotes" | "Notes"
  parentId: string
  sourceLabel: string
}

export interface StagedTechnicalAttachment extends ZohoAttachmentRef {
  downloaded: boolean
  mimeType: string | null
  sha256: string | null
  storagePath: string | null
  signedUrl: string | null
  signedUrlExpiresIn: number | null
  error: string | null
}

const numericId = /^\d{10,25}$/

export function safeFileName(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return normalized.slice(0, 180) || "attachment"
}

export function attachmentRefs(
  records: Record<string, unknown>[],
  sourceModule: ZohoAttachmentRef["sourceModule"],
  parentId: string,
  sourceLabel: string,
): ZohoAttachmentRef[] {
  return records.flatMap((record) => {
    const id = String(record.id ?? "")
    if (!numericId.test(id) || !numericId.test(parentId)) return []
    return [{
      id,
      name: String(record.File_Name ?? `attachment-${id}`),
      size: Number(record.Size) || null,
      createdTime: typeof record.Created_Time === "string" ? record.Created_Time : null,
      modifiedTime: typeof record.Modified_Time === "string" ? record.Modified_Time : null,
      sourceModule,
      parentId,
      sourceLabel,
    }]
  })
}

export function dedupeAttachmentRefs(refs: ZohoAttachmentRef[]) {
  const unique = new Map<string, ZohoAttachmentRef>()
  for (const ref of refs) unique.set(ref.id, ref)
  return [...unique.values()]
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function stageZohoAttachment(input: {
  apiDomain: string
  token: string
  ref: ZohoAttachmentRef
  supabaseAdmin: SupabaseClient
  bucket: string
  userId: string
  dealId: string
  maxBytes?: number
  signedUrlExpiresIn?: number
}): Promise<StagedTechnicalAttachment> {
  const { ref } = input
  const maxBytes = input.maxBytes ?? 50 * 1024 * 1024
  const signedUrlExpiresIn = input.signedUrlExpiresIn ?? 3600
  try {
    if (ref.size && ref.size > maxBytes) throw new Error(`Attachment exceeds ${maxBytes} byte limit`)
    const response = await fetch(
      `${input.apiDomain}/crm/v8/${ref.sourceModule}/${ref.parentId}/Attachments/${ref.id}`,
      { headers: { Authorization: `Zoho-oauthtoken ${input.token}` } },
    )
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Zoho download failed (${response.status}): ${detail.slice(0, 300)}`)
    }
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > maxBytes) throw new Error(`Attachment exceeds ${maxBytes} byte limit`)
    const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream"
    const storagePath = `${input.userId}/${input.dealId}/${ref.sourceModule.toLowerCase()}/${ref.parentId}/${ref.id}-${safeFileName(ref.name)}`
    const { error: uploadError } = await input.supabaseAdmin.storage.from(input.bucket).upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: true,
    })
    if (uploadError) throw uploadError
    const { data: signed, error: signError } = await input.supabaseAdmin.storage.from(input.bucket).createSignedUrl(storagePath, signedUrlExpiresIn)
    if (signError) throw signError
    return {
      ...ref,
      downloaded: true,
      mimeType,
      sha256: await sha256Hex(bytes),
      storagePath,
      signedUrl: signed.signedUrl,
      signedUrlExpiresIn,
      error: null,
    }
  } catch (error) {
    return {
      ...ref,
      downloaded: false,
      mimeType: null,
      sha256: null,
      storagePath: null,
      signedUrl: null,
      signedUrlExpiresIn: null,
      error: error instanceof Error ? error.message : "Attachment staging failed",
    }
  }
}
