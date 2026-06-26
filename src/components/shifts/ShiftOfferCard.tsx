import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MapPin,
  Clock,
  Banknote,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  Check,
  Users,
  Calendar,
  Download,
  AlertTriangle,
  UsersRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shift } from "@/hooks/useShifts";
import { addToGoogleCalendar, downloadICSFile } from "@/lib/googleCalendar";
import { formatCurrency } from "@/utils/numberFormatter";

interface ShiftOfferCardProps {
  shift: Shift;
  onApply: (shiftId: string) => void;
  isOwner?: boolean;
  loading?: boolean;
}

const paymentTypeLabels = {
  NR: "No Recebimento",
  AC: "A Combinar",
  AV: "À Vista",
};

const paymentTypeColors = {
  NR: "bg-blue-100 text-blue-700",
  AC: "bg-purple-100 text-purple-700",
  AV: "bg-emerald-100 text-emerald-700",
};

export function ShiftOfferCard({
  shift,
  onApply,
  isOwner,
  loading,
}: ShiftOfferCardProps) {
  const [expanded, setExpanded] = useState(false);

  const duration = differenceInHours(shift.end_time, shift.start_time);
  const formattedDate = format(shift.start_time, "dd MMM", { locale: ptBR });
  const dayOfWeek = format(shift.start_time, "EEEE", { locale: ptBR });
  const startTime = format(shift.start_time, "HH:mm");
  const endTime = format(shift.end_time, "HH:mm");

  const isScaleHole = shift.source === "scale_hole";

  const handleApply = () => {
    if (!shift.user_has_applied && !isOwner) {
      onApply(shift.id);
    }
  };

  const openMaps = () => {
    if (shift.maps_url) {
      window.open(shift.maps_url, "_blank");
    } else if (shift.location && shift.city && shift.state) {
      const query = encodeURIComponent(
        `${shift.location}, ${shift.city}, ${shift.state}`,
      );
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank",
      );
    }
  };

  const getLocationString = () => {
    const parts = [shift.location, shift.city, shift.state].filter(Boolean);
    return parts.join(", ");
  };

  const handleAddToCalendar = () => {
    addToGoogleCalendar({
      title: shift.title,
      description:
        shift.description ||
        `Agendamento: ${shift.category}\nValor: ${shift.value ? formatCurrency(shift.value) : "A combinar"}\nPagamento: ${paymentTypeLabels[shift.payment_type]}`,
      location: getLocationString(),
      startTime: shift.start_time,
      endTime: shift.end_time,
    });
  };

  const handleDownloadICS = () => {
    downloadICSFile({
      title: shift.title,
      description:
        shift.description ||
        `Agendamento: ${shift.category}\nValor: ${shift.value ? formatCurrency(shift.value) : "A combinar"}\nPagamento: ${paymentTypeLabels[shift.payment_type]}`,
      location: getLocationString(),
      startTime: shift.start_time,
      endTime: shift.end_time,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-xl border shadow-sm overflow-hidden",
        "hover:shadow-md transition-shadow",
        isScaleHole
          ? "border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10"
          : "border-border",
      )}
    >
      {/* Scale Hole Banner */}
      {isScaleHole && (
        <div className="bg-amber-100 dark:bg-amber-900/30 px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Furo de Escala
            </span>
            {shift.group_name && (
              <>
                <span className="text-amber-400">•</span>
                <div className="flex items-center gap-1">
                  <UsersRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {shift.group_name}
                  </span>
                </div>
              </>
            )}
            <Badge
              variant="outline"
              className="ml-auto text-[10px] border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400"
            >
              Exclusivo para equipe
            </Badge>
          </div>
        </div>
      )}
      {/* Compact View */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base line-clamp-1">
              {shift.title}
            </h3>
            <button
              onClick={openMaps}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mt-0.5"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">
                {shift.location || "Local não informado"}
                {shift.city && `, ${shift.city}`}
                {shift.state && ` - ${shift.state}`}
              </span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
            </button>
          </div>
          <div className="text-right shrink-0 ml-3">
            <span className="text-xs text-muted-foreground capitalize">
              {dayOfWeek}
            </span>
            <div className="text-sm font-semibold text-foreground">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
            {shift.category}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
            {duration}h
          </span>
          {shift.value && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              {formatCurrency(shift.value)}
            </span>
          )}
          <span
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-full",
              paymentTypeColors[shift.payment_type],
            )}
          >
            {shift.payment_type}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Menos detalhes
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Ver detalhes
              </>
            )}
          </Button>

          <div className="flex-1" />

          {shift.applications_count !== undefined &&
            shift.applications_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {shift.applications_count}
              </span>
            )}

          {isOwner ? (
            <span className="text-xs text-muted-foreground px-3 py-1.5 bg-muted rounded-lg">
              Sua oferta
            </span>
          ) : shift.user_has_applied ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              Candidatado
            </span>
          ) : (
            <Button
              size="sm"
              className="btn-lime"
              onClick={handleApply}
              disabled={loading}
            >
              Assumir
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
              {/* Time Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Horário: </span>
                    <span className="font-medium text-foreground">
                      {startTime} - {endTime}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Pagamento: </span>
                    <span className="font-medium text-foreground">
                      {paymentTypeLabels[shift.payment_type]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {shift.description && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    {shift.description}
                  </p>
                </div>
              )}

              {/* Creator Info */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Publicado por: </span>
                  <span className="font-medium text-foreground">
                    {shift.creator_name}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToCalendar}
                    className="text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Google Agenda
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadICS}
                    className="text-xs text-muted-foreground"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    .ICS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openMaps}
                    className="text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    Maps
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
