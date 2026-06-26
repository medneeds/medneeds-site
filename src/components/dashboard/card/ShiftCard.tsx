import { Chip } from "@/components/ui/Chip.tsx";
import { StatusBadge } from "@/components/ui/StatusBadge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar, Clock, DollarSign, MapPin } from "lucide-react";

export interface ShiftData {
  id: string;
  title: string;
  location: string;
  city: string;
  state: string;
  sector?: string;
  date: Date;
  startTime: string;
  duration: string; // "6h", "12h", "24h"
  value: number;
  payType: "NR" | "AC"; // Nota Retida / A Combinar
  status: "open" | "confirmed" | "pending" | "canceled" | "completed";
  modality?: string;
  clinicalArea?: string;
}

interface ShiftCardProps {
  shift: ShiftData;
  variant?: "default" | "compact";
  onAction?: (action: "assume" | "view" | "save") => void;
  className?: string;
}

export function ShiftCard({ shift, variant = "default", onAction, className }: ShiftCardProps) {
  const formattedDate = format(shift.date, "EEE, dd 'de' MMM", { locale: ptBR });
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(shift.value);

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "bg-card rounded-md p-4 border border-border shadow-card",
          onAction ? "hover:shadow-elevated hover:border-accent/30 transition-all cursor-pointer" : "",
          className
        )}
        onClick={() => onAction?.("view")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">
                {format(shift.date, "MMM", { locale: ptBR }).toUpperCase()}
              </span>
              <span className="text-lg font-bold text-foreground">
                {format(shift.date, "dd")}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{shift.title}</h4>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {shift.city}, {shift.state}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground">{formattedValue}</p>
            <div className="flex items-center gap-1 mt-1">
              <Chip variant={"purple"} size="sm">
                {shift.modality}
              </Chip>
              <Chip variant="blue" size="sm">{shift.duration}</Chip>
              <Chip variant={"green"} size="sm">
                {shift.clinicalArea}
              </Chip>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-md-5 border border-border shadow-card",
        "hover:shadow-elevated transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{shift.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" />
            {shift.location} • {shift.city}, {shift.state}
          </p>
        </div>
        <StatusBadge status={shift.status} />
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {shift.sector && <Chip variant="purple">{shift.sector}</Chip>}
        {shift.modality && <Chip variant="blue">{shift.modality}</Chip>}
        <Chip variant="green">{shift.duration}</Chip>
        <Chip variant={shift.payType === "NR" ? "lime" : "orange"}>{shift.payType}</Chip>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{shift.startTime}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <DollarSign className="w-4 h-4 text-accent" />
          <span>{formattedValue}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Button 
          className="flex-1 btn-lime" 
          onClick={() => onAction?.("assume")}
        >
          Assumir
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onAction?.("view")}
        >
          Ver detalhes
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onAction?.("save")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </Button>
      </div>
    </motion.div>
  );
}
