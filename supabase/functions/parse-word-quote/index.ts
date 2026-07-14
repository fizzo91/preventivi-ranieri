import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductLite {
  id: string;
  name: string;
  category?: string;
  price?: number;
  unit?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const text: string = typeof body?.text === "string" ? body.text : "";
    const products: ProductLite[] = Array.isArray(body?.products) ? body.products : [];

    if (text.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Testo troppo corto." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 80000) {
      return new Response(JSON.stringify({ error: "Documento troppo grande (max 80k caratteri)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Prepare a compact catalog string (limit size)
    const catalog = products.slice(0, 500).map(p =>
      `${p.id}|${p.name}|${p.category ?? ""}|${p.unit ?? ""}|${p.price ?? ""}`
    ).join("\n");

    const systemPrompt = `Sei un estrattore di preventivi in pietra lavica. Ricevi il testo grezzo di un documento Word e devi produrre una struttura preventivo in JSON.

REGOLE:
1. Suddividi il documento in SEZIONI per capitolo/titolo (righe in maiuscolo, titoli numerati "1.", "1)", "A.", righe brevi che introducono un blocco).
2. Ogni riga con una voce (bullet, trattino, descrizione con quantità o metri quadri) è un ITEM della sezione corrente.
3. Estrai per ogni item: description (testo pulito), quantity (numero, default 1), mq (numero o null se non presente).
4. Se un item è chiaramente un match con un prodotto del catalogo (per nome/descrizione), imposta matchedProductId con l'id esatto del prodotto e confidence 0-1. Se confidence < 0.6, lascia matchedProductId=null.
5. Il nome della sezione deve essere breve (max 60 char).
6. Se non riconosci sezioni, crea una sola sezione "Voci importate".

CATALOGO PRODOTTI (id|nome|categoria|unità|prezzo):
${catalog || "(nessun prodotto disponibile)"}

OUTPUT: JSON valido con questa forma esatta:
{
  "sections": [
    {
      "name": "string",
      "description": "string",
      "items": [
        { "description": "string", "quantity": 1, "mq": null, "matchedProductId": "uuid o null", "confidence": 0.8 }
      ]
    }
  ]
}
NIENTE testo fuori dal JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Testo del documento Word:\n\n${text}` },
        ],
        response_format: { type: "json_object" },
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppi tentativi, riprova tra poco." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Errore nel servizio AI");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: any = { sections: [] };
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse fail", raw);
      throw new Error("Risposta AI non valida");
    }

    const sections = Array.isArray(parsed?.sections) ? parsed.sections : [];
    // Validate & sanitize
    const productIds = new Set(products.map(p => p.id));
    const sanitized = sections.map((s: any, si: number) => ({
      name: String(s?.name || `Sezione ${si + 1}`).slice(0, 80),
      description: String(s?.description || "").slice(0, 500),
      items: (Array.isArray(s?.items) ? s.items : []).map((it: any) => {
        const matchedProductId = it?.matchedProductId && productIds.has(it.matchedProductId)
          ? it.matchedProductId : null;
        return {
          description: String(it?.description || "").slice(0, 500),
          quantity: Number(it?.quantity) > 0 ? Number(it.quantity) : 1,
          mq: it?.mq != null && !isNaN(Number(it.mq)) ? Number(it.mq) : null,
          matchedProductId,
          confidence: typeof it?.confidence === "number" ? it.confidence : 0,
        };
      }).filter((it: any) => it.description.length > 0),
    })).filter((s: any) => s.items.length > 0);

    return new Response(JSON.stringify({ sections: sanitized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-word-quote error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Errore sconosciuto" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
