import type { TemplateSchema } from "./types"

/**
 * Placeholder schema — i campi definitivi verranno passati dall'utente.
 * Tutto è salvato nel campo jsonb `data`, quindi cambiare lo schema non
 * richiede migrazioni.
 */
export const scopeSchema: TemplateSchema = {
  groups: [
    {
      title: "Informazioni generali",
      fields: [
        { key: "title", label: "Titolo dello scope", type: "text", fullWidth: true },
        { key: "reference_date", label: "Data di riferimento", type: "date" },
        { key: "responsible", label: "Responsabile", type: "text" },
      ],
    },
    {
      title: "Obiettivi e perimetro",
      fields: [
        { key: "objectives", label: "Obiettivi", type: "textarea", rows: 4, fullWidth: true },
        { key: "deliverables", label: "Deliverable", type: "textarea", rows: 4, fullWidth: true },
        { key: "exclusions", label: "Esclusioni", type: "textarea", rows: 3, fullWidth: true },
      ],
    },
    {
      title: "Tempistiche",
      fields: [
        { key: "start_date", label: "Data inizio", type: "date" },
        { key: "end_date", label: "Data fine prevista", type: "date" },
        { key: "milestones", label: "Milestone", type: "textarea", rows: 3, fullWidth: true },
      ],
    },
    {
      title: "Note",
      fields: [{ key: "notes", label: "Note", type: "textarea", rows: 4, fullWidth: true }],
    },
  ],
}
