import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, AlertTriangle } from "lucide-react";
import type { ScaleSlot } from "@/hooks/useScales";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: ScaleSlot[];
  onPublish: (notes?: string) => void;
  isPublishing: boolean;
}

export function PublishDialog({
  open,
  onOpenChange,
  slots,
  onPublish,
  isPublishing,
}: PublishDialogProps) {
  const [notes, setNotes] = useState("");

  const unassignedSlots = slots.filter((s) => !s.userId);
  const assignedSlots = slots.filter((s) => s.userId);

  const handlePublish = () => {
    onPublish(notes || undefined);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Publicar Escala
          </DialogTitle>
          <DialogDescription>
            Ao publicar, todos os membros do grupo serão notificados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-center">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {assignedSlots.length}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Plantões atribuídos
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-center">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {unassignedSlots.length}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Plantões vagos
              </p>
            </div>
          </div>

          {/* Warning for unassigned slots */}
          {unassignedSlots.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Existem plantões sem médico atribuído
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  Os membros poderão visualizar e se candidatar a esses plantões.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas da publicação (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Escala ajustada para cobrir feriado do dia 15..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="btn-lime"
          >
            {isPublishing ? "Publicando..." : "Publicar Escala"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
