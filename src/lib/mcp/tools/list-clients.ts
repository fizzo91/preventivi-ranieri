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
  name: "list_clients",
  title: "Elenca clienti",
  description: "Elenca i clienti dell'utente autenticato. Ricerca opzionale su nome/azienda/email.",
  inputSchema: {
    search: z.string().optional().describe("Ricerca parziale case-insensitive su nome, azienda o email."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    let q = sb(ctx)
      .from("clients")
      .select("id, name, company, email, phone, vat_number, created_at")
      .order("name")
      .limit(limit ?? 50);
    if (search) q = q.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { clients: data ?? [] },
    };
  },
});
