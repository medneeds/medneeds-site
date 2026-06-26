import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RecentShift } from "@/hooks/shifts/useRecentShifts.tsx";
import { formatCurrency } from "@/utils/numberFormatter";

interface ShiftsFeedProps {
  shifts: RecentShift[];
  isLoading?: boolean;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  public: {
    label: "Aberto",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  applied: {
    label: "Candidaturas",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  assigned: {
    label: "Atribuído",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  completed: {
    label: "Concluído",
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  canceled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

export function ShiftsFeed({ shifts, isLoading }: ShiftsFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!shifts.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum resultado recente
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {shifts.map((shift, index) => {
        const status = statusLabels[shift.status] || statusLabels.public;
        const startDate = new Date(shift.start_time);
        const endDate = new Date(shift.end_time);
        const isEven = index % 2 === 0;

        return (
          <div
            key={shift.id}
            className={cn(
              "p-4 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-x-1 transition-all duration-200 cursor-pointer",
              isEven ? "bg-white" : "bg-slate-50/80",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">
                    {shift.title || shift.specialty}
                  </h4>
                  <Badge className={cn("text-xs shrink-0", status.className)}>
                    {status.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {shift.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {shift.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(startDate, "dd/MM HH:mm", { locale: ptBR })} -{" "}
                    {format(endDate, "HH:mm", { locale: ptBR })}
                  </span>
                  {shift.applications_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {shift.applications_count} candidatura
                      {shift.applications_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  {shift.value && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(shift.value)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1.5">
                  Criado por {shift.creator_name || "Usuário"} •{" "}
                  {format(new Date(shift.created_at), "dd/MM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
