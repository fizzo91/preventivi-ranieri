import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Save } from "lucide-react"
import { TemplateForm } from "../components/TemplateForm"
import { orderConfirmationSchema } from "../templates/orderConfirmationSchema"
import { useOrderConfirmation, useSaveOrderConfirmation } from "@/hooks/useOrderConfirmation"
import { generateProjectDocPdf } from "@/utils/pdf/generateProjectDocPdf"
import type { Project } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

export const OrderConfirmationTab = ({ project }: { project: Project }) => {
  const { data: oc, isLoading } = useOrderConfirmation(project.id)
  const save = useSaveOrderConfirmation(project.id)
  const [data, setData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (oc?.data) setData(oc.data)
  }, [oc])

  const handlePdf = () =>
    generateProjectDocPdf({
      project,
      schema: orderConfirmationSchema,
      data,
      documentTitle: "Conferma d'Ordine",
      fileNamePrefix: "conferma-ordine",
    })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={handlePdf} className="gap-2">
          <FileDown className="h-4 w-4" /> Genera PDF
        </Button>
        <Button
          onClick={() => save.mutate({ id: oc?.id, data })}
          disabled={save.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" /> Salva
        </Button>
      </div>

      <TemplateForm schema={orderConfirmationSchema} value={data} onChange={setData} />
    </div>
  )
}
