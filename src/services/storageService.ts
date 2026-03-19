/**
 * Centralized Supabase Storage operations for section chart images
 */
import { supabase } from "@/integrations/supabase/client"
import { validateImageFile, getContentTypeForExtension } from "@/lib/fileValidation"

const BUCKET = 'section-charts'
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 // 1 year

export interface UploadResult {
  success: boolean
  signedUrl?: string
  filePath?: string
  error?: string
}

/**
 * Upload a chart image to storage with validation
 */
export async function uploadChartImage(
  userId: string,
  sectionId: string,
  file: File
): Promise<UploadResult> {
  const validation = await validateImageFile(file)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const fileName = `${userId}/${sectionId}-${validation.sanitizedFilename}`
  const extension = fileName.split('.').pop() || 'jpg'
  const contentType = getContentTypeForExtension(extension)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { contentType, upsert: false })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileName, SIGNED_URL_EXPIRY)

  if (signedUrlError) {
    return { success: false, error: signedUrlError.message }
  }

  return { success: true, signedUrl: data.signedUrl, filePath: fileName }
}

/**
 * Remove a chart image from storage
 */
export async function removeChartImage(
  filePath?: string,
  chartImageUrl?: string
): Promise<void> {
  if (filePath) {
    await supabase.storage.from(BUCKET).remove([filePath])
    return
  }

  // Fallback: extract path from signed URL
  if (chartImageUrl) {
    const urlParts = chartImageUrl.split(`/${BUCKET}/`)
    if (urlParts.length > 1) {
      const pathWithParams = urlParts[1]
      const path = pathWithParams.split('?')[0]
      await supabase.storage.from(BUCKET).remove([path])
    }
  }
}

/**
 * Regenerate a signed URL from a file path
 */
export async function regenerateSignedUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY)

    if (error || !data?.signedUrl) return null
    return data.signedUrl
  } catch {
    return null
  }
}

/**
 * Extract a storage path from a signed URL
 */
export function extractPathFromSignedUrl(url: string): string | undefined {
  // Match signed URLs with query params
  const matchWithQuery = url.match(/section-charts\/(.+?)\?/)
  if (matchWithQuery) return matchWithQuery[1]
  
  // Match public/direct URLs without query params
  const matchDirect = url.match(/section-charts\/(.+?)$/)
  if (matchDirect) return matchDirect[1]
  
  // Match /object/sign/ or /object/public/ patterns
  const matchObject = url.match(/\/object\/(?:sign|public)\/section-charts\/(.+?)(?:\?|$)/)
  if (matchObject) return matchObject[1]
  
  return undefined
}
