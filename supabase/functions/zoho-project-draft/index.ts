import { createClient } from "npm:@supabase/supabase-js@2"
import { buildTechnicalDossier } from "../_shared/technical-dossier.ts"
import { sendTelegramCompletion } from "../_shared/telegram.ts"

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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return json({ error: "Not authenticated" }, 401)
    const body = await request.json(), dealId = String(body.deal_id ?? "")
    if (!/^\d{10,25}$/.test(dealId)) return json({ error: "Invalid Zoho deal ID" }, 400)
    if (body.write_to_workdrive === true) return json({ error: "WorkDrive writing is disabled until OAuth is configured and approved" }, 409)
    const { token, apiDomain } = await accessToken()
    const deal = (await zohoGet(apiDomain, token, `/Deals/${dealId}`)).data?.[0]
    if (!deal) return json({ error: "Deal not found" }, 404)
    const [quotes, notes, attachments] = await Promise.all([
      zohoGet(apiDomain, token, `/Deals/${dealId}/Quotes?fields=id,Subject,Quote_Stage,Grand_Total,Grand_Total_Cost,Modified_Time&per_page=200`),
      zohoGet(apiDomain, token, `/Deals/${dealId}/Notes?fields=id,Note_Title,Note_Content,Created_Time,Modified_Time&per_page=200`),
      zohoGet(apiDomain, token, `/Deals/${dealId}/Attachments?fields=id,File_Name,Size,Created_Time,Modified_Time&per_page=200`),
    ])
    const quoteSummary = quotes.data?.[0] ?? null
    const quote = quoteSummary?.id ? (await zohoGet(apiDomain, token, `/Quotes/${quoteSummary.id}`)).data?.[0] ?? quoteSummary : null
    const dossier = buildTechnicalDossier(deal, quote, notes.data ?? [], attachments.data ?? [])
    let telegram: Record<string, unknown>
    try {
      telegram = await sendTelegramCompletion({
        dealName: dossier.source.dealName,
        quoteSubject: dossier.source.quoteSubject,
        dossierConfidence: dossier.confidence,
        workdriveUrl: deal.zohoworkdriveforcrm__Workdrive_Folder_URL ?? null,
      })
    } catch (error) {
      telegram = { sent: false, reason: error instanceof Error ? error.message : "notification_failed" }
    }
    return json({
      dossier,
      workdrive: { enabled: false, parentFolderId: Deno.env.get("ZOHO_WORKDRIVE_PARENT_FOLDER_ID") ?? null, plannedFolderName: `${deal.Auto_Number_1 ?? dealId} - ${deal.Account_Name?.name ?? "Client"} - ${deal.Progetto ?? "Project"}` },
      telegram,
    })
  } catch (error) {
    console.error("zoho-project-draft", error)
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500)
  }
})
