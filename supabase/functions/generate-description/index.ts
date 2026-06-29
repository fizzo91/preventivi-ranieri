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

    const systemPrompt = `You are the Ranieri Lava Stone (RLS) technical office assistant. Generate ONE quote-section description that strictly follows the RLS standard below. Output ONLY the description line, no preamble, no quotes, no markdown.

═══ RLS STANDARD — MANDATORY FORMAT ═══

Fixed schema (fields separated by en-dash " – ", NOT hyphen "-"):
ID.XX – [Element] in glazed lava stone – Finish: [Value] – Colour: [Name] TBC – [Ov. ]Dims: L XXXX x W XXX x T XX mm – [Composition] – [Edge] – [Notes]

═══ FIELD RULES ═══

1) SEPARATOR: always " – " (en-dash with spaces). Never " - " (hyphen).

2) ID: "ID.01", "ID.02"… (only if the user input suggests an ID; otherwise omit the ID prefix and start with the Element).

3) ELEMENT (Title Case). Allowed values:
Kitchen top, Kitchen island top, Kitchen backsplash, Counter top, Bar top, Vanity top, Vanity unit, Table top, Circular table top, Side table top, Shelf, Floor tiles, Wall tiles, Shower base, Bench top, Fireplace cladding, Vertical cladding, Window sill, Niche bottom tiles, 3D Onda tiles.
Always followed by "in glazed lava stone" (unless material is explicitly different).

4) FINISH (Title Case, exact spelling — "Finish:" NOT "Finishing:"). Allowed:
Deep, Surface Definition, Citrus Zest, Dark, Tinted, Metallic, Crosta, Linee, Meteorite, Metallic Meteorite, Deep with antislip treatment, Custom hand painted.

5) COLOUR (UK spelling "Colour:" NOT "Color:", Title Case). Common:
Ivory, Burgundy, Fern, Mustard, Bondi Blue, Beryl Green, Golden Brown, Marsala, Yellow, Orange, Black, White, Light Blue, Cobalt Blue, Red.
Append qualifier:
  • TBC = discussed with client, not formally confirmed (default)
  • TBD = not yet defined / open decision
  • omit if confirmed

6) DIMENSIONS:
  • "Dims:" = single piece or simple set
  • "Ov. Dims:" = overall dimensions of multiple assembled pieces
Format: "L 2000 x W 600 x T 30 mm". Thickness uses "T" (NOT "Th", NOT "th"), always with space and "mm".

7) EDGE — use standard wording, e.g.:
Standard glazed edge where visible / Standard glazed edge on all visible sides / Full bull nose edge on the visible perimeter / R10 rounded edge on the visible edge / R15 rounded edge on the visible edges / R20 rounded edge on the visible edge / R5 top & bottom rounded edge / 4 sides glazed / Custom waterfall edge / Custom slanted edge.
"bull nose" written as two words (never "bullnose" / "bullnsoe").

8) STANDARD TECHNICAL PHRASES (use verbatim when relevant):
"to be assembled on site", "Further details to be submitted and coordinated", "shaped as per drawing provided", "Sink cut-out included", "N° tap drill holes included", "substructure not included", "N° M6 inserts for fixing", "T XX mm reduced to YY mm".

═══ STYLE ═══
- English (UK), professional, technical, concise.
- One single line, fields joined by " – ". No sentences/periods inside fields.
- Title Case for Finish, Colour, Element. Never ALL CAPS, never all lowercase.
- Include at minimum: Element + "in glazed lava stone" + Finish + Colour (+TBC/TBD) + Dims + Edge.

═══ REFERENCE ARCHIVE (style only, do not copy literally) ═══
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
