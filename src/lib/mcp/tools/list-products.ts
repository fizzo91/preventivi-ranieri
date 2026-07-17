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
  name: "list_products",
  title: "Elenca prodotti",
  description: "Elenca i prodotti a listino (DT) dell'utente. Ricerca opzionale su nome/codice/categoria.",
  inputSchema: {
    search: z.string().optional().describe("Ricerca parziale case-insensitive su nome, codice o categoria."),
    include_archived: z.boolean().optional().describe("Includere prodotti archiviati (default false)."),
    limit: z.number().int().min(1).max(500).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, include_archived, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    let q = sb(ctx)
      .from("products")
      .select("id, name, code, category, unit, price_dt, archived")
      .order("name")
      .limit(limit ?? 100);
    if (!include_archived) q = q.eq("archived", false);
    if (search) q = q.or(`name.ilike.%${search}%,code.ilike.%${search}%,category.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
