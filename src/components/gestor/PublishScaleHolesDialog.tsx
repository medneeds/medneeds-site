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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Send, Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ScaleSlot } from "@/hooks/useScales";

interface PublishScaleHolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacantSlots: ScaleSlot[];
  onPublish: (slotIds: string[]) => void;
  isPublishing: boolean;
  groupName?: string;
}

export function PublishScaleHolesDialog({
  open,
  onOpenChange,
  vacantSlots,
  onPublish,
  isPublishing,
  groupName,
}: PublishScaleHolesDialogProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  const handleToggleSlot = (slotId: string) => {
    const next = new Set(selectedSlots);
    if (next.has(slotId)) {
      next.delete(slotId);
    } else {
      next.add(slotId);
    }
    setSelectedSlots(next);
  };

  const handleSelectAll = () => {
    if (selectedSlots.size === vacantSlots.length) {
      setSelectedSlots(new Set());
    } else {
      setSelectedSlots(new Set(vacantSlots.map((s) => s.id)));
    }
  };

  const handlePublish = () => {
    onPublish(Array.from(selectedSlots));
    setSelectedSlots(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Publicar Furos de Escala
          </DialogTitle>
          <DialogDescription>
            Selecione os plantões vagos que deseja publicar como ofertas para o grupo.
            Médicos do grupo poderão se candidatar a esses plantões.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Select all */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedSlots.size === vacantSlots.length && vacantSlots.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Selecionar todos ({vacantSlots.length})
              </Label>
            </div>
            <Badge variant="outline" className="text-amber-600">
              {selectedSlots.size} selecionados
            </Badge>
          </div>

          {/* Slots list */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {vacantSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedSlots.has(slot.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  onClick={() => handleToggleSlot(slot.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSlots.has(slot.id)}
                      onCheckedChange={() => handleToggleSlot(slot.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(slot.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {slot.startTime} - {slot.endTime}
                        </div>
                        {slot.sector && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {slot.sector}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {vacantSlots.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Não há plantões vagos nesta escala.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || selectedSlots.size === 0}
            className="btn-lime"
          >
            <Send className="h-4 w-4 mr-2" />
            {isPublishing
              ? "Publicando..."
              : `Publicar ${selectedSlots.size} ${selectedSlots.size === 1 ? "Oferta" : "Ofertas"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
