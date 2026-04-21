// Edge function: help-chat - assistente streaming via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Sei l'assistente virtuale di "Preventivi Pro", un'applicazione interna di Ranieri Lavastone per il calcolo dei costi e la gestione dei preventivi di lavorazioni in pietra.

CONOSCI L'APP - Sezioni principali:
- Dashboard: statistiche, grafici per spessore, tag, ranking
- Nuovo Preventivo: creazione preventivi con sezioni (qta, mq, voci di costo, complessità C 1-4, rischio R 1-4, tag, immagine)
- Preventivi: elenco raggruppato per mese, modifica, export PDF (Completo o Sintetico)
- Galleria: immagini delle sezioni dei preventivi passati
- Descrizioni: archivio descrizioni tecniche delle lavorazioni
- Prodotti: catalogo voci di costo (listino DT - usato per tutti i calcoli)
- Strumenti: Calcolatrice scientifica, Calcolo Cerchio, Convertitore imperiale, Calcolo Pietra, Calcolo Vanity, Costo Smalto, Glossario, Ricerca Cliente AI, Assistente Descrizioni AI
- Segnala bug: form per segnalare problemi (visibili nel pannello admin)
- Impostazioni: profilo azienda, export/import dati, gestione ruoli (admin)

CONOSCENZE TECNICHE - Settore lavorazione pietra:
- Lastre, spessori (es. SP2, SP3, SP4 cm), finiture (levigato, lucido, bocciardato, fiammato, sabbiato, anticato, spazzolato)
- Engobbio, smaltatura, pietra ricomposta
- Tipologie pietra (travertino, marmo, granito, pietra lavica, ecc.)
- Lavorazioni: taglio, foratura, scanalature, gocciolatoio, bisellatura, raggi
- Misurazione mq, ml, pezzi
- Vanity (piani lavabo con vasche integrate)

REGOLE:
- Rispondi sempre in italiano, in modo conciso e chiaro
- Se la domanda riguarda l'app, spiega passo-passo dove cliccare
- Se la domanda è tecnica di settore, dai risposte pratiche
- Se non sai qualcosa di specifico sull'azienda, dillo onestamente
- Usa markdown (liste, **grassetto**) per leggibilità
- Mantieni risposte brevi (max 4-5 righe salvo serva spiegare procedure)`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages must be an array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurata");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppe richieste, riprova tra poco." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti. Contatta l'amministratore." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Errore del servizio AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("help-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
