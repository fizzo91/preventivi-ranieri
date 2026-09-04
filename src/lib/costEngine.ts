export interface CostComponent {
  code: string
  description: string
  quantity: number
  unitPrice: number
}

export interface CostSectionInput {
  name: string
  finishedSqm: number
  secondCutSqm?: number | null
  slabSqm?: number | null
  finish?: string | null
  components: CostComponent[]
  engobbio: number
  finishCost: number
  riskPercent: number
  averageCostPerSqm?: number | null
  averageTolerancePercent?: number
}

export interface CostSectionResult {
  name: string
  referenceSqm: number
  allowedSlabSqm: number
  componentSubtotal: number
  engobbio: number
  finishCost: number
  riskBase: number
  riskAmount: number
  total: number
  costPerSqm: number
  averageCheck: {
    status: "within" | "below" | "above" | "unavailable"
    differencePercent: number | null
    tolerancePercent: number
  }
  warnings: string[]
}

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

/**
 * Deterministic section calculation shared by the UI and autonomous tools.
 * Tariffs are always supplied by the catalog/caller: this function never invents prices.
 */
export function calculateCostSection(input: CostSectionInput): CostSectionResult {
  const warnings: string[] = []
  if (!(input.finishedSqm > 0)) throw new Error("finishedSqm must be greater than zero")
  if (input.riskPercent < 0) throw new Error("riskPercent cannot be negative")

  const referenceSqm = input.secondCutSqm && input.secondCutSqm > 0
    ? input.secondCutSqm
    : input.finishedSqm
  const allowedSlabSqm = money(input.finishedSqm * 1.3)

  if (input.slabSqm && input.slabSqm > allowedSlabSqm) {
    warnings.push(`Slab area ${input.slabSqm.toFixed(2)} sqm exceeds the +30% limit (${allowedSlabSqm.toFixed(2)} sqm).`)
  }

  const componentSubtotal = money(input.components.reduce((sum, component) => {
    if (component.quantity < 0 || component.unitPrice < 0) {
      throw new Error(`Negative value in component ${component.code}`)
    }
    return sum + component.quantity * component.unitPrice
  }, 0))

  const riskBase = money(componentSubtotal + input.engobbio + input.finishCost)
  const riskAmount = money(riskBase * input.riskPercent / 100)
  const total = money(riskBase + riskAmount)
  const costPerSqm = money(total / referenceSqm)
  const tolerancePercent = input.averageTolerancePercent ?? 15

  let status: CostSectionResult["averageCheck"]["status"] = "unavailable"
  let differencePercent: number | null = null
  if (input.averageCostPerSqm && input.averageCostPerSqm > 0) {
    differencePercent = money((costPerSqm - input.averageCostPerSqm) / input.averageCostPerSqm * 100)
    status = differencePercent > tolerancePercent
      ? "above"
      : differencePercent < -tolerancePercent
        ? "below"
        : "within"
  }

  if (/deep/i.test(input.finish ?? "") && input.engobbio <= 0) {
    warnings.push("DEEP finish without an engobbio cost.")
  }

  return {
    name: input.name,
    referenceSqm: money(referenceSqm),
    allowedSlabSqm,
    componentSubtotal,
    engobbio: money(input.engobbio),
    finishCost: money(input.finishCost),
    riskBase,
    riskAmount,
    total,
    costPerSqm,
    averageCheck: { status, differencePercent, tolerancePercent },
    warnings,
  }
}
