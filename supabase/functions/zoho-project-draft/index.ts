import { createClient } from "npm:@supabase/supabase-js@2.57.4"
import { buildWordReport } from "../_shared/word-report.ts"
import { destinationFor, ensureProjectFolders, uploadWorkDriveFile } from "../_shared/workdrive.ts"
import { sendTelegramCompletion } from "../_shared/telegram.ts"

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-zoho-webhook-token" }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
const safe = (value: unknown) => String(value ?? "").replace(/[\\/:*?"<>|]/g, "-").trim()

async function authorize(request: Request) {
  const webhookToken = Deno.env.get("ZOHO_WEBHOOK_TOKEN")
  if (webhookToken && request.headers.get("x-zoho-webhook-token") === webhookToken) return "webhook"
  const authorization = request.headers.get("Authorization") ?? ""
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const { data } = await supabase.auth.getUser()
  return data.user ? "user" : null
}

async function accessToken() {
  const clientId = Deno.env.get("ZOHO_CLIENT_ID"), clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET"), refreshToken = Deno.env.get("ZOHO_REFRESH_TOKEN")
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Zoho OAuth is not configured")
  const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" })
  const response = await fetch(`${Deno.env.get("ZOHO_ACCOUNTS_URL") ?? "https://accounts.zoho.eu"}/oauth/v2/token`, { method: "POST", body: params })
  const payload = await response.json()
  if (!response.ok || !payload.access_token) throw new Error(payload.error ?? "Unable to refresh Zoho token")
  return { token: payload.access_token as string, apiDomain: payload.api_domain ?? Deno.env.get("ZOHO_API_DOMAIN") ?? "https://www.zohoapis.eu" }
}

async function zohoGet(apiDomain: string, token: string, path: string) {
  const response = await fetch(`${apiDomain}/crm/v8${path}`, { headers: { Authorization: `Zoho-oauthtoken ${token}` } })
  if (response.status === 204) return { data: [] }
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message ?? `Zoho request failed (${response.status})`)
  return payload
}

async function downloadAttachment(apiDomain: string, token: string, quoteId: string, attachmentId: string) {
  const response = await fetch(`${apiDomain}/crm/v8/Quotes/${quoteId}/Attachments/${attachmentId}`, { headers: { Authorization: `Zoho-oauthtoken ${token}` } })
  if (!response.ok) throw new Error(`Unable to download attachment ${attachmentId} (${response.status})`)
  return await response.blob()
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors })
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405)
  try {
    const source = await authorize(request)
    if (!source) return json({ error: "Not authenticated" }, 401)
    const body = await request.json()
    const quoteId = String(body.quote_id ?? "")
    if (!/^\d{10,25}$/.test(quoteId)) return json({ error: "Invalid Zoho quotation ID" }, 400)

    const { token, apiDomain } = await accessToken()
    const quote = (await zohoGet(apiDomain, token, `/Quotes/${quoteId}`)).data?.[0]
    if (!quote) return json({ error: "Quotation not found" }, 404)
    const trigger = String(body.trigger ?? "quotation_stage")
    const mentionText = String(body.mention_text ?? "")
    const stageTrigger = trigger === "quotation_stage" && quote.Quote_Stage === "Budget Quote Richiesta"
    const mentionTrigger = trigger === "mention" && /francesco\s+izzo|f\.izzo@ranierilavastone\.com/i.test(mentionText)
    if (!stageTrigger && !mentionTrigger) return json({ skipped: true, reason: "trigger_conditions_not_met" })

    const dealId = String(quote.Deal_Name?.id ?? "")
    if (!dealId) return json({ error: "Quotation has no related Deal" }, 409)
    const [dealResult, notesResult, attachmentsResult] = await Promise.all([
      zohoGet(apiDomain, token, `/Deals/${dealId}`),
      zohoGet(apiDomain, token, `/Quotes/${quoteId}/Notes?fields=id,Note_Title,Note_Content,Created_Time,Modified_Time&per_page=200`),
      zohoGet(apiDomain, token, `/Quotes/${quoteId}/Attachments?fields=id,File_Name,Size,Created_Time,Modified_Time&per_page=200`),
    ])
    const deal = dealResult.data?.[0]
    if (!deal) return json({ error: "Related Deal not found" }, 404)
    const notes = (notesResult.data ?? []).map((note: any) => ({ content: note.Note_Content ?? "" }))
    if (mentionText) notes.unshift({ content: mentionText })
    const attachments = (attachmentsResult.data ?? []).map((file: any) => ({ id: String(file.id), name: String(file.File_Name ?? file.id) }))
    const rootId = Deno.env.get("ZOHO_WORKDRIVE_PARENT_FOLDER_ID")
    if (!rootId) throw new Error("ZOHO_WORKDRIVE_PARENT_FOLDER_ID is not configured")
    const projectName = safe(`${deal.Auto_Number_1 ?? dealId} - ${deal.Account_Name?.name ?? "Cliente"} - ${deal.Progetto ?? deal.Deal_Name}`)
    const folders = await ensureProjectFolders(token, rootId, projectName)

    const uploaded: Array<{ name: string; folder: string }> = []
    for (const attachment of attachments) {
      const blob = await downloadAttachment(apiDomain, token, quoteId, attachment.id)
      const folderId = destinationFor(attachment.name, folders)
      await uploadWorkDriveFile(token, folderId, attachment.name, blob)
      uploaded.push({ name: attachment.name, folder: folderId })
    }

    const items = (quote.Quoted_Items ?? []).map((item: any) => ({ description: item.Details ?? item.Description ?? item.Product_Name?.name ?? "", quantity: Number(item.Quantity) || 1 }))
    const report = await buildWordReport({ dealName: deal.Deal_Name ?? "", quoteSubject: quote.Subject ?? "", stage: quote.Quote_Stage ?? "", account: deal.Account_Name?.name ?? "", contact: deal.Contact_Name?.name ?? "", room: deal.Room ?? "", items, notes, attachments, trigger })
    const reportName = `${safe(quote.Subject || quoteId)} - Report.docx`
    await uploadWorkDriveFile(token, folders.report.id, reportName, report)

    const workdriveUrl = `https://workdrive.zoho.eu/home/folders/${folders.project.id}`
    const telegram = await sendTelegramCompletion({ dealName: deal.Deal_Name ?? "", quoteSubject: quote.Subject ?? "", dossierConfidence: "report-created", workdriveUrl })
    return json({ completed: true, source, trigger, quoteId, dealId, workdrive: { projectFolderId: folders.project.id, url: workdriveUrl, uploaded, reportName }, telegram })
  } catch (error) {
    console.error("zoho-project-draft", error)
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500)
  }
})
