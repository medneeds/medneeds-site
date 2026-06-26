import { Button } from "@/components/ui/button";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: {
    id: string;
    name: string;
  } | null;
}

export function DeleteTeamDialog({
  open,
  onOpenChange,
  team,
}: DeleteTeamDialogProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      // Use the service helper that attempts to handle cascade deletion
      await groupService.deleteTeam(teamId);
    },
    onSuccess: () => {
      toast.success("Equipe excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["gestor-managed-groups"] });
      queryClient.invalidateQueries({ queryKey: ["gestor-teams-details"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-limits"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error deleting team:", error);
      toast.error("Erro ao excluir equipe. Verifique se você tem permissão.");
    },
  });

  const handleDelete = async () => {
    if (!team) return;
    await deleteTeamMutation.mutateAsync(team.id);
  };

  const isDeleting = deleteTeamMutation.isPending;
  const title = "Excluir Equipe";
  const descriptionText = `Tem certeza que deseja excluir a equipe "${team?.name}"?`;

  const content = (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Esta ação não pode ser desfeita.</strong> Todos os dados da equipe serão
        permanentemente removidos, incluindo escalas, mensagens e membros.
      </AlertDescription>
    </Alert>
  );

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isDeleting}
        className="flex-1 md:flex-none"
      >
        Cancelar
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex-1 md:flex-none"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 mr-2" />
        )}
        Excluir
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{descriptionText}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
          <DrawerFooter className="flex-row gap-2">
            {footer}
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
        <DialogFooter>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
