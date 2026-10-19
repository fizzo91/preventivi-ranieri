import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listQuotesTool from "./tools/list-quotes";
import getQuoteTool from "./tools/get-quote";
import listClientsTool from "./tools/list-clients";
import listProductsTool from "./tools/list-products";
import calculateCostDraftTool from "./tools/calculate-cost-draft";
import importZohoProjectDraftTool from "./tools/import-zoho-project-draft";
import createQuoteTool from "./tools/create-quote";

// Build the direct Supabase issuer from the project ref (see app-mcp-server-authoring).
// Never build it from SUPABASE_URL (may be a .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "preventivi-ranieri-mcp",
  title: "Preventivi Ranieri",
  version: "0.4.0",
  instructions:
    "Strumenti per consultare preventivi, clienti e prodotti (listino DT), calcolare bozze costo e creare nuovi preventivi. Per creare un preventivo: cerca prima i prodotti con list_products, poi chiama create_quote con i product_id e le quantità.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listQuotesTool, getQuoteTool, listClientsTool, listProductsTool, calculateCostDraftTool, importZohoProjectDraftTool, createQuoteTool],
});
