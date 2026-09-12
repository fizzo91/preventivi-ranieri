import { defineTool } from "@lovable.dev/mcp-js"
import { z } from "zod"

export default defineTool({
  name: "import_zoho_project_draft",
  title: "Importa progetto Zoho in bozza",
  description: "Legge Deal, quotation e note da Zoho, scarica anche gli allegati incorporati nelle note in uno storage privato e genera un dossier con URL temporanei per l'agente tecnico. Se quote_id è presente importa quella quotation esatta. Non modifica Zoho o WorkDrive.",
  inputSchema: {
    deal_id: z.string().regex(/^\d{10,25}$/).describe("ID numerico del Deal Zoho"),
    quote_id: z.string().regex(/^\d{10,25}$/).optional().describe("ID numerico della Quotation Zoho da importare"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ deal_id, quote_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Non autenticato" }], isError: true }
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/zoho-project-draft`, { method: "POST", headers: { Authorization: `Bearer ${ctx.getToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ deal_id, quote_id, write_to_workdrive: false }) })
    const payload = await response.json()
    if (!response.ok) return { content: [{ type: "text" as const, text: payload.error ?? "Import failed" }], isError: true }
    return { content: [{ type: "text" as const, text: JSON.stringify(payload) }], structuredContent: payload }
  },
})
