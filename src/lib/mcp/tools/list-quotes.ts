declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_quotes",
  title: "Elenca preventivi",
  description: "Elenca i preventivi dell'utente autenticato, dal più recente. Filtri opzionali per cliente e limite.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Numero massimo di risultati (default 20)."),
    client_name: z.string().optional().describe("Filtro parziale case-insensitive sul nome cliente."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, client_name }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    let q = sb(ctx)
      .from("quotes")
      .select("id, quote_number, client_name, date, status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (client_name) q = q.ilike("client_name", `%${client_name}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { quotes: data ?? [] },
    };
  },
});
