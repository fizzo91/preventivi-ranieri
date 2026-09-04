export interface ZohoRecord { [key: string]: any }

const clean = (value: unknown) => typeof value === "string" ? value.trim() : ""

export function extractDimensionsMm(description: string): number[] {
  const values: number[] = []
  const regex = /(?:L|W|H|D|T|Ø|R)?\s*(\d{2,5}(?:[.,]\d+)?)\s*mm/gi
  for (const match of description.matchAll(regex)) values.push(Number(match[1].replace(",", ".")))
  return values
}

export function buildTechnicalDossier(deal: ZohoRecord, quote: ZohoRecord | null, notes: ZohoRecord[], attachments: ZohoRecord[]) {
  const quotedItems = Array.isArray(quote?.Quoted_Items) ? quote.Quoted_Items : []
  const items = quotedItems.map((item: ZohoRecord, index: number) => {
    const description = clean(item.Details) || clean(item.Description)
    const technicalFlags: string[] = []
    if (/cut[- ]?out|foro|hole|drill/i.test(description)) technicalFlags.push("holes_or_cutouts")
    if (/division|divided|elements|panels|pezzi/i.test(description)) technicalFlags.push("requires_piece_breakdown")
    if (/tbc|tbd|subject to|further details/i.test(description)) technicalFlags.push("information_to_confirm")
    if (/sink|lavello/i.test(description)) technicalFlags.push("sink_template_required")
    if (/electrical/i.test(description)) technicalFlags.push("electrical_coordination")
    return {
      id: clean(item.id) || `ID.${String(index + 1).padStart(2, "0")}`,
      description,
      quantity: Number(item.Quantity) || 1,
      dimensionsMm: extractDimensionsMm(description),
      finish: description.match(/Finish:\s*([^–-]+)/i)?.[1]?.trim() ?? null,
      colour: description.match(/Colour:\s*([^–-]+)/i)?.[1]?.trim() ?? null,
      technicalFlags,
    }
  })
  const missingInformation = Array.from(new Set(items.flatMap((item: any) => {
    const missing: string[] = []
    if (!item.finish) missing.push(`${item.id}: finish missing`)
    if (!item.colour || /TBC|TBD/i.test(item.colour)) missing.push(`${item.id}: colour to confirm`)
    if (item.technicalFlags.includes("requires_piece_breakdown")) missing.push(`${item.id}: final piece breakdown required`)
    if (item.technicalFlags.includes("sink_template_required")) missing.push(`${item.id}: appliance/fixture template required`)
    return missing
  })))
  return {
    schemaVersion: "1.0", generatedAt: new Date().toISOString(),
    source: { dealId: clean(deal.id), quoteId: clean(quote?.id), dealName: clean(deal.Deal_Name), quoteSubject: clean(quote?.Subject) },
    project: { client: deal.Account_Name?.name ?? null, project: deal.Progetto ?? null, room: deal.Room ?? null, application: deal.Application ?? [], indoorOutdoor: deal.Indoor_Outdoor ?? null, proposedSurface: deal.Surface_Proposed ?? null },
    commercial: { currency: quote?.Currency ?? deal.Currency ?? "EUR", sellingTotal: Number(quote?.Grand_Total) || null, recordedCost: Number(quote?.Grand_Total_Cost) || null, status: quote?.Quote_Stage ?? null },
    items,
    notes: notes.map((note) => ({ id: note.id, title: note.Note_Title ?? null, content: note.Note_Content ?? "" })),
    attachments: attachments.map((file) => ({ id: file.id, name: file.File_Name, size: Number(file.Size) || null })),
    missingInformation,
    recommendedDirection: ["Confirm final dimensions against coordinated drawings.", "Define the manufacturable piece breakdown before costing.", "Separate stone, second cut, machining, edges, holes, finish, engobbio, risk and packing.", "For DEEP finishes, include engobbio and finish-related risk and check slab allowance up to +30%.", "Validate each section against historical average €/sqm using second-cut sqm when available."],
    confidence: attachments.length > 0 && items.length > 0 ? "medium" : "low",
  }
}
