import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameDay,
  isToday,
  isSameMonth,
  isBefore,
  startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReplicationCalendarProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  baseDate: Date;
}

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

export function ReplicationCalendar({ 
  selectedDates, 
  onDatesChange,
  baseDate 
}: ReplicationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(baseDate);
  const [expanded, setExpanded] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const weekStart = startOfWeek(currentDate);
  const weekDaysArray = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const today = startOfDay(new Date());

  const toggleDate = (date: Date) => {
    // Don't allow selecting past dates
    if (isBefore(date, today)) return;

    const exists = selectedDates.some(d => isSameDay(d, date));
    if (exists) {
      onDatesChange(selectedDates.filter(d => !isSameDay(d, date)));
    } else {
      onDatesChange([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const isSelected = (date: Date) => selectedDates.some(d => isSameDay(d, date));
  const isBaseDate = (date: Date) => isSameDay(date, baseDate);

  const renderDay = (day: Date, compact = false) => {
    const isPast = isBefore(day, today);
    const selected = isSelected(day);
    const base = isBaseDate(day);

    return (
      <button
        key={day.toISOString()}
        type="button"
        disabled={isPast}
        onClick={() => toggleDate(day)}
        className={cn(
          "rounded-full flex items-center justify-center font-medium transition-all",
          compact ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm",
          isPast && "opacity-30 cursor-not-allowed",
          !isPast && !selected && "hover:bg-muted",
          isToday(day) && !selected && "ring-1 ring-primary",
          selected && !base && "bg-primary text-primary-foreground",
          base && "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2",
          !isSameMonth(day, currentDate) && !selected && "text-muted-foreground/50"
        )}
      >
        {format(day, "d")}
      </button>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button 
          type="button"
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </span>
        <Button 
          type="button"
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, idx) => (
          <div 
            key={idx} 
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {expanded ? (
        // Full month view
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="w-9 h-9" />
          ))}
          {days.map((day) => renderDay(day))}
        </div>
      ) : (
        // Compact week view
        <div className="grid grid-cols-7 gap-1">
          {weekDaysArray.map((day) => renderDay(day, true))}
        </div>
      )}

      {/* Expand/Collapse Toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full mt-2 text-xs text-muted-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3 h-3 mr-1" />
            Ver menos
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3 mr-1" />
            Ver mês completo
          </>
        )}
      </Button>

      {/* Selected Count */}
      {selectedDates.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {selectedDates.length} data{selectedDates.length > 1 ? "s" : ""} selecionada{selectedDates.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
