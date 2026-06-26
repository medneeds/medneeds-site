import { useState, useEffect } from "react";
import { GestorHeader } from "./GestorHeader";
import { GestorProvider } from "@/contexts/gestor/GestorContext.tsx";
import { GestorSidebar } from "./GestorSidebar";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, FolderTree, Users, Calendar, ArrowLeftRight, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GestorThemeProvider, useGestorTheme } from "@/hooks/gestor/useGestorTheme.tsx";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "gestor-sidebar-collapsed";

interface GestorLayoutProps {
  children: React.ReactNode;
  activeTab: "instituicoes" | "setores" | "equipes" | "escalas" | "permutas" | "chat";
}

const gestorTabs = [
  { id: "instituicoes", label: "Instituições", shortLabel: "Inst.", icon: Building2, path: "/gestor/instituicoes", group: "structure" },
  { id: "setores", label: "Setores", shortLabel: "Setores", icon: FolderTree, path: "/gestor/setores", group: "structure" },
  { id: "equipes", label: "Equipes", shortLabel: "Equipes", icon: Users, path: "/gestor/equipes", group: "structure" },
  { id: "escalas", label: "Escalas", shortLabel: "Escalas", icon: Calendar, path: "/gestor", group: "operations" },
  { id: "permutas", label: "Permutas", shortLabel: "Permutas", icon: ArrowLeftRight, path: "/gestor/permutas", group: "operations" },
  { id: "chat", label: "Chat", shortLabel: "Chat", icon: MessageCircle, path: "/gestor/chat", group: "operations" },
];

function GestorLayoutContent({ children, activeTab }: GestorLayoutProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useGestorTheme();

  // Sidebar collapse state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  const handleToggleSidebar = () => {
    const newValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className={cn("min-h-screen bg-background flex flex-col", theme === "dark" && "dark")}>
        {/* Mobile Header */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground flex-1">Portal do Gestor</h1>
          <ThemeToggle variant="icon" />
        </header>

        {/* Mobile Navigation Tabs - Grouped */}
        <div className="bg-card border-b border-border px-2 py-2">
          {/* Structure Group */}
          <div className="flex overflow-x-auto gap-1 no-scrollbar mb-2">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1 shrink-0">
              Estrutura
            </span>
            {gestorTabs.filter(t => t.group === "structure").map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted bg-secondary/50"
                    }
                  `}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.shortLabel}
                </button>
              );
            })}
          </div>
          {/* Operations Group */}
          <div className="flex overflow-x-auto gap-1 no-scrollbar">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1 shrink-0">
              Operações
            </span>
            {gestorTabs.filter(t => t.group === "operations").map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted bg-secondary/50"
                    }
                  `}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Header with selectors */}
        <GestorHeader />

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto p-4"
        >
          {children}
        </motion.div>
      </div>
    );
  }

  // Desktop Layout with Sidebar
  return (
    <TooltipProvider>
      <div className={cn("min-h-screen bg-background flex w-full", theme === "dark" && "dark")}>
        {/* Sidebar */}
        <GestorSidebar 
          activeTab={activeTab} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with selectors and theme toggle */}
          <GestorHeader showThemeToggle />

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-y-auto p-6"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function GestorLayout({ children, activeTab }: GestorLayoutProps) {
  return (
    <GestorThemeProvider>
      <GestorProvider>
        <GestorLayoutContent activeTab={activeTab}>
          {children}
        </GestorLayoutContent>
      </GestorProvider>
    </GestorThemeProvider>
  );
}
