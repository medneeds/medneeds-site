import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil } from "lucide-react";
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

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

export function EditTeamDialog({
  open,
  onOpenChange,
  team,
}: EditTeamDialogProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (team && open) {
      setName(team.name);
      setDescription(team.description || "");
    }
  }, [team, open]);

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const data = await groupService.updateGroup(id, {
        name,
        description: description || undefined, // groupService handles null vs undefined? Usually Partial<Group>
        // But the service takes Partial<Group>. 
        // If the service doesn't handle setting null for description, we might need to check.
        // Usually undefined is ignored, null is set to null.
        // Let's pass undefined if empty string to be safe, or check service impl.
        // Assuming service passes payload directly to api.put.
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Equipe atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["gestor-managed-groups"] });
      queryClient.invalidateQueries({ queryKey: ["gestor-teams-details"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating team:", error);
      toast.error("Erro ao atualizar equipe");
    },
  });

  const handleSubmit = async () => {
    if (!name.trim() || !team) return;

    await updateTeamMutation.mutateAsync({
      id: team.id,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const isSubmitting = updateTeamMutation.isPending;
  const title = "Editar Equipe";
  const descriptionText = "Atualize as informações da equipe.";

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="editTeamName">Nome da equipe *</Label>
        <Input
          id="editTeamName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Equipe UTI - Hospital São Lucas"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="editTeamDescription">Descrição (opcional)</Label>
        <Textarea
          id="editTeamDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva a equipe..."
          rows={3}
        />
      </div>
    </div>
  );

  const footer = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 md:flex-none">
        Cancelar
      </Button>
      <Button
        className="btn-lime flex-1 md:flex-none"
        onClick={handleSubmit}
        disabled={!name.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Pencil className="w-4 h-4 mr-2" />
        )}
        Salvar
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
          <div className="px-4 pb-4 overflow-y-auto">
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
