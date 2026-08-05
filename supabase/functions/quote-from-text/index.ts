import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ProductLite {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  unit: string | null;
  price_dt: number | null;
}

/** Riduce il catalogo alle voci più pertinenti rispetto al testo, per contenere i token. */
function preFilter(products: ProductLite[], text: string, max = 250): ProductLite[] {
  if (products.length <= max) return products;
  const words = new Set(
    text
      .toLowerCase()
      .replace(/[^a-zà-ù0-9\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4),
  );
  const scored = products.map((p) => {
    const hay = `${p.name} ${p.code ?? ""} ${p.category ?? ""}`.toLowerCase();
    let score = 0;
    for (const w of words) if (hay.includes(w)) score++;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((s) => s.p);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "Chiave API Anthropic non configurata." }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Non autenticato." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessione non valida." }, 401);

    const body = await req.json().catch(() => ({}));
    const text: string = typeof body?.text === "string" ? body.text.trim() : "";
    if (text.length < 20) return json({ error: "Testo troppo corto (minimo 20 caratteri)." }, 400);
    if (text.length > 40000) return json({ error: "Testo troppo lungo (max 40.000 caratteri)." }, 400);

    // Prodotti dell'utente (RLS applicata tramite il token dell'utente)
    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .select("id, name, code, category, unit, price_dt")
      .eq("archived", false)
      .order("name");
    if (prodErr) return json({ error: prodErr.message }, 400);

    const products = (prodData ?? []) as ProductLite[];
    if (products.length === 0) return json({ error: "Nessun prodotto a listino disponibile." }, 400);

    const shortlist = preFilter(products, text);
    const catalog = shortlist
      .map((p) => `${p.id}|${p.name}|${p.code ?? ""}|${p.category ?? ""}|${p.unit ?? ""}|${p.price_dt ?? ""}`)
      .join("\n");

    const systemPrompt = `Sei un preventivista esperto di pietra lavica (Ranieri Lava Stone). Ricevi una descrizione testuale di un lavoro e produci la struttura di un preventivo in JSON.

REGOLE:
1. Suddividi il lavoro in SEZIONI logiche (ambienti, elementi, lotti). Nome sezione breve (max 60 caratteri).
2. Ogni lavorazione/fornitura è un ITEM della sezione.
3. Per ogni item estrai: description (testo tecnico pulito e sintetico), quantity (numero, default 1), mq (numero o null).
4. Abbina SEMPRE ogni item al prodotto PIÙ SIMILE del catalogo: matchedProductId deve essere un id esatto della lista. Indica confidence tra 0 e 1 in base a quanto l'abbinamento è certo (usa valori bassi, es. 0.3, quando è solo il più vicino disponibile).
5. Non inventare id: usa solo quelli presenti nel catalogo.
6. Non aggiungere voci non deducibili dal testo.

CATALOGO PRODOTTI (id|nome|codice|categoria|unità|prezzo DT):
${catalog}

OUTPUT: solo JSON valido con questa forma esatta:
{"sections":[{"name":"string","description":"string","items":[{"description":"string","quantity":1,"mq":null,"matchedProductId":"id dal catalogo","confidence":0.8}]}]}
Nessun testo fuori dal JSON.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Descrizione del lavoro da preventivare:\n\n${text}`,
          },
          { role: "assistant", content: "{" },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error("Anthropic error", aiRes.status, detail);
      if (aiRes.status === 401) return json({ error: "Chiave API Anthropic non valida." }, 401);
      if (aiRes.status === 429) return json({ error: "Troppe richieste ad Anthropic, riprova tra poco." }, 429);
      if (aiRes.status === 400 && detail.includes("credit")) {
        return json({ error: "Credito Anthropic esaurito." }, 402);
      }
      return json({ error: "Errore del servizio AI." }, 502);
    }

    const aiData = await aiRes.json();
    const rawText: string = (aiData?.content ?? [])
      .filter((c: any) => c?.type === "text")
      .map((c: any) => c.text)
      .join("");
    const cleaned = ("{" + rawText)
      .replace(/^\{\s*```(?:json)?/i, "{")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse fail", rawText.slice(0, 2000));
      return json({ error: "Risposta AI non interpretabile, riprova." }, 502);
    }

    const byId = new Map(products.map((p) => [p.id, p]));
    const sections = (Array.isArray(parsed?.sections) ? parsed.sections : [])
      .map((s: any, si: number) => ({
        name: String(s?.name || `Sezione ${si + 1}`).slice(0, 80),
        description: String(s?.description || "").slice(0, 800),
        items: (Array.isArray(s?.items) ? s.items : [])
          .map((it: any) => ({
            description: String(it?.description || "").slice(0, 800),
            quantity: Number(it?.quantity) > 0 ? Number(it.quantity) : 1,
            mq: it?.mq != null && !isNaN(Number(it.mq)) ? Number(it.mq) : null,
            matchedProductId: byId.has(it?.matchedProductId) ? it.matchedProductId : null,
            confidence: typeof it?.confidence === "number" ? Math.max(0, Math.min(1, it.confidence)) : 0,
          }))
          .filter((it: any) => it.description.length > 0),
      }))
      .filter((s: any) => s.items.length > 0);

    if (sections.length === 0) return json({ error: "Nessuna voce riconosciuta nel testo." }, 422);

    return json({ sections });
  } catch (e) {
    console.error("quote-from-text error:", e);
    return json({ error: (e as Error).message || "Errore sconosciuto" }, 500);
  }
});
