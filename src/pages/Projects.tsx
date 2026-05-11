import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, FolderKanban, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  useProjects,
  useDeleteProject,
} from "@/hooks/useProjects"
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog"
import type { Project } from "@/hooks/useProjects"

const statusVariant = (status: string) => {
  if (status === "closed") return "secondary"
  if (status === "archived") return "outline"
  return "default"
}

const statusLabel = (status: string) =>
  status === "closed" ? "Chiuso" : status === "archived" ? "Archiviato" : "Attivo"

const Projects = () => {
  const { data: projects = [], isLoading } = useProjects()
  const deleteProject = useDeleteProject()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const handleEdit = (p: Project) => {
    setEditing(p)
    setOpen(true)
  }

  const handleNew = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleDelete = (p: Project) => {
    if (window.confirm(`Eliminare il progetto "${p.name}"? I preventivi collegati restano disponibili.`)) {
      deleteProject.mutate(p.id)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progetti"
        description="Contenitore per scope, preventivi e conferma ordine"
        actions={
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo progetto
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Nessun progetto"
          description="Crea il primo progetto per organizzare scope, preventivi e conferma ordine."
          action={
            <Button onClick={handleNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo progetto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">
                    <Link to={`/projects/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </CardTitle>
                  <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground space-y-1">
                  {p.client_name && <div>{p.client_name}</div>}
                  {p.client_company && <div>{p.client_company}</div>}
                  {!p.client_name && !p.client_company && <div className="italic">Nessun cliente</div>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/projects/${p.id}`}>Apri</Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} aria-label="Modifica">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} aria-label="Elimina">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectFormDialog open={open} onOpenChange={setOpen} project={editing} />
    </div>
  )
}

export default Projects
