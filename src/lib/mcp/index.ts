import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listQuotesTool from "./tools/list-quotes";
import getQuoteTool from "./tools/get-quote";
import listClientsTool from "./tools/list-clients";
import listProductsTool from "./tools/list-products";
import calculateCostDraftTool from "./tools/calculate-cost-draft";
import importZohoProjectDraftTool from "./tools/import-zoho-project-draft";

// Build the direct Supabase issuer from the project ref (see app-mcp-server-authoring).
// Never build it from SUPABASE_URL (may be a .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "preventivi-ranieri-mcp",
  title: "Preventivi Ranieri",
  version: "0.4.0",
  instructions:
    "Consulta preventivi, clienti e prodotti; per le quotation richieste crea cartelle WorkDrive e report Word senza modificare costi o stato Zoho.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listQuotesTool, getQuoteTool, listClientsTool, listProductsTool, calculateCostDraftTool, importZohoProjectDraftTool],
});
