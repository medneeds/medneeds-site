import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MoreVertical, Pencil, Trash2, Building2, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSectors, useDeleteSector, Sector } from "@/hooks/useSectors";
import { SectorManagementDialog } from "./SectorManagementDialog";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";

export function SectorsPanel() {
  const isMobile = useIsMobile();
  const { data: sectors = [], isLoading } = useSectors();
  const deleteSector = useDeleteSector();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [deletingSector, setDeletingSector] = useState<Sector | null>(null);

  const handleDelete = async () => {
    if (!deletingSector) return;
    await deleteSector.mutateAsync(deletingSector.id);
    setDeletingSector(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Setores</h3>
          <p className="text-sm text-muted-foreground">
            {isMobile ? "Organize equipes por área" : "Organize equipes por setores dentro das instituições"}
          </p>
        </div>
        <Button 
          className={`btn-lime gap-2 ${isMobile ? 'w-full h-11' : ''}`} 
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Novo Setor
        </Button>
      </div>

      {/* Sectors Grid */}
      {sectors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 md:py-12 text-center">
            <Building2 className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-foreground mb-1">Nenhum setor criado</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crie setores para organizar equipes
            </p>
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro setor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectors.map((sector, index) => (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-base font-semibold truncate">
                        {sector.name}
                      </CardTitle>
                      {sector.institution?.name && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{sector.institution.name}</span>
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSector(sector)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingSector(sector)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {sector.description && (
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                      {sector.description}
                    </p>
                  )}
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Users className="w-3 h-3" />
                    {sector.groupCount || 0} equipes
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <SectorManagementDialog
        open={createDialogOpen || !!editingSector}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingSector(null);
          }
        }}
        sector={editingSector}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSector} onOpenChange={() => setDeletingSector(null)}>
        <AlertDialogContent className={isMobile ? "max-w-[90vw]" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir setor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o setor <strong>{deletingSector?.name}</strong>?
              As equipes vinculadas ficarão sem setor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
            <AlertDialogCancel className={isMobile ? "w-full" : ""}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 ${isMobile ? "w-full" : ""}`}
            >
              {deleteSector.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
