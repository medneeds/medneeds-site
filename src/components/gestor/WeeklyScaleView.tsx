import { useMemo, useCallback, memo } from "react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isToday, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { WeeklySlotCard } from "./WeeklySlotCard";
import type { ScaleSlot, GroupMember } from "@/hooks/useScales";

interface WeeklyScaleViewProps {
  selectedMonth: Date;
  selectedWeek: Date;
  slots: ScaleSlot[];
  members: GroupMember[];
  onSlotClick: (slot: ScaleSlot) => void;
  onAddSlot: (date: Date) => void;
  onEditSlot: (slot: ScaleSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onAssignMember: (slotId: string, userId: string | null, assignmentId?: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

// Day column component
const DayColumn = memo(function DayColumn({
  date,
  daySlots,
  members,
  isCurrentDay,
  isCurrentMonth,
  onSlotClick,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onRemoveMember,
}: {
  date: Date;
  daySlots: ScaleSlot[];
  members: GroupMember[];
  isCurrentDay: boolean;
  isCurrentMonth: boolean;
  onSlotClick: (slot: ScaleSlot) => void;
  onAddSlot: (date: Date) => void;
  onEditSlot: (slot: ScaleSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onRemoveMember: (slotId: string, assignmentId?: string) => void;
}) {
  const totalSlots = daySlots.length;
  const filledSlots = daySlots.filter((s) => s.assignments?.length > 0 || s.userId).length;
  const vacantSlots = totalSlots - filledSlots;

  return (
    <div
      className={cn(
        "flex flex-col min-w-[200px] flex-1 border-r border-border last:border-r-0",
        !isCurrentMonth && "opacity-50"
      )}
    >
      {/* Day header */}
      <div
        className={cn(
          "sticky top-0 z-10 px-3 py-2.5 border-b border-border bg-card/95 backdrop-blur-sm",
          isCurrentDay && "bg-accent/10"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium uppercase tracking-wide",
                isCurrentDay ? "text-accent" : "text-muted-foreground"
              )}
            >
              {format(date, "EEE", { locale: ptBR })}
            </span>
            <span
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold",
                isCurrentDay
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground"
              )}
            >
              {format(date, "d")}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Stats */}
            {totalSlots > 0 && (
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] h-5 px-1.5",
                    filledSlots === totalSlots
                      ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300"
                  )}
                >
                  {filledSlots}/{totalSlots}
                </Badge>
              </div>
            )}

            {/* Add button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onAddSlot(date)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Slots list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          <AnimatePresence mode="popLayout">
            {daySlots
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((slot, index) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <WeeklySlotCard
                    slot={slot}
                    members={members}
                    onSlotClick={onSlotClick}
                    onRemoveMember={onRemoveMember}
                    onEditSlot={onEditSlot}
                    onDeleteSlot={onDeleteSlot}
                  />
                </motion.div>
              ))}
          </AnimatePresence>

          {/* Empty state */}
          {daySlots.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 px-3 text-center"
            >
              <div
                onClick={() => onAddSlot(date)}
                className={cn(
                  "w-full py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg",
                  "hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer",
                  "flex flex-col items-center gap-2"
                )}
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Adicionar plantão
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export function WeeklyScaleView({
  selectedMonth,
  selectedWeek,
  slots,
  members,
  onSlotClick,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onAssignMember,
  onPrevWeek,
  onNextWeek,
}: WeeklyScaleViewProps) {
  // Get week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedWeek]);

  // Pre-compute slots by day
  const slotsByDay = useMemo(() => {
    const map = new Map<string, ScaleSlot[]>();
    slots.forEach((slot) => {
      const existing = map.get(slot.date) || [];
      existing.push(slot);
      map.set(slot.date, existing);
    });
    return map;
  }, [slots]);

  const getSlotsForDay = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return slotsByDay.get(dateStr) || [];
    },
    [slotsByDay]
  );

  const handleRemoveMember = useCallback(
    (slotId: string, assignmentId?: string) => {
      onAssignMember(slotId, null, assignmentId);
    },
    [onAssignMember]
  );

  // Week range for header
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={onPrevWeek}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Anterior</span>
        </Button>

        <div className="text-center">
          <h3 className="text-sm font-semibold">
            {format(weekStart, "d", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Semana {format(selectedWeek, "w")} de {format(selectedWeek, "yyyy")}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={onNextWeek}
        >
          <span className="hidden sm:inline text-xs">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Columns container */}
      <div className="flex-1 flex overflow-x-auto min-h-0">
        {weekDays.map((date) => {
          const daySlots = getSlotsForDay(date);
          const isCurrentDay = isToday(date);
          const isCurrentMonth = isSameMonth(date, selectedMonth);

          return (
            <DayColumn
              key={format(date, "yyyy-MM-dd")}
              date={date}
              daySlots={daySlots}
              members={members}
              isCurrentDay={isCurrentDay}
              isCurrentMonth={isCurrentMonth}
              onSlotClick={onSlotClick}
              onAddSlot={onAddSlot}
              onEditSlot={onEditSlot}
              onDeleteSlot={onDeleteSlot}
              onRemoveMember={handleRemoveMember}
            />
          );
        })}
      </div>
    </div>
  );
}
