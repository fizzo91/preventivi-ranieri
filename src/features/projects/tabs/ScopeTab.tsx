import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Save } from "lucide-react"
import { TemplateForm } from "../components/TemplateForm"
import { scopeSchema } from "../templates/scopeSchema"
import { useProjectScope, useSaveProjectScope } from "@/hooks/useProjectScope"
import { generateProjectDocPdf } from "@/utils/pdf/generateProjectDocPdf"
import type { Project } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

export const ScopeTab = ({ project }: { project: Project }) => {
  const { data: scope, isLoading } = useProjectScope(project.id)
  const save = useSaveProjectScope(project.id)
  const [data, setData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (scope?.data) setData(scope.data)
  }, [scope])

  const handlePdf = () =>
    generateProjectDocPdf({
      project,
      schema: scopeSchema,
      data,
      documentTitle: "Project Scope",
      fileNamePrefix: "scope",
    })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={handlePdf} className="gap-2">
          <FileDown className="h-4 w-4" /> Genera PDF
        </Button>
        <Button onClick={() => save.mutate(data)} disabled={save.isPending} className="gap-2">
          <Save className="h-4 w-4" /> Salva
        </Button>
      </div>

      <TemplateForm schema={scopeSchema} value={data} onChange={setData} />
    </div>
  )
}
