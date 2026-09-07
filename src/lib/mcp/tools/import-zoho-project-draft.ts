import { defineTool } from "@lovable.dev/mcp-js"
import { z } from "zod"

export default defineTool({
  name: "import_zoho_project_draft",
  title: "Importa progetto Zoho in bozza",
  description: "Legge una quotation Zoho, crea le cartelle WorkDrive, copia gli allegati e genera un report Word. Non modifica costi o stato Zoho.",
  inputSchema: { quote_id: z.string().regex(/^\d{10,25}$/).describe("ID numerico della Quotation Zoho") },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
  handler: async ({ quote_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Non autenticato" }], isError: true }
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/zoho-project-draft`, { method: "POST", headers: { Authorization: `Bearer ${ctx.getToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ quote_id, trigger: "quotation_stage" }) })
    const payload = await response.json()
    if (!response.ok) return { content: [{ type: "text" as const, text: payload.error ?? "Import failed" }], isError: true }
    return { content: [{ type: "text" as const, text: JSON.stringify(payload) }], structuredContent: payload }
  },
})
