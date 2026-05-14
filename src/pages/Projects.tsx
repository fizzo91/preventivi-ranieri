import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, FolderKanban, Trash2, Pencil, ClipboardList, FileText, Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useProjects, useDeleteProject } from "@/hooks/useProjects"
import { useProjectsOverview } from "@/hooks/useProjectsOverview"
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog"
import type { Project } from "@/hooks/useProjects"
import { cn } from "@/lib/utils"

const statusVariant = (status: string) => {
  if (status === "closed") return "secondary"
  if (status === "archived") return "outline"
  return "default"
}

const statusLabel = (status: string) =>
  status === "closed" ? "Chiuso" : status === "archived" ? "Archiviato" : "Attivo"

const Projects = () => {
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects()
  const { data: overview } = useProjectsOverview(projects.map((p) => p.id))
  const deleteProject = useDeleteProject()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const handleEdit = (p: Project) => { setEditing(p); setOpen(true) }
  const handleNew = () => { setEditing(null); setOpen(true) }
  const handleDelete = (p: Project) => {
    if (window.confirm(`Eliminare il progetto "${p.name}"? I preventivi collegati restano disponibili.`)) {
      deleteProject.mutate(p.id)
    }
  }

  if (isLoading) return <LoadingSpinner />

  const renderIcon = (
    Icon: typeof ClipboardList,
    active: boolean,
    label: string,
    onClick: () => void,
    badge?: number,
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className={cn(
            "relative h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors",
            active
              ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
              : "border-muted text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
          {typeof badge === "number" && badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-[10px] h-4 min-w-4 px-1 inline-flex items-center justify-center">
              {badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progetti"
        description="Contenitore per scope, preventivi e trattativa"
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
          message="Nessun progetto. Crea il primo per organizzare scope, preventivi e trattativa."
          actionLabel="Nuovo progetto"
          onAction={handleNew}
        />
      ) : (
        <div className="border rounded-lg divide-y">
          {projects.map((p) => {
            const flags = overview?.[p.id]
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/projects/${p.id}`} className="font-semibold hover:underline truncate">
                      {p.name}
                    </Link>
                    <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {[p.client_name, p.client_company].filter(Boolean).join(" · ") || "Nessun cliente"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderIcon(
                    ClipboardList,
                    !!flags?.hasScope,
                    "Scope",
                    () => navigate(`/projects/${p.id}?tab=scope`),
                  )}
                  {renderIcon(
                    FileText,
                    (flags?.quotesCount ?? 0) > 0,
                    "Preventivo",
                    () => navigate(`/projects/${p.id}?tab=quotes`),
                    flags?.quotesCount,
                  )}
                  {renderIcon(
                    Handshake,
                    !!flags?.hasTrattativa,
                    "Trattativa",
                    () => navigate(`/projects/${p.id}?tab=trattativa`),
                  )}
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} aria-label="Modifica">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} aria-label="Elimina">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProjectFormDialog open={open} onOpenChange={setOpen} project={editing} />
    </div>
  )
}

export default Projects
