import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSectors } from "@/hooks/useSectors";
import { useSubscriptionLimits } from "@/hooks/subscription/useSubscriptionLimits.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "@/services/group/GroupService.ts";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedSectorId?: string;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  preselectedSectorId,
}: CreateTeamDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuthContext();
  const { data: sectors = [], isLoading: loadingSectors } = useSectors();
  const { data: limits, isLoading: loadingLimits } = useSubscriptionLimits();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sectorId, setSectorId] = useState(preselectedSectorId || "");

  useEffect(() => {
    if (preselectedSectorId) {
      setSectorId(preselectedSectorId);
    }
  }, [preselectedSectorId]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const actualSectorId = sectorId === "none" ? "" : sectorId;
  const canCreate = actualSectorId
    ? limits?.canCreateTeam(actualSectorId) !== false
    : true;
  const remainingTeams = actualSectorId ? limits?.remainingTeams(actualSectorId) : null;
  const hasLimit = remainingTeams !== null;

  const createTeamMutation = useMutation({
    mutationFn: async ({ name, description, sectorId }: { name: string; description?: string; sectorId?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Assuming groupService is imported and available
      await groupService.createTeam({
        name,
        description,
        sectorId: sectorId || null,
        userId: user.id
      });
    },
    onSuccess: () => {
      toast.success("Equipe criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["gestor-managed-groups"] });
      // Also invalidate stats or other related queries if needed
      queryClient.invalidateQueries({ queryKey: ["subscription-limits"] });
      queryClient.invalidateQueries({ queryKey: ["institution-stats"] });

      setName("");
      setDescription("");
      setSectorId("none"); // Using `setSectorId` as per component state
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error creating team:", error);
      toast.error("Erro ao criar equipe");
    },
  });

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (sectorId && !canCreate) return;

    const actualSectorId = sectorId === "none" ? undefined : sectorId;
    await createTeamMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      sectorId: actualSectorId,
    });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    if (!preselectedSectorId) {
      setSectorId("");
    }
  };

  const isSubmitting = createTeamMutation.isPending;
  const title = "Criar Nova Equipe";
  const descriptionText = "Crie uma equipe para organizar médicos e gerenciar escalas.";

  const content = (
    <>
      {sectorId && !canCreate && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Limite de equipes atingido ({limits?.maxTeamsPerSector}).
            Faça upgrade para criar mais.
          </AlertDescription>
        </Alert>
      )}

      {sectorId && canCreate && hasLimit && (
        <Alert className="mb-4">
          <AlertDescription className="text-sm">
            Restam <strong>{remainingTeams}</strong> equipe(s) neste setor.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="teamSector">Setor (opcional)</Label>
          <Select value={sectorId} onValueChange={setSectorId}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione um setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem setor</SelectItem>
              {loadingSectors ? (
                <div className="p-2 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id} className="py-3">
                    <div className="flex flex-col items-start">
                      <span>{sector.name}</span>
                      {sector.institution?.name && (
                        <span className="text-xs text-muted-foreground">
                          {sector.institution.name}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teamName">Nome da equipe *</Label>
          <Input
            id="teamName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Equipe UTI - Hospital São Lucas"
            disabled={sectorId && !canCreate}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="teamDescription">Descrição (opcional)</Label>
          <Textarea
            id="teamDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a equipe..."
            disabled={sectorId && !canCreate}
            rows={3}
          />
        </div>
      </div>
    </>
  );

  const isDisabled = !name.trim() || isSubmitting || !!(sectorId && !canCreate) || loadingLimits;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{descriptionText}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {content}
          </div>
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              className="btn-lime flex-1"
              onClick={handleSubmit}
              disabled={isDisabled}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {content}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="btn-lime"
            onClick={handleSubmit}
            disabled={isDisabled}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
