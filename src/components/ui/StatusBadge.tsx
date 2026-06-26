import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, Clock, XCircle, AlertCircle, CircleDot } from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
  {
    variants: {
      status: {
        open: "bg-lime-muted text-lime-dark",
        confirmed: "bg-emerald-100 text-emerald-700",
        pending: "bg-amber-100 text-amber-700",
        canceled: "bg-red-100 text-red-700",
        completed: "bg-slate-100 text-slate-600",
        paid: "bg-emerald-100 text-emerald-700",
        unpaid: "bg-amber-100 text-amber-700",
      },
    },
    defaultVariants: {
      status: "open",
    },
  }
);

const statusIcons = {
  open: CircleDot,
  confirmed: CheckCircle2,
  pending: Clock,
  canceled: XCircle,
  completed: CheckCircle2,
  paid: CheckCircle2,
  unpaid: AlertCircle,
};

const statusLabels = {
  open: "Disponível",
  confirmed: "Confirmado",
  pending: "Pendente",
  canceled: "Cancelado",
  completed: "Concluído",
  paid: "Pago",
  unpaid: "Não pago",
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  showIcon?: boolean;
  label?: string;
}

export function StatusBadge({ 
  className, 
  status = "open", 
  showIcon = true, 
  label,
  ...props 
}: StatusBadgeProps) {
  const Icon = status ? statusIcons[status] : statusIcons.open;
  const displayLabel = label || (status ? statusLabels[status] : statusLabels.open);
  
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {displayLabel}
    </span>
  );
}
