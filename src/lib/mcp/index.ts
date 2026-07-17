import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listQuotesTool from "./tools/list-quotes";
import getQuoteTool from "./tools/get-quote";
import listClientsTool from "./tools/list-clients";
import listProductsTool from "./tools/list-products";

// Build the direct Supabase issuer from the project ref (see app-mcp-server-authoring).
// Never build it from SUPABASE_URL (may be a .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "preventivi-ranieri-mcp",
  title: "Preventivi Ranieri",
  version: "0.1.0",
  instructions:
    "Strumenti in sola lettura per consultare preventivi, clienti e prodotti (listino DT) dell'utente autenticato. Ogni chiamata rispetta le policy RLS: vengono restituiti solo i dati dell'utente collegato.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listQuotesTool, getQuoteTool, listClientsTool, listProductsTool],
});
