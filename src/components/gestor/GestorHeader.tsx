import { ChevronLeft, ChevronRight, Plus, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GestorBreadcrumb, GestorBreadcrumbCompact } from "./GestorBreadcrumb";
import { ThemeToggle } from "./ThemeToggle";
import {useGestorContext} from "@/contexts/gestor/useGestorContext.ts";

interface GestorHeaderProps {
  showThemeToggle?: boolean;
}

export function GestorHeader({ showThemeToggle = false }: GestorHeaderProps) {
  const isMobile = useIsMobile();
  const [selectorOpen, setSelectorOpen] = useState(false);
  
  const {
    // Sectors
    selectedSectorId,
    setSelectedSectorId,
    selectedSector,
    sectors,
    isLoadingSectors,
    // Groups
    selectedGroupId,
    setSelectedGroupId,
    selectedGroup,
    groups,
    isLoadingGroups,
    // Month
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
  } = useGestorContext();

  const isLoading = isLoadingGroups || isLoadingSectors;

  // Mobile Loading State
  if (isLoading && isMobile) {
    return (
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </header>
    );
  }

  // Desktop Loading State
  if (isLoading) {
    return (
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
      </header>
    );
  }

  if (sectors.length === 0) {
    return (
      <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Nenhum setor ou equipe</p>
          <Button className="btn-lime gap-2" size={isMobile ? "sm" : "default"}>
            <Plus className="w-4 h-4" />
            {!isMobile && "Criar Equipe"}
          </Button>
        </div>
      </header>
    );
  }

  // Month Selector Component (shared between mobile and desktop)
  const MonthSelector = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-1 bg-secondary rounded-lg ${compact ? 'p-0.5' : 'p-1'}`}>
      <Button
        variant="ghost"
        size="icon"
        className={compact ? "h-7 w-7" : "h-8 w-8"}
        onClick={goToPreviousMonth}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className={`${compact ? 'px-2 text-sm min-w-[100px]' : 'px-4 min-w-[140px]'} font-medium text-foreground text-center capitalize`}>
        {format(selectedMonth, compact ? "MMM/yy" : "MMMM yyyy", { locale: ptBR })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={compact ? "h-7 w-7" : "h-8 w-8"}
        onClick={goToNextMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );

  // Mobile Header
  if (isMobile) {
    return (
      <header className="bg-card border-b border-border">
        {/* Breadcrumb Row */}
        <div className="px-4 py-2 border-b border-border/50">
          <GestorBreadcrumbCompact />
        </div>
        
        {/* Selector Row */}
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          {/* Current Selection - Opens Sheet */}
          <Sheet open={selectorOpen} onOpenChange={setSelectorOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start gap-2 h-10 text-left">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground">
                    {selectedSector?.name || "Selecionar"}
                  </span>
                  <span className="text-sm font-medium truncate w-full">
                    {selectedGroup?.name || "Equipe"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>Selecionar Setor e Equipe</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                {/* Sector Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Setor
                  </label>
                  <Select 
                    value={selectedSectorId || ""} 
                    onValueChange={(val) => {
                      setSelectedSectorId(val);
                    }}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id} className="py-3">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{sector.name}</span>
                            {sector.institutionName && (
                              <span className="text-xs text-muted-foreground">
                                {sector.institutionName}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Equipe
                  </label>
                  <Select 
                    value={selectedGroupId || ""} 
                    onValueChange={(val) => {
                      setSelectedGroupId(val);
                      setSelectorOpen(false);
                    }}
                    disabled={groups.length === 0}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder={groups.length === 0 ? "Nenhuma equipe" : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id} className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{group.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {group.memberCount}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Month Selector - Compact */}
          <MonthSelector compact />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card border-b border-border">
      {/* Breadcrumb Row */}
      <div className="px-6 py-3 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
        <GestorBreadcrumb />
        {showThemeToggle && <ThemeToggle variant="icon" />}
      </div>
      
      {/* Selectors Row */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Cascading Selectors: Sector → Team */}
          <div className="flex items-center gap-3">
            {/* Sector Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedSectorId || ""} onValueChange={setSelectedSectorId}>
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{sector.name}</span>
                        {sector.institutionName && (
                          <span className="text-xs text-muted-foreground">
                            {sector.institutionName}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Separator */}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />

            {/* Team Selector */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={selectedGroupId || ""} 
                onValueChange={setSelectedGroupId}
                disabled={groups.length === 0}
              >
                <SelectTrigger className="w-[220px] bg-background">
                  <SelectValue placeholder={groups.length === 0 ? "Nenhuma equipe" : "Selecione uma equipe"} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.memberCount}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroup && (
              <span className="text-sm text-muted-foreground ml-2">
                {selectedGroup.memberCount} membros
              </span>
            )}
          </div>

          {/* Month Selector */}
          <MonthSelector />
        </div>
      </div>
    </header>
  );
}
