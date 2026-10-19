import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
class ToolError extends Error {}

const uid = () => crypto.randomUUID();
const r2 = (n: number) => Math.round(n * 100) / 100;

const itemSchema = z.object({
  product_id: z.string().uuid().describe("UUID del prodotto ottenuto da list_products. Il prezzo DT viene letto dal listino."),
  quantity: z.number().nonnegative(),
  description: z.string().optional().describe("Nota opzionale sulla voce."),
  risk_percent: z.number().min(0).max(100).optional().describe("Rischio % applicato a questa singola voce."),
});

const sectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().describe("Descrizione tecnica della sezione."),
  quantity: z.number().positive().optional().describe("Moltiplicatore sezione (default 1)."),
  mq_totali: z.number().nonnegative().optional(),
  items: z.array(itemSchema).min(1),
  section_risk_percent: z.number().min(0).max(100).optional().describe("Rischio % sul totale voci della sezione."),
  engobbio_base: z.number().nonnegative().optional().describe("Costo engobbio € (base)."),
  engobbio_risk_percent: z.number().min(0).max(100).optional(),
  finitura: z.number().nonnegative().optional().describe("Costo finitura/smaltatura €."),
  tags: z.array(z.string()).optional(),
});

export default defineTool({
  name: "create_quote",
  title: "Crea preventivo",
  description:
    "Crea e salva un nuovo preventivo con sezioni e voci. Usa prima list_products per trovare i product_id; i prezzi sono presi dal listino DT.",
  inputSchema: {
    client_name: z.string().min(1),
    client_company: z.string().optional(),
    client_email: z.string().optional(),
    client_phone: z.string().optional(),
    notes: z.string().optional(),
    sections: z.array(sectionSchema).min(1),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (args, ctx) => {
   try {
    if (!ctx.isAuthenticated()) throw new ToolError("Non autenticato");
    const client = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Utente non identificato");

    const ids = [...new Set(args.sections.flatMap((s) => s.items.map((i) => i.product_id)))];
    const { data: products, error: pErr } = await client
      .from("products")
      .select("id, name, category, unit, price_dt")
      .in("id", ids);
    if (pErr) throw new ToolError(pErr.message);
    const pMap = new Map((products ?? []).map((p) => [p.id, p]));
    const missing = ids.filter((id) => !pMap.has(id));
    if (missing.length) throw new ToolError(`Prodotti non trovati: ${missing.join(", ")}`);

    const sections = args.sections.map((s) => {
      const items = s.items.map((i) => {
        const p = pMap.get(i.product_id)!;
        const price = Number(p.price_dt) || 0;
        return {
          id: uid(), productId: p.id, productName: p.name, category: p.category,
          description: i.description ?? "", quantity: i.quantity, price, unit: p.unit,
          total: r2(price * i.quantity), _risk: i.risk_percent,
        };
      });
      const itemsTotal = items.reduce((a, i) => a + i.total, 0);
      const risks: { id: string; description: string; percentage: number; appliedToItemId: string; amount: number }[] = [];
      for (const it of items) {
        if (it._risk) risks.push({ id: uid(), description: `Rischio ${it.productName}`, percentage: it._risk, appliedToItemId: it.id, amount: r2(it.total * it._risk / 100) });
      }
      if (s.section_risk_percent) {
        risks.push({ id: uid(), description: "Rischio sezione", percentage: s.section_risk_percent, appliedToItemId: "SECTION_TOTAL", amount: r2(itemsTotal * s.section_risk_percent / 100) });
      }
      const eb = s.engobbio_base ?? 0;
      const engobbio = r2(eb + eb * (s.engobbio_risk_percent ?? 0) / 100);
      const finitura = s.finitura ?? 0;
      const total = r2(itemsTotal + risks.reduce((a, r) => a + r.amount, 0) + engobbio + finitura);
      return {
        id: uid(), name: s.name, description: s.description ?? "",
        items: items.map(({ _risk, ...rest }) => rest), risks,
        engobbio, engobbioBase: eb, engobbioRiskPct: s.engobbio_risk_percent ?? 0, finitura, total,
        mqTotali: s.mq_totali, euroPerMq: s.mq_totali ? r2(total / s.mq_totali) : undefined,
        tags: s.tags ?? [], quantity: s.quantity ?? 1,
      };
    });
    const totalAmount = r2(sections.reduce((a, s) => a + s.total * s.quantity, 0));

    const { data, error } = await client
      .from("quotes")
      .insert({
        user_id: userId,
        quote_number: `PREV-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        client_name: args.client_name,
        client_company: args.client_company ?? null,
        client_email: args.client_email ?? null,
        client_phone: args.client_phone ?? null,
        notes: args.notes ?? null,
        sections: JSON.parse(JSON.stringify(sections)),
        total_amount: totalAmount,
      })
      .select("id, quote_number, total_amount")
      .single();
    if (error) throw new ToolError(error.message);

    const url = `https://preventivi-ranieri.lovable.app/new-quote?edit=${data.id}`;
    return {
      content: [{ type: "text", text: `Preventivo ${data.quote_number} creato. Totale €${data.total_amount}. Apri: ${url}` }],
      structuredContent: { id: data.id, quote_number: data.quote_number, total_amount: Number(data.total_amount), url },
    };
   } catch (e) {
    return { content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }], isError: true };
   }
  },
});
