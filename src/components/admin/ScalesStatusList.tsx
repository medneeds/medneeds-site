import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScaleSummary } from "@/hooks/useScalesSummary";

interface ScalesStatusListProps {
  scales: ScaleSummary[];
  isLoading?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  published: { label: "Publicada", className: "bg-emerald-100 text-emerald-700" },
  archived: { label: "Arquivada", className: "bg-slate-100 text-slate-600" },
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function ScalesStatusList({ scales, isLoading }: ScalesStatusListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!scales.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma escala encontrada
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scales.map((scale, index) => {
        const status = statusConfig[scale.status] || statusConfig.draft;
        const coverageColor = 
          scale.coverage_percent >= 80 ? "bg-emerald-500" :
          scale.coverage_percent >= 50 ? "bg-amber-500" :
          "bg-red-500";
        const isEven = index % 2 === 0;

        return (
          <div
            key={scale.id}
            className={cn(
              "p-4 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-x-1 transition-all duration-200 cursor-pointer",
              isEven ? "bg-white" : "bg-slate-50/80"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm">
                  {monthNames[scale.month - 1]} {scale.year}
                </h4>
                <p className="text-xs text-muted-foreground">{scale.group_name}</p>
              </div>
              <Badge className={cn("text-xs", status.className)}>
                {status.label}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {scale.filled_slots}/{scale.total_slots} vagas preenchidas
                </span>
                <span className="font-medium">{scale.coverage_percent}%</span>
              </div>
              <Progress 
                value={scale.coverage_percent} 
                className="h-1.5" 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
