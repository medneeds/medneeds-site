import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PublishSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftData: {
    category: string;
    location: string;
    city: string;
    state: string;
    date: string;
    startTime: string;
    duration: number;
    value: string;
    paymentType: string;
    maxApplicants: number;
  } | null;
}

const paymentTypeColors: Record<string, string> = {
  NR: "bg-blue-100 text-blue-700",
  AC: "bg-purple-100 text-purple-700",
  AV: "bg-emerald-100 text-emerald-700",
};

export function PublishSuccessDialog({ open, onOpenChange, shiftData }: PublishSuccessDialogProps) {
  const navigate = useNavigate();

  if (!shiftData) return null;

  const startDateTime = new Date(`${shiftData.date}T${shiftData.startTime}`);
  const formattedDate = format(startDateTime, "dd MMM", { locale: ptBR });
  const dayOfWeek = format(startDateTime, "EEEE", { locale: ptBR });
  const endTime = format(new Date(startDateTime.getTime() + shiftData.duration * 60 * 60 * 1000), "HH:mm");

  const autoTitle = `Agendamento ${shiftData.category}${shiftData.location ? ` - ${shiftData.location}` : ""}`;

  const handleViewOffers = () => {
    onOpenChange(false);
    navigate("/ofertas");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Oferta publicada</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center text-center py-4">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-foreground mb-1"
          >
            Oferta publicada com sucesso!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-muted-foreground mb-6"
          >
            Sua oferta já está disponível na timeline
          </motion.p>

          {/* Mini Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-card rounded-xl border border-border shadow-sm p-4 mb-6 text-left"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                  {autoTitle}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {shiftData.location || "Local"}
                    {shiftData.city && `, ${shiftData.city}`}
                    {shiftData.state && ` - ${shiftData.state}`}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[10px] text-muted-foreground capitalize">{dayOfWeek}</span>
                <div className="text-xs font-semibold text-foreground">{formattedDate}</div>
              </div>
            </div>

            {/* Pills */}
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
                {shiftData.duration}h
              </span>
              {shiftData.value && shiftData.value !== "R$ 0,00" && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
                  {shiftData.value}
                </span>
              )}
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-full",
                paymentTypeColors[shiftData.paymentType] || "bg-muted text-muted-foreground"
              )}>
                {shiftData.paymentType}
              </span>
              {shiftData.maxApplicants > 1 && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5" />
                  {shiftData.maxApplicants}
                </span>
              )}
            </div>

            {/* Time */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
              <Clock className="w-3 h-3" />
              <span className="font-medium text-foreground">
                {shiftData.startTime} - {endTime}
              </span>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 w-full"
          >
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Publicar outra
            </Button>
            <Button
              className="flex-1 btn-lime"
              onClick={handleViewOffers}
            >
              Ver ofertas
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
