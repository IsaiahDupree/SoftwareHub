"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false, toggle: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function CollapsibleSidebar({ children }: { children: ReactNode }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`relative border-r bg-background transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      aria-label="Sidebar"
    >
      <div className={`overflow-hidden ${collapsed ? "px-2" : "px-4"} py-4`}>
        {children}
      </div>
      <button
        onClick={toggle}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
