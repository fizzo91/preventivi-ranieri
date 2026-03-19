import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import trainingData from "./training-data.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Build training examples string once at startup
const trainingExamples = (trainingData as any[])
  .filter((d: any) => d.description && d.description.trim().length > 10)
  .map((d: any) => `[${d.section_name}] ${d.description}`)
  .join("\n")
  .slice(0, 12000); // keep within token limits

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sectionName, existingDescriptions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Sei un assistente esperto nella redazione di preventivi per lavorazione di pietra naturale, pietra lavica smaltata, marmo, granito e materiali lapidei.
Il tuo compito è generare una descrizione professionale per una sezione di un preventivo.

Regole:
- Scrivi in italiano tecnico ma comprensibile
- La descrizione deve essere dettagliata e specifica per il tipo di lavorazione
- Includi dettagli su materiali, finiture, spessori e lavorazioni quando pertinenti
- Usa un tono professionale e formale, tipico dei capitolati d'appalto
- La descrizione deve essere di 2-4 frasi
- Mantieni lo stesso stile e formato delle descrizioni di esempio fornite sotto

Ecco un archivio di descrizioni reali da usare come riferimento stilistico e di formato:
${trainingExamples}`;

    let userPrompt = `Genera una descrizione professionale per la sezione "${sectionName}" di un preventivo.`;
    if (existingDescriptions) {
      userPrompt += `\n\nDescrizioni delle altre sezioni di questo preventivo (mantieni coerenza):\n${existingDescriptions}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppi tentativi, riprova tra poco." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Errore nel servizio AI");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-description error:", e);
    return new Response(JSON.stringify({ error: e.message || "Errore sconosciuto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
