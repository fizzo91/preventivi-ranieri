import { createPdfBase } from "./pdfBase"
import type { TemplateSchema } from "@/features/projects/templates/types"
import type { Project } from "@/hooks/useProjects"

interface Args {
  project: Project
  schema: TemplateSchema
  data: Record<string, unknown>
  documentTitle: string
  fileNamePrefix: string
}

const formatValue = (raw: unknown): string => {
  if (raw === null || raw === undefined || raw === "") return "—"
  return String(raw)
}

const isDateField = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)
const formatItDate = (s: string) => {
  const [y, m, d] = s.split("-")
  return `${d}/${m}/${y}`
}

/**
 * Generic project-document PDF used for both project scope and order confirmation.
 * Keeps tipografia/colori coerenti col PDF preventivi (createPdfBase + Helvetica).
 */
export function generateProjectDocPdf({
  project,
  schema,
  data,
  documentTitle,
  fileNamePrefix,
}: Args) {
  const ctx = createPdfBase()
  const { pdf, pageWidth, margin, contentWidth, checkPageBreak, addPageNumbers } = ctx
  let y = ctx.getY()

  // Title
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.text(documentTitle.toUpperCase(), pageWidth / 2, y, { align: "center" })
  y += 10
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Progetto: ${project.name}`, pageWidth / 2, y, { align: "center" })
  y += 15

  // Project / client block
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.text("PROGETTO", margin, y)
  y += 7
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  if (project.client_name) { pdf.text(`Cliente: ${project.client_name}`, margin, y); y += 5 }
  if (project.client_company) { pdf.text(project.client_company, margin, y); y += 5 }
  if (project.client_email) { pdf.text(`Email: ${project.client_email}`, margin, y); y += 5 }
  if (project.client_phone) { pdf.text(`Tel: ${project.client_phone}`, margin, y); y += 5 }
  if (project.client_address) { pdf.text(`Indirizzo: ${project.client_address}`, margin, y); y += 5 }
  y += 8
  ctx.setY(y)

  // Groups
  for (const group of schema.groups) {
    checkPageBreak(20)
    y = ctx.getY()

    pdf.setFillColor(248, 249, 250)
    pdf.rect(margin, y - 5, contentWidth, 10, "F")
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text(group.title, margin + 2, y)
    y += 10
    ctx.setY(y)

    for (const field of group.fields) {
      const raw = data[field.key]
      const isLong = field.type === "textarea" || field.fullWidth
      const valueText = formatValue(
        typeof raw === "string" && isDateField(raw) ? formatItDate(raw) : raw,
      )

      if (isLong) {
        checkPageBreak(14)
        y = ctx.getY()
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        pdf.text(field.label, margin + 2, y)
        y += 5
        pdf.setFont("helvetica", "normal")
        const lines = pdf.splitTextToSize(valueText, contentWidth - 4)
        for (const line of lines) {
          checkPageBreak(6)
          y = ctx.getY()
          pdf.text(line, margin + 2, y)
          y += 4
        }
        y += 4
        ctx.setY(y)
      } else {
        checkPageBreak(8)
        y = ctx.getY()
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        pdf.text(`${field.label}:`, margin + 2, y)
        pdf.setFont("helvetica", "normal")
        pdf.text(valueText, margin + 60, y)
        y += 6
        ctx.setY(y)
      }
    }

    y = ctx.getY() + 4
    ctx.setY(y)
  }

  // Footer
  y = ctx.getY() + 10
  ctx.setY(y); checkPageBreak(15); y = ctx.getY()
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(
    `Documento generato il ${new Date().toLocaleDateString("it-IT")}`,
    pageWidth / 2,
    y,
    { align: "center" },
  )

  addPageNumbers()
  const safeName = project.name.replace(/[^\w-]+/g, "_").toLowerCase()
  pdf.save(`${fileNamePrefix}-${safeName}.pdf`)
}
