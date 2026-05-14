import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useProject } from "@/hooks/useProjects"
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog"
import { ScopeTab } from "@/features/projects/tabs/ScopeTab"
import { QuotesTab } from "@/features/projects/tabs/QuotesTab"
import { TrattativaTab } from "@/features/projects/tabs/TrattativaTab"

const VALID_TABS = new Set(["scope", "quotes", "trattativa"])

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const initialTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "scope"
  const { data: project, isLoading } = useProject(id)
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <LoadingSpinner />

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/projects")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Indietro
        </Button>
        <p className="text-muted-foreground">Progetto non trovato.</p>
      </div>
    )
  }

  const statusLabel =
    project.status === "closed" ? "Chiuso" : project.status === "archived" ? "Archiviato" : "Attivo"

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set("tab", value)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4" /> Progetti
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge>{statusLabel}</Badge>
          </div>
          {(project.client_name || project.client_company) && (
            <p className="text-muted-foreground">
              {[project.client_name, project.client_company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2">
          <Pencil className="h-4 w-4" /> Modifica
        </Button>
      </div>

      <Tabs value={initialTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="scope">Project Scope</TabsTrigger>
          <TabsTrigger value="quotes">Preventivo</TabsTrigger>
          <TabsTrigger value="trattativa">Trattativa</TabsTrigger>
        </TabsList>
        <TabsContent value="scope" className="mt-6">
          <ScopeTab project={project} />
        </TabsContent>
        <TabsContent value="quotes" className="mt-6">
          <QuotesTab project={project} />
        </TabsContent>
        <TabsContent value="trattativa" className="mt-6">
          <TrattativaTab project={project} />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
    </div>
  )
}

export default ProjectDetail
