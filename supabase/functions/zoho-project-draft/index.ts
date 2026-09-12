import { createClient } from "npm:@supabase/supabase-js@2"
import { buildTechnicalDossier } from "../_shared/technical-dossier.ts"
import { sendTelegramCompletion } from "../_shared/telegram.ts"
import { attachmentRefs, dedupeAttachmentRefs, stageZohoAttachment } from "../_shared/zoho-attachments.ts"
import { ensureProjectWorkDrive } from "../_shared/workdrive.ts"

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info" }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

async function accessToken() {
  const clientId = Deno.env.get("ZOHO_CLIENT_ID"), clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET"), refreshToken = Deno.env.get("ZOHO_REFRESH_TOKEN")
  const accountsUrl = Deno.env.get("ZOHO_ACCOUNTS_URL") ?? "https://accounts.zoho.eu"
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Zoho OAuth is not configured")
  const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" })
  const response = await fetch(`${accountsUrl}/oauth/v2/token`, { method: "POST", body: params })
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors })
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405)
  try {
    const authorization = request.headers.get("Authorization") ?? ""
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return json({ error: "Not authenticated" }, 401)
    const body = await request.json(), dealId = String(body.deal_id ?? "")
    const requestedQuoteId = body.quote_id == null ? null : String(body.quote_id)
    if (!/^\d{10,25}$/.test(dealId)) return json({ error: "Invalid Zoho deal ID" }, 400)
    if (requestedQuoteId && !/^\d{10,25}$/.test(requestedQuoteId)) return json({ error: "Invalid Zoho quote ID" }, 400)
    const { token, apiDomain } = await accessToken()
    const deal = (await zohoGet(apiDomain, token, `/Deals/${dealId}`)).data?.[0]
    if (!deal) return json({ error: "Deal not found" }, 404)
    const [quotes, dealNotes, dealAttachments] = await Promise.all([
      zohoGet(apiDomain, token, `/Deals/${dealId}/Quotes?fields=id,Subject,Quote_Stage,Grand_Total,Grand_Total_Cost,Modified_Time&per_page=200&sort_by=Modified_Time&sort_order=desc`),
      zohoGet(apiDomain, token, `/Deals/${dealId}/Notes?fields=id,Note_Title,Note_Content,Created_Time,Modified_Time&per_page=200`),
      zohoGet(apiDomain, token, `/Deals/${dealId}/Attachments?fields=id,File_Name,Size,Created_Time,Modified_Time&per_page=200`),
    ])
    const quoteSummary = requestedQuoteId
      ? quotes.data?.find((item: Record<string, unknown>) => String(item.id) === requestedQuoteId) ?? { id: requestedQuoteId }
      : quotes.data?.find((item: Record<string, unknown>) => item.Quote_Stage === "Budget Quote Richiesta") ?? quotes.data?.[0] ?? null
    const quote = quoteSummary?.id ? (await zohoGet(apiDomain, token, `/Quotes/${quoteSummary.id}`)).data?.[0] ?? quoteSummary : null
    if (requestedQuoteId && quote?.Deal_Name?.id && String(quote.Deal_Name.id) !== dealId) {
      return json({ error: "Quotation does not belong to the supplied Deal" }, 409)
    }
    const [quoteNotes, quoteAttachments] = quote?.id ? await Promise.all([
      zohoGet(apiDomain, token, `/Quotes/${quote.id}/Notes?fields=id,Note_Title,Note_Content,Created_Time,Modified_Time&per_page=200`),
      zohoGet(apiDomain, token, `/Quotes/${quote.id}/Attachments?fields=id,File_Name,Size,Created_Time,Modified_Time&per_page=200`),
    ]) : [{ data: [] }, { data: [] }]
    const notes = [
      ...(dealNotes.data ?? []).map((note: Record<string, unknown>) => ({ ...note, _source: "deal" })),
      ...(quoteNotes.data ?? []).map((note: Record<string, unknown>) => ({ ...note, _source: "quote" })),
    ]
    const noteAttachmentLists = await Promise.all(notes.map(async (note: Record<string, unknown>) => ({
      note,
      payload: await zohoGet(apiDomain, token, `/Notes/${note.id}/Attachments?fields=id,File_Name,Size,Created_Time,Modified_Time&per_page=200`),
    })))
    const refs = dedupeAttachmentRefs([
      ...attachmentRefs(dealAttachments.data ?? [], "Deals", dealId, "deal"),
      ...attachmentRefs(quoteAttachments.data ?? [], "Quotes", String(quote?.id ?? ""), "quote"),
      ...noteAttachmentLists.flatMap(({ note, payload }) => attachmentRefs(
        payload.data ?? [],
        "Notes",
        String(note.id),
        `${note._source ?? "record"}_note`,
      )),
    ])
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const bucket = Deno.env.get("ZOHO_AGENT_FILES_BUCKET") ?? "zoho-agent-files"
    const stagedAttachments = []
    for (const ref of refs) {
      stagedAttachments.push(await stageZohoAttachment({
        apiDomain,
        token,
        ref,
        supabaseAdmin,
        bucket,
        userId: userData.user.id,
        dealId,
      }))
    }
    const dossier = buildTechnicalDossier(deal, quote, notes, stagedAttachments)
    const projectFolderName = `${deal.Auto_Number_1 ?? dealId} - ${deal.Account_Name?.name ?? "Client"} - ${deal.Progetto ?? "Project"}`
    const workdriveParentId = Deno.env.get("ZOHO_WORKDRIVE_PARENT_FOLDER_ID")
    let workdrive: Record<string, unknown>
    if (!workdriveParentId) {
      workdrive = { enabled: false, reason: "ZOHO_WORKDRIVE_PARENT_FOLDER_ID is not configured", plannedFolderName: projectFolderName }
    } else {
      try {
        const workdriveApiDomain = Deno.env.get("ZOHO_WORKDRIVE_API_DOMAIN") ?? apiDomain
        workdrive = { enabled: true, ...(await ensureProjectWorkDrive({ apiDomain: workdriveApiDomain, token, parentId: workdriveParentId, projectFolderName })) }
      } catch (error) {
        workdrive = { enabled: false, reason: error instanceof Error ? error.message : "WorkDrive folder creation failed", plannedFolderName: projectFolderName }
      }
    }
    let telegram: Record<string, unknown>
    try {
      telegram = await sendTelegramCompletion({
        dealName: dossier.source.dealName,
        quoteSubject: dossier.source.quoteSubject,
        dossierConfidence: dossier.confidence,
        workdriveUrl: (workdrive.project as { permalink?: string | null } | undefined)?.permalink ?? deal.zohoworkdriveforcrm__Workdrive_Folder_URL ?? null,
      })
    } catch (error) {
      telegram = { sent: false, reason: error instanceof Error ? error.message : "notification_failed" }
    }
    return json({
      dossier,
      attachmentHandoff: {
        bucket,
        discovered: refs.length,
        downloaded: stagedAttachments.filter((file) => file.downloaded).length,
        failed: stagedAttachments.filter((file) => !file.downloaded).length,
        noteLevelDiscovery: true,
      },
      workdrive,
      telegram,
    })
  } catch (error) {
    console.error("zoho-project-draft", error)
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500)
  }
})
