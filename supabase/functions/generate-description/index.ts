import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import trainingData from "./training-data.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const trainingExamples = (trainingData as any[])
  .filter((d: any) => d.description && d.description.trim().length > 10)
  .map((d: any) => `[${d.section_name}] ${d.description}`)
  .join("\n")
  .slice(0, 12000);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sectionName, existingDescriptions, imageDataUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const hasImage = typeof imageDataUrl === "string" && imageDataUrl.startsWith("data:image/");

    const systemPrompt = `You are the Ranieri Lava Stone (RLS) technical office assistant. Generate quote-section descriptions that strictly follow the RLS standard below.

═══ OUTPUT FORMAT (STRICT) ═══
Return ONLY valid JSON with this exact shape:
{ "descriptions": ["<one RLS line>", "<another RLS line>", ...] }
No preamble, no markdown, no code fences. Each array item is ONE complete RLS description line.

═══ RLS STANDARD — MANDATORY FORMAT ═══

Fixed schema (fields separated by en-dash " – ", NOT hyphen "-"):
ID.XX – [Element] in glazed lava stone – Finish: [Value] – Colour: [Name] TBC – [Ov. ]Dims: L XXXX x W XXX x T XX mm – [Composition] – [Edge] – [Notes]

═══ FIELD RULES ═══

1) SEPARATOR: always " – " (en-dash with spaces). Never " - " (hyphen).

2) ID: "ID.01", "ID.02"… When generating multiple items from an image, number them sequentially starting from ID.01. For single text-only prompts, omit the ID unless clearly requested.

3) ELEMENT (Title Case). Allowed values:
Kitchen top, Kitchen island top, Kitchen backsplash, Counter top, Bar top, Vanity top, Vanity unit, Table top, Circular table top, Side table top, Shelf, Floor tiles, Wall tiles, Shower base, Bench top, Fireplace cladding, Vertical cladding, Window sill, Niche bottom tiles, 3D Onda tiles.
Always followed by "in glazed lava stone" (unless material is explicitly different).

4) FINISH (Title Case, exact spelling — "Finish:" NOT "Finishing:"). Allowed:
Deep, Surface Definition, Citrus Zest, Dark, Tinted, Metallic, Crosta, Linee, Meteorite, Metallic Meteorite, Deep with antislip treatment, Custom hand painted.

5) COLOUR (UK spelling "Colour:", Title Case). Common:
Ivory, Burgundy, Fern, Mustard, Bondi Blue, Beryl Green, Golden Brown, Marsala, Yellow, Orange, Black, White, Light Blue, Cobalt Blue, Red.
Append qualifier: TBC (default) / TBD (open) / omit if confirmed.

6) DIMENSIONS: "Dims:" single/simple, "Ov. Dims:" multi-piece assembly.
Format: "L 2000 x W 600 x T 30 mm". Use "T" for thickness. If unknown, use placeholders "L XXXX x W XXX x T XX mm".

7) EDGE — standard wording:
Standard glazed edge where visible / Standard glazed edge on all visible sides / Full bull nose edge on the visible perimeter / R10 rounded edge on the visible edge / R15 rounded edge on the visible edges / R20 rounded edge on the visible edge / R5 top & bottom rounded edge / 4 sides glazed / Custom waterfall edge / Custom slanted edge.
"bull nose" as two words.

8) STANDARD PHRASES (verbatim when relevant):
"to be assembled on site", "Further details to be submitted and coordinated", "shaped as per drawing provided", "Sink cut-out included", "N° tap drill holes included", "substructure not included", "N° M6 inserts for fixing", "T XX mm reduced to YY mm".

═══ STYLE ═══
- English (UK), professional, technical, concise. One line per description.
- Title Case for Finish, Colour, Element.
- Include at minimum: Element + "in glazed lava stone" + Finish + Colour (+TBC/TBD) + Dims + Edge.

${hasImage ? `═══ VISION MODE ═══
An image is provided (render, technical drawing, moodboard, or photo).
1) Identify EVERY distinct lava-stone element visible (kitchen top, island, backsplash, vanity, table top, cladding, floor/wall tiles, shower base, fireplace, shelf, etc.).
2) For EACH element produce ONE RLS-compliant description line.
3) Number them ID.01, ID.02, ID.03 …
4) Infer Element, Finish, Colour, and Edge from visual cues. When unclear, use safe defaults (Finish: Deep, Colour: <best guess> TBC, Edge: Standard glazed edge where visible).
5) For dimensions not visible, use placeholders "L XXXX x W XXX x T XX mm".
6) If the image shows only ONE element, return an array with a single description.
` : `═══ SINGLE MODE ═══
Return an array with exactly ONE description built from the user's text hint.
`}

═══ REFERENCE ARCHIVE (style only, do not copy literally) ═══
${trainingExamples}`;

    const userText = hasImage
      ? `Analyze the image and generate one RLS description for each lava-stone element visible.${
          sectionName ? `\n\nAdditional hint from user: ${sectionName}` : ""
        }${
          existingDescriptions
            ? `\n\nDescriptions from the user's other quotes (maintain consistency):\n${existingDescriptions}`
            : ""
        }`
      : `Generate a professional RLS description for: "${sectionName}".${
          existingDescriptions
            ? `\n\nDescriptions from the user's other quotes (maintain consistency):\n${existingDescriptions}`
            : ""
        }`;

    const userContent: any[] = [{ type: "text", text: userText }];
    if (hasImage) {
      userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
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
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
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
    const raw = data.choices?.[0]?.message?.content?.trim() || "";

    let descriptions: string[] = [];
    try {
      // Strip possible code fences
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed?.descriptions)) {
        descriptions = parsed.descriptions
          .filter((s: unknown) => typeof s === "string" && s.trim())
          .map((s: string) => s.trim());
      } else if (typeof parsed === "string") {
        descriptions = [parsed.trim()];
      }
    } catch {
      // Fallback: treat as single plain-text description
      if (raw) descriptions = [raw];
    }

    return new Response(
      JSON.stringify({ descriptions, description: descriptions[0] || "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-description error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Errore sconosciuto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
