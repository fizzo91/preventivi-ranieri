import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "npm:docx@9.5.1"

export async function buildWordReport(input: { dealName: string; quoteSubject: string; stage: string; account: string; contact: string; room: string; items: Array<{ description: string; quantity: number }>; notes: Array<{ content: string }>; attachments: Array<{ name: string }>; trigger: string }) {
  const rows = [["Progetto", input.dealName], ["Quotation", input.quoteSubject], ["Stato", input.stage], ["Cliente", input.account], ["Contatto", input.contact], ["Ambiente", input.room], ["Trigger", input.trigger]]
  const children = [
    new Paragraph({ text: "Report sintetico Budget Quote", heading: HeadingLevel.TITLE }),
    ...rows.map(([label, value]) => new Paragraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value || "—")] })),
    new Paragraph({ text: "Voci della quotation", heading: HeadingLevel.HEADING_1 }),
    ...input.items.map((item) => new Paragraph({ text: `${item.quantity} × ${item.description || "Voce senza descrizione"}`, bullet: { level: 0 } })),
    new Paragraph({ text: "Note e indicazioni", heading: HeadingLevel.HEADING_1 }),
    ...(input.notes.length ? input.notes.map((note) => new Paragraph({ text: note.content, bullet: { level: 0 } })) : [new Paragraph("Nessuna nota disponibile.")]),
    new Paragraph({ text: "File disponibili", heading: HeadingLevel.HEADING_1 }),
    ...input.attachments.map((file) => new Paragraph({ text: file.name, bullet: { level: 0 } })),
    new Paragraph({ children: [new TextRun({ text: "Nota: ", bold: true }), new TextRun("report automatico; costi e stato Zoho non sono stati modificati.")] }),
  ]
  return await Packer.toBlob(new Document({ sections: [{ children }] }))
}
