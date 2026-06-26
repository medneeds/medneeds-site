import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ConfirmationsSummary, ConfirmationStatus } from "@/hooks/scale/useScaleConfirmations.tsx";

interface ConfirmationsPanelProps {
  summary: ConfirmationsSummary;
  isLoading?: boolean;
}

function ConfirmationItem({ confirmation }: { confirmation: ConfirmationStatus }) {
  const formattedDate = format(parseISO(confirmation.slotDate), "dd MMM", { locale: ptBR });
  const dayOfWeek = format(parseISO(confirmation.slotDate), "EEE", { locale: ptBR });

  const statusConfig = {
    confirmed: {
      icon: CheckCircle2,
      label: "Confirmado",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-500",
    },
    declined: {
      icon: XCircle,
      label: "Recusado",
      color: "text-red-600 bg-red-50 border-red-200",
      iconColor: "text-red-500",
    },
    published: {
      icon: Clock,
      label: "Aguardando",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      iconColor: "text-amber-500",
    },
    draft: {
      icon: Clock,
      label: "Rascunho",
      color: "text-muted-foreground bg-muted border-border",
      iconColor: "text-muted-foreground",
    },
  };

  const config = statusConfig[confirmation.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={confirmation.userAvatar} />
          <AvatarFallback className="text-xs">
            {confirmation.userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{confirmation.userName}</p>
          <p className="text-xs text-muted-foreground">
            <span className="capitalize">{dayOfWeek}</span> {formattedDate} • {confirmation.slotStartTime.slice(0, 5)}
            {confirmation.sector && ` • ${confirmation.sector}`}
          </p>
        </div>
      </div>
      <Badge 
        variant="outline" 
        className={cn("flex items-center gap-1 text-xs", config.color)}
      >
        <StatusIcon className={cn("h-3 w-3", config.iconColor)} />
        {config.label}
      </Badge>
    </div>
  );
}

export function ConfirmationsPanel({ summary, isLoading }: ConfirmationsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-4" />
        <div className="h-2 bg-muted rounded w-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (summary.total === 0) {
    return (
      <div className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-5 w-5" />
          <span>Nenhum médico atribuído nesta escala</span>
        </div>
      </div>
    );
  }

  const confirmationRate = Math.round((summary.confirmed / summary.total) * 100);
  const pendingConfirmations = summary.confirmations.filter(c => c.status === "published");
  const declinedConfirmations = summary.confirmations.filter(c => c.status === "declined");
  const confirmedConfirmations = summary.confirmations.filter(c => c.status === "confirmed");

  const visibleItems = expanded 
    ? summary.confirmations 
    : [...pendingConfirmations, ...declinedConfirmations].slice(0, 5);

  const hasMore = summary.confirmations.length > 5;

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header with stats */}
      <div className="p-5 border-b">
        <h3 className="font-semibold text-foreground mb-4">Confirmações da Equipe</h3>
        
        {/* Progress bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de confirmação</span>
            <span className="font-medium">{confirmationRate}%</span>
          </div>
          <Progress value={confirmationRate} className="h-2" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-bold">{summary.confirmed}</span>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400">Confirmados</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="font-bold">{summary.pending}</span>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400">Pendentes</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="font-bold">{summary.declined}</span>
            </div>
            <span className="text-xs text-red-700 dark:text-red-400">Recusados</span>
          </div>
        </div>
      </div>

      {/* List of confirmations */}
      <div className="p-3">
        {/* Priority: Show declined/pending first */}
        {summary.declined > 0 && !expanded && (
          <div className="px-2 py-1 mb-2">
            <span className="text-xs font-medium text-red-600">
              ⚠️ {summary.declined} recusa{summary.declined > 1 ? "s" : ""} - atenção necessária
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={expanded ? "expanded" : "collapsed"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {visibleItems.map((confirmation) => (
              <ConfirmationItem key={confirmation.assignmentId} confirmation={confirmation} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Show more button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Ver todos ({summary.total})
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
