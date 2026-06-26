import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { useCreateInstitution, Institution } from "@/hooks/useSectors";
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

interface InstitutionManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution?: Institution | null;
}

export function InstitutionManagementDialog({
  open,
  onOpenChange,
  institution,
}: InstitutionManagementDialogProps) {
  const isMobile = useIsMobile();
  const createInstitution = useCreateInstitution();
  const { data: limits, isLoading: loadingLimits } = useSubscriptionLimits();

  const [name, setName] = useState(institution?.name || "");
  const [logoUrl, setLogoUrl] = useState(institution?.logo_url || "");

  useEffect(() => {
    if (institution) {
      setName(institution.name || "");
      setLogoUrl(institution.logo_url || "");
    } else {
      resetForm();
    }
  }, [institution, open]);

  const isEditing = !!institution;
  const isSubmitting = createInstitution.isPending;
  
  const canCreate = !isEditing && limits?.canCreateInstitution() !== false;
  const remainingInstitutions = limits?.remainingInstitutions();
  const hasLimit = remainingInstitutions !== null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!isEditing && !canCreate) return;

    await createInstitution.mutateAsync({
      name: name.trim(),
      logo_url: logoUrl.trim() || undefined,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setLogoUrl("");
  };

  const title = isEditing ? "Editar Instituição" : "Criar Nova Instituição";
  const description = isEditing
    ? "Atualize as informações da instituição."
    : "Crie uma instituição para organizar setores e equipes.";

  const content = (
    <>
      {!isEditing && !canCreate && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Limite de instituições atingido ({limits?.maxInstitutions}).
            Faça upgrade para criar mais.
          </AlertDescription>
        </Alert>
      )}

      {!isEditing && canCreate && hasLimit && (
        <Alert className="mb-4">
          <AlertDescription className="text-sm">
            Restam <strong>{remainingInstitutions}</strong> instituição(ões) no seu plano.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="institutionName">Nome da instituição *</Label>
          <Input
            id="institutionName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Hospital São Lucas"
            disabled={!isEditing && !canCreate}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">URL do logo (opcional)</Label>
          <Input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            disabled={!isEditing && !canCreate}
            className="h-12"
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
        disabled={!name.trim() || isSubmitting || (!isEditing && !canCreate) || loadingLimits}
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
            <DrawerDescription>{description}</DrawerDescription>
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
          <DialogDescription>{description}</DialogDescription>
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
