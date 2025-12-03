import { useState } from "react";
import { Home, FileText, Plus, Settings, Calculator } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
const items = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Nuovo Preventivo",
  url: "/new-quote",
  icon: Plus
}, {
  title: "Preventivi",
  url: "/quotes",
  icon: FileText
}, {
  title: "Prodotti",
  url: "/products",
  icon: Calculator
}, {
  title: "Impostazioni",
  url: "/settings",
  icon: Settings
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted";
  return <Sidebar collapsible="icon">
      
    </Sidebar>;
}