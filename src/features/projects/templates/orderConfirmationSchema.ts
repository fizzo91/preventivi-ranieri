import type { TemplateSchema } from "./types"

/**
 * Placeholder schema — i campi definitivi verranno passati dall'utente.
 */
export const orderConfirmationSchema: TemplateSchema = {
  groups: [
    {
      title: "Riferimenti",
      fields: [
        { key: "order_number", label: "Numero ordine", type: "text" },
        { key: "order_date", label: "Data conferma", type: "date" },
        { key: "quote_reference", label: "Riferimento preventivo", type: "text" },
      ],
    },
    {
      title: "Oggetto della fornitura",
      fields: [
        { key: "subject", label: "Oggetto", type: "textarea", rows: 3, fullWidth: true },
        { key: "specs", label: "Specifiche tecniche", type: "textarea", rows: 4, fullWidth: true },
      ],
    },
    {
      title: "Condizioni",
      fields: [
        { key: "delivery_date", label: "Data di consegna prevista", type: "date" },
        { key: "delivery_address", label: "Indirizzo di consegna", type: "text", fullWidth: true },
        { key: "payment_terms", label: "Termini di pagamento", type: "textarea", rows: 3, fullWidth: true },
        { key: "warranty", label: "Garanzia", type: "textarea", rows: 2, fullWidth: true },
      ],
    },
    {
      title: "Note e firma",
      fields: [
        { key: "notes", label: "Note", type: "textarea", rows: 3, fullWidth: true },
        { key: "signed_by", label: "Firmato da", type: "text" },
      ],
    },
  ],
}
