import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

export interface MobileShiftData {
  id: string;
  title: string;
  location: string;
  city: string;
  state: string;
  sector: string;
  date: Date;
  startTime: string;
  duration: string;
  value: number;
  payType: "NR" | "AC";
  status: "open" | "pending" | "confirmed" | "completed" | "canceled";
}

interface MobileShiftCardProps {
  shift: MobileShiftData;
  onClick?: () => void;
  showDate?: boolean;
}

export function MobileShiftCard({ shift, onClick, showDate = false }: MobileShiftCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const dateLabel = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (format(shift.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return `Hoje às ${shift.startTime}`;
    }
    if (format(shift.date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return `Amanhã às ${shift.startTime}`;
    }
    return format(shift.date, "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-4 border border-border shadow-sm",
        "active:scale-[0.98] transition-transform cursor-pointer"
      )}
    >
      <h4 className="font-semibold text-foreground text-base mb-1">
        {showDate ? dateLabel() : shift.startTime} - {shift.location}
      </h4>
      <p className="text-sm text-muted-foreground mb-3">
        {shift.city}, {shift.state}
      </p>
      
      <div className="flex flex-wrap gap-2">
        <Chip variant="green" size="sm">{shift.duration}</Chip>
        <Chip variant="blue" size="sm">{shift.sector}</Chip>
        <Chip variant="purple" size="sm">
          {formatCurrency(shift.value)} {shift.payType}
        </Chip>
      </div>
    </div>
  );
}
