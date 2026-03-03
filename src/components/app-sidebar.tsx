import { useState } from "react"
import { Home, FileText, Plus, Settings, Calculator, Image, Wrench } from "lucide-react"
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Nuovo Preventivo", url: "/new-quote", icon: Plus },
  { title: "Preventivi", url: "/quotes", icon: FileText },
  { title: "Galleria", url: "/gallery", icon: Image },
  { title: "Prodotti", url: "/products", icon: Calculator },
  { title: "Strumenti", url: "/tools", icon: Wrench },
  { title: "Impostazioni", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"

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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}