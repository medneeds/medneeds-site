import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, MoreVertical, Pencil, Building2, FolderTree, Users, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useInstitutions, Institution } from "@/hooks/useSectors";
import { InstitutionManagementDialog } from "./InstitutionManagementDialog";
import { useQuery } from "@tanstack/react-query";
import { groupService } from "@/services/group/GroupService.ts";
import { useSubscriptionLimits } from "@/hooks/subscription/useSubscriptionLimits.tsx";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";

export function InstitutionsPanel() {
  const isMobile = useIsMobile();
  const { data: institutions = [], isLoading } = useInstitutions();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);

  const { data: limits, isLoading: loadingLimits } = useSubscriptionLimits();
  const canCreateInstitution = limits?.canCreateInstitution() !== false;
  const remainingInstitutions = limits?.remainingInstitutions();
  const hasLimit = remainingInstitutions !== null;

  // Get stats for each institution
  const { data: stats = {} } = useQuery({
    queryKey: ["institution-stats", institutions.map(i => i.id)],
    queryFn: async () => {
      if (!institutions.length) return {};

      const result: Record<string, { sectors: number; teams: number; members: number }> = {};

      const statsPromises = institutions.map(async (inst) => {
        const stats = await groupService.getInstitutionStats(inst.id);
        result[inst.id] = stats;
      });

      await Promise.all(statsPromises);

      return result;
    },
    enabled: institutions.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subscription Usage Banner */}
      {hasLimit && (
        <Alert className={`${!canCreateInstitution ? "border-destructive" : ""}`}>
          {!canCreateInstitution && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
            <span className="text-sm">
              <strong>Plano {limits?.planName || "Atual"}</strong>: {limits?.currentInstitutions || 0}/{limits?.maxInstitutions} instituições
            </span>
            <Progress
              value={((limits?.currentInstitutions || 0) / (limits?.maxInstitutions || 1)) * 100}
              className={isMobile ? "w-full h-2" : "w-32 h-2"}
            />
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Instituições</h3>
          <p className="text-sm text-muted-foreground">
            {isMobile ? "Hospitais e clínicas" : "Gerencie hospitais, clínicas e unidades de saúde"}
          </p>
        </div>
        <Button
          className={`btn-lime gap-2 ${isMobile ? 'w-full h-11' : ''}`}
          onClick={() => setCreateDialogOpen(true)}
          disabled={!canCreateInstitution || loadingLimits}
        >
          <Plus className="w-4 h-4" />
          Nova Instituição
        </Button>
      </div>

      {/* Institutions Grid */}
      {institutions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 md:py-12 text-center">
            <Building2 className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-foreground mb-1">Nenhuma instituição</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira instituição
            </p>
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar instituição
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {institutions.map((institution, index) => {
            const instStats = stats[institution.id] || { sectors: 0, teams: 0, members: 0 };

            return (
              <motion.div
                key={institution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                          {institution.logo_url ? (
                            <AvatarImage src={institution.logo_url} alt={institution.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {institution.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm md:text-base font-semibold truncate">
                            {institution.name}
                          </CardTitle>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingInstitution(institution)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3">
                      <div className="bg-secondary/50 rounded-lg p-2 text-center">
                        <FolderTree className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-base md:text-lg font-bold text-foreground">{instStats.sectors}</p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground">Setores</p>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-2 text-center">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-base md:text-lg font-bold text-foreground">{instStats.teams}</p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground">Equipes</p>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-2 text-center">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto text-muted-foreground mb-0.5" />
                        <p className="text-base md:text-lg font-bold text-foreground">{instStats.members}</p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground">Membros</p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      Trial Ativo
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <InstitutionManagementDialog
        open={createDialogOpen || !!editingInstitution}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingInstitution(null);
          }
        }}
        institution={editingInstitution}
      />
    </div>
  );
}
