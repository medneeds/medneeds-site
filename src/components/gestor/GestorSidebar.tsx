import { useNavigate, useLocation } from "react-router-dom";
import { Building2, FolderTree, Users, Calendar, ArrowLeftRight, MessageCircle, ChevronRight, LayoutDashboard, PanelLeftClose, PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {useGestorContext} from "@/contexts/gestor/useGestorContext.ts";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  level?: "structure" | "operations";
  badge?: string | number;
  description?: string;
  isCollapsed?: boolean;
}

function NavItem({ icon: Icon, label, path, isActive, onClick, level, badge, description, isCollapsed }: NavItemProps) {
  const content = (
    <motion.button
      onClick={onClick}
      whileHover={{ x: isCollapsed ? 0 : 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg transition-all text-left group",
        isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5",
        isActive 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-md transition-colors shrink-0",
        isCollapsed ? "w-8 h-8" : "w-8 h-8",
        isActive 
          ? "bg-primary-foreground/20" 
          : "bg-secondary group-hover:bg-muted"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{label}</span>
            {description && !isActive && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{description}</p>
            )}
          </div>
          {badge !== undefined && (
            <Badge 
              variant={isActive ? "secondary" : "outline"} 
              className={cn(
                "text-xs shrink-0",
                isActive && "bg-primary-foreground/20 text-primary-foreground border-0"
              )}
            >
              {badge}
            </Badge>
          )}
          {isActive && (
            <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
          )}
        </>
      )}
    </motion.button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {badge !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">Total: {badge}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[200px]">
        <p className="font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

interface GestorSidebarProps {
  activeTab: "instituicoes" | "setores" | "equipes" | "escalas" | "permutas" | "chat";
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function GestorSidebar({ activeTab, isCollapsed, onToggleCollapse }: GestorSidebarProps) {
  const navigate = useNavigate();
  const { sectors, allGroups, selectedSector, selectedGroup } = useGestorContext();

  // Structure items (hierarchy)
  const structureItems = [
    { 
      id: "instituicoes", 
      label: "Instituições", 
      icon: Building2, 
      path: "/gestor/instituicoes",
      description: "Hospitais e clínicas",
    },
    { 
      id: "setores", 
      label: "Setores", 
      icon: FolderTree, 
      path: "/gestor/setores",
      description: "Áreas dentro das instituições",
      badge: sectors.length,
    },
    { 
      id: "equipes", 
      label: "Equipes", 
      icon: Users, 
      path: "/gestor/equipes",
      description: "Grupos de médicos",
      badge: allGroups.length,
    },
  ];

  // Operations items (day-to-day)
  const operationsItems = [
    { 
      id: "escalas", 
      label: "Escalas", 
      icon: Calendar, 
      path: "/gestor",
      description: "Montar e publicar escalas",
    },
    { 
      id: "permutas", 
      label: "Permutas", 
      icon: ArrowLeftRight, 
      path: "/gestor/permutas",
      description: "Trocas de plantão",
    },
    { 
      id: "chat", 
      label: "Chat", 
      icon: MessageCircle, 
      path: "/gestor/chat",
      description: "Comunicação com equipe",
    },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="bg-card border-r border-border flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className={cn("p-4 border-b border-border", isCollapsed && "px-2")}>
        <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden"
              >
                <h2 className="font-semibold text-foreground text-sm whitespace-nowrap">Portal do Gestor</h2>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">Gestão de escalas</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Collapse toggle button - discrete in header */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
              >
                {isCollapsed ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expandir" : "Recolher"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 p-3 space-y-4 overflow-y-auto", isCollapsed && "px-2")}>
        {/* Structure Section */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Estrutura
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          
          {/* Hierarchy Visual */}
          <div className="relative">
            {/* Vertical connector line - only in expanded mode */}
            {!isCollapsed && (
              <div className="absolute left-[22px] top-8 bottom-4 w-px bg-gradient-to-b from-border via-border to-transparent" />
            )}
            
            <div className="space-y-1">
              {structureItems.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Horizontal connector - only in expanded mode */}
                  {!isCollapsed && index > 0 && (
                    <div className="absolute left-[22px] top-5 w-3 h-px bg-border" />
                  )}
                  <div className={!isCollapsed && index > 0 ? "pl-4" : ""}>
                    <NavItem
                      icon={item.icon}
                      label={item.label}
                      path={item.path}
                      isActive={activeTab === item.id}
                      onClick={() => navigate(item.path)}
                      level="structure"
                      badge={item.badge}
                      description={item.description}
                      isCollapsed={isCollapsed}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operations Section */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Operações
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          
          <div className="space-y-1">
            {operationsItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={activeTab === item.id}
                onClick={() => navigate(item.path)}
                level="operations"
                description={item.description}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Current Context Footer - only in expanded mode */}
      <AnimatePresence>
        {!isCollapsed && (selectedSector || selectedGroup) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 border-t border-border bg-secondary/30 overflow-hidden"
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Contexto atual
            </p>
            <div className="space-y-1.5">
              {selectedSector && (
                <div className="flex items-center gap-2 text-xs">
                  <FolderTree className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground truncate">{selectedSector.name}</span>
                </div>
              )}
              {selectedGroup && (
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground truncate">{selectedGroup.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {selectedGroup.memberCount}
                  </Badge>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.aside>
  );
}
