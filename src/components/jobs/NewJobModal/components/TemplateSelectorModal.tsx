import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { FileText, Trash2, Download, Loader2 } from "lucide-react";
import { templateService } from "@/config/app.ts";
import { useToast } from "@/hooks/ui/useToast.ts";
import type { JobTemplate } from "@/config/payload.types.ts";
import { Chip } from "@/components/ui/Chip.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";

interface TemplateSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: JobTemplate) => void;
}

export function TemplateSelectorModal({
  open,
  onClose,
  onSelectTemplate,
}: TemplateSelectorModalProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateService.getTemplates({
        page: 1,
        limit: 1000,
      });
      setTemplates(response.docs);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os modelos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = (template: JobTemplate) => {
    setJobToDelete(template);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!jobToDelete) return;

    setDeletingId(jobToDelete.id);
    setDeleteConfirmOpen(false);
    try {
      await templateService.deleteTemplate(jobToDelete.id);
      setTemplates((prev) => prev.filter((t) => t.id !== jobToDelete.id));
      toast({
        title: "Sucesso",
        description: "Modelo excluído com sucesso!",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o modelo.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setJobToDelete(null);
    }
  };

  const handleSelectTemplate = (template: JobTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const getTemplateTitle = (template: JobTemplate) => {
    if (typeof template.place === "object" && template.place?.name) {
      return template.place.name;
    }
    return "Local não definido";
  };

  const getTemplateSubtitle = (template: JobTemplate) => {
    if (typeof template.city === "object" && template.city) {
      return (template.city as any).label || (template.city as any).name || "";
    }
    return template.description || "";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Selecionar Modelo</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Carregando modelos...
              </p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-base font-semibold">
                Nenhum modelo encontrado
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Preencha o formulário e clique em "Salvar Modelo" para criar seu
                primeiro modelo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-card border rounded-lg p-4 transition-colors"
                >
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Modelo
                    </p>
                    <p className="font-medium text-sm">
                      {getTemplateTitle(template)}
                    </p>
                    {getTemplateSubtitle(template) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getTemplateSubtitle(template)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <div className="flex items-center gap-1 mt-1">
                      <Chip variant={"purple"} size="sm">
                        {typeof template.modality === "object" &&
                        template.modality?.name
                          ? template.modality?.name
                          : ""}
                      </Chip>
                      {template.durationInHours &&
                        template.durationInHours > 0 && (
                          <Chip variant="blue" size="sm">
                            {template.durationInHours}h
                          </Chip>
                        )}
                      <Chip variant={"green"} size="sm">
                        {typeof template.clinicalArea === "object" &&
                        template.clinicalArea?.name
                          ? template.clinicalArea.name
                          : ""}
                      </Chip>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground gap-1.5"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <Download className="w-4 h-4" />
                      Usar modelo
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteTemplate(template)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o modelo "
              {jobToDelete ? getTemplateTitle(jobToDelete) : ""}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirmed();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
