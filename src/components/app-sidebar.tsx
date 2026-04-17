import { Home, FileText, Plus, Settings, Calculator, Image, Wrench, AlignLeft, BookOpen } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { usePendingRequestsCount } from "@/hooks/useAccessRequests"

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Nuovo Preventivo", url: "/new-quote", icon: Plus },
  { title: "Preventivi", url: "/quotes", icon: FileText },
  { title: "Galleria", url: "/gallery", icon: Image },
  { title: "Descrizioni", url: "/descriptions", icon: AlignLeft },
  { title: "Prodotti", url: "/products", icon: Calculator },
  { title: "Strumenti", url: "/tools", icon: Wrench },
  { title: "Guida", url: "/guide", icon: BookOpen },
  { title: "Impostazioni", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const pendingCount = usePendingRequestsCount()

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
                const showBadge = item.url === "/settings" && pendingCount > 0
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {showBadge && state === "expanded" && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                            {pendingCount}
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
