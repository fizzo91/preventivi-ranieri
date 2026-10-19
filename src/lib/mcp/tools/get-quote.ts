import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_quote",
  title: "Dettaglio preventivo",
  description: "Restituisce il preventivo completo (sezioni, voci, totali, note) per l'id indicato.",
  inputSchema: { id: z.string().uuid().describe("UUID del preventivo.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Non autenticato" }], isError: true };
    const { data, error } = await sb(ctx).from("quotes").select("*").eq("id", id).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Preventivo non trovato" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { quote: data },
    };
  },
});
