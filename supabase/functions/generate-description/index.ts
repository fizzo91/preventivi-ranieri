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

    const systemPrompt = `You are an expert assistant in drafting quotes for natural stone, enamelled lava stone, marble, granite and stone materials processing.
Your task is to generate a professional description for a section of a quote.

Rules:
- Always write in English, professional and technical but understandable
- The description must be detailed and specific for the type of processing
- Include details about materials, finishes, thicknesses and processing when relevant
- Use a professional and formal tone, typical of specifications and tender documents
- The description should be 2-4 sentences
- Maintain the same style and format as the example descriptions provided below

Here is an archive of real descriptions to use as stylistic and format reference:
${trainingExamples}`;

    let userPrompt = `Generate a professional description for the section "${sectionName}" of a quote.`;
    if (existingDescriptions) {
      userPrompt += `\n\nDescriptions of other sections in this quote (maintain consistency):\n${existingDescriptions}`;
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
