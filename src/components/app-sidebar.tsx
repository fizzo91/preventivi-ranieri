import { useState } from "react"
import { Home, Settings, Calculator, Image, Wrench, AlignLeft, BookOpen, Bug, FolderKanban, Truck, ClipboardList, FileText, Handshake, ChevronRight } from "lucide-react"
import { NavLink, useLocation, useMatch, useNavigate } from "react-router-dom"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { usePendingRequestsCount, useIsAdmin } from "@/hooks/useAccessRequests"
import { usePendingBugsCount } from "@/hooks/useBugReports"

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Progetti", url: "/projects", icon: FolderKanban },
  { title: "Fornitori", url: "/fornitori", icon: Truck },
  { title: "Galleria", url: "/gallery", icon: Image },
  { title: "Descrizioni", url: "/descriptions", icon: AlignLeft },
  { title: "Prodotti", url: "/products", icon: Calculator },
  { title: "Strumenti", url: "/tools", icon: Wrench },
  { title: "Guida", url: "/guide", icon: BookOpen },
  { title: "Segnala bug", url: "/bug-report", icon: Bug },
  { title: "Impostazioni", url: "/settings", icon: Settings },
]

const projectSubItems = [
  { title: "Project Scope", tab: "scope", icon: ClipboardList },
  { title: "Preventivo", tab: "quotes", icon: FileText },
  { title: "Trattativa", tab: "trattativa", icon: Handshake },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname
  const projectMatch = useMatch("/projects/:id")
  const projectId = projectMatch?.params.id
  const currentTab = new URLSearchParams(location.search).get("tab") ?? "scope"
  const pendingCount = usePendingRequestsCount()
  const { isAdmin } = useIsAdmin()
  const pendingBugs = usePendingBugsCount()
  const [projectsOpen, setProjectsOpen] = useState(currentPath.startsWith("/projects"))

  const isActive = (path: string) => currentPath === path

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          {state === "expanded" && (
            <h2 className="text-lg font-bold text-sidebar-foreground">Preventivi Pro</h2>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principale</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                let badgeCount = 0
                if (item.url === "/settings" && (pendingCount > 0 || (isAdmin && pendingBugs > 0))) {
                  badgeCount = pendingCount + (isAdmin ? pendingBugs : 0)
                }
                const isProgetti = item.url === "/projects"
                if (isProgetti) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={state === "expanded" ? projectsOpen : false}
                      onOpenChange={setProjectsOpen}
                      asChild
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={currentPath.startsWith("/projects")}
                            onClick={(e) => {
                              if (state !== "expanded") {
                                navigate("/projects")
                                return
                              }
                              // toggle handled by Collapsible; also navigate
                              navigate("/projects")
                            }}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1">{item.title}</span>
                            {state === "expanded" && (
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${projectsOpen ? "rotate-90" : ""}`}
                              />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {projectSubItems.map((sub) => {
                              const to = projectId
                                ? `/projects/${projectId}?tab=${sub.tab}`
                                : `/projects`
                              const active = !!projectId && currentTab === sub.tab
                              return (
                                <SidebarMenuSubItem key={sub.tab}>
                                  <SidebarMenuSubButton asChild isActive={active}>
                                    <NavLink to={to}>
                                      <sub.icon className="h-4 w-4" />
                                      <span>{sub.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {badgeCount > 0 && state === "expanded" && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                            {badgeCount}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
