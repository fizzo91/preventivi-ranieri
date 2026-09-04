import { defineTool } from "@lovable.dev/mcp-js"
import { z } from "zod"
import { calculateCostSection } from "../../costEngine"

export default defineTool({
  name: "calculate_cost_draft",
  title: "Calcola bozza costo",
  description: "Calcola in modo deterministico il costo di una sezione. Non salva e non modifica alcun preventivo.",
  inputSchema: {
    name: z.string().min(1),
    finished_sqm: z.number().positive(),
    second_cut_sqm: z.number().positive().nullable().optional(),
    slab_sqm: z.number().positive().nullable().optional(),
    finish: z.string().nullable().optional(),
    components: z.array(z.object({
      code: z.string().min(1),
      description: z.string(),
      quantity: z.number().nonnegative(),
      unit_price: z.number().nonnegative(),
    })),
    engobbio: z.number().nonnegative(),
    finish_cost: z.number().nonnegative(),
    risk_percent: z.number().nonnegative(),
    average_cost_per_sqm: z.number().positive().nullable().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (args) => {
    const result = calculateCostSection({
      name: args.name,
      finishedSqm: args.finished_sqm,
      secondCutSqm: args.second_cut_sqm,
      slabSqm: args.slab_sqm,
      finish: args.finish,
      components: args.components.map((item) => ({
        code: item.code,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      engobbio: args.engobbio,
      finishCost: args.finish_cost,
      riskPercent: args.risk_percent,
      averageCostPerSqm: args.average_cost_per_sqm,
      averageTolerancePercent: 15,
    })

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
      structuredContent: { result },
    }
  },
})
