import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Query troppo corta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Sei un assistente che ricerca informazioni su aziende e professionisti nel settore della pietra naturale, marmo, design e architettura.
Dato il nome di un'azienda o persona, restituisci le informazioni che conosci in formato strutturato.
Se non conosci un dato, restituisci null per quel campo.
Rispondi SOLO con il JSON, nessun testo aggiuntivo.`;

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
          {
            role: "user",
            content: `Cerca informazioni su: "${query.trim()}". Restituisci un JSON con questa struttura esatta:
{
  "name": "nome completo azienda/persona",
  "geographic_area": "città/regione/paese",
  "website": "url sito web",
  "interest_area": "area di interesse (es. design, architettura, interior design, edilizia, lusso)",
  "instagram_id": "username instagram senza @",
  "instagram_followers": "numero approssimativo di follower (es. '12.5K', '1.2M') oppure null"
}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_client_info",
              description: "Return structured client research info",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Full company/person name" },
                  geographic_area: { type: "string", nullable: true },
                  website: { type: "string", nullable: true },
                  interest_area: { type: "string", nullable: true },
                  instagram_id: { type: "string", nullable: true },
                  instagram_followers: { type: "string", nullable: true },
                },
                required: ["name"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_client_info" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppe richieste, riprova tra poco." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti esauriti. Aggiungi fondi in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Errore nella ricerca AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result;

    if (toolCall?.function?.arguments) {
      result = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content as JSON
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!result) {
      return new Response(JSON.stringify({ error: "Nessuna informazione trovata" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("client-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
