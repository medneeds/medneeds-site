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
import { useInstitutions, useCreateSector, useUpdateSector, Sector } from "@/hooks/useSectors";
import { useSubscriptionLimits } from "@/hooks/subscription/useSubscriptionLimits.tsx";
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

interface SectorManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector?: Sector | null;
}

export function SectorManagementDialog({
  open,
  onOpenChange,
  sector,
}: SectorManagementDialogProps) {
  const isMobile = useIsMobile();
  const { data: institutions = [], isLoading: loadingInstitutions } = useInstitutions();
  const { data: limits, isLoading: loadingLimits } = useSubscriptionLimits();
  const createSector = useCreateSector();
  const updateSector = useUpdateSector();

  const [name, setName] = useState(sector?.name || "");
  const [description, setDescription] = useState(sector?.description || "");
  const [institutionId, setInstitutionId] = useState(sector?.institution_id || "");

  useEffect(() => {
    if (sector) {
      setName(sector.name || "");
      setDescription(sector.description || "");
      setInstitutionId(sector.institution_id || "");
    } else {
      resetForm();
    }
  }, [sector, open]);

  const isEditing = !!sector;
  const isSubmitting = createSector.isPending || updateSector.isPending;

  const canCreate = !isEditing && institutionId 
    ? limits?.canCreateSector(institutionId) !== false 
    : true;
  const remainingSectors = institutionId ? limits?.remainingSectors(institutionId) : null;
  const hasLimit = remainingSectors !== null;

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (isEditing && sector) {
      await updateSector.mutateAsync({
        id: sector.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } else {
      if (!institutionId) return;
      if (!canCreate) return;
      
      await createSector.mutateAsync({
        name: name.trim(),
        institution_id: institutionId,
        description: description.trim() || undefined,
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setInstitutionId("");
  };

  const title = isEditing ? "Editar Setor" : "Criar Novo Setor";
  const descriptionText = isEditing
    ? "Atualize as informações do setor."
    : "Crie um setor para organizar equipes.";

  const content = (
    <>
      {!isEditing && institutionId && !canCreate && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Limite de setores atingido ({limits?.maxSectorsPerInstitution}).
            Faça upgrade para criar mais.
          </AlertDescription>
        </Alert>
      )}

      {!isEditing && institutionId && canCreate && hasLimit && (
        <Alert className="mb-4">
          <AlertDescription className="text-sm">
            Restam <strong>{remainingSectors}</strong> setor(es) nesta instituição.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {!isEditing && (
          <div className="space-y-2">
            <Label htmlFor="institution">Instituição *</Label>
            <Select value={institutionId} onValueChange={setInstitutionId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione a instituição" />
              </SelectTrigger>
              <SelectContent>
                {loadingInstitutions ? (
                  <div className="p-2 text-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : institutions.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    Nenhuma instituição disponível
                  </div>
                ) : (
                  institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id} className="py-3">
                      {inst.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="sectorName">Nome do setor *</Label>
          <Input
            id="sectorName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: UTI Adulto, Emergência"
            disabled={!isEditing && institutionId && !canCreate}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectorDescription">Descrição (opcional)</Label>
          <Textarea
            id="sectorDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o setor..."
            disabled={!isEditing && institutionId && !canCreate}
            rows={3}
          />
        </div>
      </div>
    </>
  );

  const footer = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 md:flex-none">
        Cancelar
      </Button>
      <Button
        className="btn-lime flex-1 md:flex-none"
        onClick={handleSubmit}
        disabled={
          !name.trim() || 
          (!isEditing && !institutionId) || 
          isSubmitting || 
          (!isEditing && !canCreate) ||
          loadingLimits
        }
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isEditing ? "Salvar" : "Criar"}
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
