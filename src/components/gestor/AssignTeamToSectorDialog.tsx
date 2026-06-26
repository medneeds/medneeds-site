import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useSectors, useUpdateGroupSector } from "@/hooks/useSectors";

interface AssignTeamToSectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: {
    id: string;
    name: string;
    currentSectorId?: string;
  } | null;
}

export function AssignTeamToSectorDialog({
  open,
  onOpenChange,
  team,
}: AssignTeamToSectorDialogProps) {
  const { data: sectors = [], isLoading: loadingSectors } = useSectors();
  const updateGroupSector = useUpdateGroupSector();

  const [selectedSectorId, setSelectedSectorId] = useState(team?.currentSectorId || "");

  const handleSubmit = async () => {
    if (!team) return;

    await updateGroupSector.mutateAsync({
      groupId: team.id,
      sectorId: selectedSectorId === "none" ? null : selectedSectorId || null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Equipe a Setor</DialogTitle>
          <DialogDescription>
            Vincule a equipe <strong>{team?.name}</strong> a um setor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sector">Setor</Label>
            <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Sem setor</span>
                </SelectItem>
                {loadingSectors ? (
                  <div className="p-2 text-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      <div className="flex flex-col">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="btn-lime"
            onClick={handleSubmit}
            disabled={updateGroupSector.isPending}
          >
            {updateGroupSector.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
