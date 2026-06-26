import { Building2, FolderTree, Users, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {useGestorContext} from "@/contexts/gestor/useGestorContext.ts";

interface BreadcrumbItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  isLast?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

function BreadcrumbItem({ icon, label, sublabel, isLast, onClick, isActive }: BreadcrumbItemProps) {
  return (
    <>
      <motion.button
        onClick={onClick}
        disabled={!onClick}
        whileHover={onClick ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
          ${isActive 
            ? "bg-primary/10 text-primary" 
            : onClick 
              ? "hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer" 
              : "text-muted-foreground"
          }
          ${!onClick ? "cursor-default" : ""}
        `}
      >
        <span className={`${isActive ? "text-primary" : "text-muted-foreground"}`}>
          {icon}
        </span>
        <div className="flex flex-col items-start">
          <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
            {label}
          </span>
          {sublabel && (
            <span className="text-xs text-muted-foreground -mt-0.5">{sublabel}</span>
          )}
        </div>
      </motion.button>
      {!isLast && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      )}
    </>
  );
}

export function GestorBreadcrumb() {
  const navigate = useNavigate();
  const {
    selectedSector,
    selectedGroup,
  } = useGestorContext();

  const institutionName = selectedGroup?.institutionName || selectedSector?.institutionName;

  return (
    <div className="flex items-center gap-1 bg-secondary/30 rounded-xl px-2 py-1.5 overflow-x-auto no-scrollbar">
      {/* Institution Level */}
      {institutionName ? (
        <BreadcrumbItem
          icon={<Building2 className="w-4 h-4" />}
          label={institutionName}
          onClick={() => navigate("/gestor/instituicoes")}
        />
      ) : (
        <BreadcrumbItem
          icon={<Building2 className="w-4 h-4" />}
          label="Instituição"
          sublabel="Não selecionada"
          onClick={() => navigate("/gestor/instituicoes")}
        />
      )}

      {/* Sector Level */}
      {selectedSector ? (
        <BreadcrumbItem
          icon={<FolderTree className="w-4 h-4" />}
          label={selectedSector.name}
          onClick={() => navigate("/gestor/setores")}
        />
      ) : (
        <BreadcrumbItem
          icon={<FolderTree className="w-4 h-4" />}
          label="Setor"
          sublabel="Não selecionado"
          onClick={() => navigate("/gestor/setores")}
        />
      )}

      {/* Team Level */}
      {selectedGroup ? (
        <BreadcrumbItem
          icon={<Users className="w-4 h-4" />}
          label={selectedGroup.name}
          sublabel={`${selectedGroup.memberCount} membros`}
          isLast
          isActive
        />
      ) : (
        <BreadcrumbItem
          icon={<Users className="w-4 h-4" />}
          label="Equipe"
          sublabel="Não selecionada"
          isLast
          onClick={() => navigate("/gestor/equipes")}
        />
      )}
    </div>
  );
}

// Compact version for mobile
export function GestorBreadcrumbCompact() {
  const {
    selectedSector,
    selectedGroup,
  } = useGestorContext();

  const institutionName = selectedGroup?.institutionName || selectedSector?.institutionName;

  const items = [
    institutionName?.substring(0, 2).toUpperCase() || "IN",
    selectedSector?.name?.substring(0, 2).toUpperCase() || "SE",
    selectedGroup?.name?.substring(0, 2).toUpperCase() || "EQ",
  ];

  const fullPath = [
    institutionName || "Instituição",
    selectedSector?.name || "Setor",
    selectedGroup?.name || "Equipe",
  ];

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span 
            className={`
              px-1.5 py-0.5 rounded font-medium
              ${index === items.length - 1 
                ? "bg-primary/10 text-primary" 
                : "bg-secondary text-muted-foreground"
              }
            `}
            title={fullPath[index]}
          >
            {item}
          </span>
          {index < items.length - 1 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
  );
}
