import { useState, useMemo, useCallback, memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format, isToday, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DroppableSlot } from "./DroppableSlot";
import type { ScaleSlot, GroupMember } from "@/hooks/useScales";

interface DndScaleCalendarProps {
  daysInMonth: Date[];
  selectedMonth: Date;
  slots: ScaleSlot[];
  members: GroupMember[];
  onDayClick: (date: Date) => void;
  onSlotClick: (slot: ScaleSlot) => void;
  getSlotsForDay: (date: Date) => ScaleSlot[];
  onAssignMember: (slotId: string, userId: string | null, assignmentId?: string) => void;
}

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Memoized day cell to prevent re-renders
const DayCell = memo(function DayCell({
  date,
  daySlots,
  isCurrentDay,
  isWeekend,
  isLastColumn,
  members,
  onDayClick,
  onSlotClick,
  handleRemoveMember,
}: {
  date: Date;
  daySlots: ScaleSlot[];
  isCurrentDay: boolean;
  isWeekend: boolean;
  isLastColumn: boolean;
  members: GroupMember[];
  onDayClick: (date: Date) => void;
  onSlotClick: (slot: ScaleSlot) => void;
  handleRemoveMember: (slotId: string, assignmentId?: string) => void;
}) {
  return (
    <div
      className={cn(
        "min-h-[90px] border-b border-r border-border p-1 transition-colors relative group",
        isWeekend && "bg-muted/10",
        isCurrentDay && "bg-accent/5",
        isLastColumn && "border-r-0"
      )}
    >
      {/* Day number + add button */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-semibold",
            isCurrentDay && "bg-accent text-accent-foreground",
            !isCurrentDay && isWeekend && "text-muted-foreground"
          )}
        >
          {format(date, "d")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDayClick(date)}
        >
          <Plus className="h-2.5 w-2.5" />
        </Button>
      </div>

      {/* Slots - show up to 4 */}
      <div className="space-y-0.5 overflow-y-auto max-h-[calc(100%-24px)]">
        {daySlots.slice(0, 4).map((slot) => (
          <DroppableSlot
            key={slot.id}
            slot={slot}
            member={null}
            members={members}
            onSlotClick={onSlotClick}
            onRemoveMember={handleRemoveMember}
          />
        ))}

        {daySlots.length > 4 && (
          <button
            onClick={() => onDayClick(date)}
            className="text-[9px] text-muted-foreground hover:text-accent w-full text-center py-0.5"
          >
            +{daySlots.length - 4} mais
          </button>
        )}

        {daySlots.length === 0 && (
          <div 
            onClick={() => onDayClick(date)}
            className="h-10 border border-dashed border-border rounded flex items-center justify-center text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:border-accent/50 hover:text-accent"
          >
            + Adicionar
          </div>
        )}
      </div>
    </div>
  );
});

export function DndScaleCalendar({
  daysInMonth,
  selectedMonth,
  slots,
  members,
  onDayClick,
  onSlotClick,
  getSlotsForDay,
  onAssignMember,
}: DndScaleCalendarProps) {
  // Calculate padding for first week - memoized
  const { startWeekDay, paddingDays } = useMemo(() => {
    if (!daysInMonth.length) return { startWeekDay: 0, paddingDays: [] };
    const firstDay = daysInMonth[0];
    const startWeekDay = getDay(firstDay);
    return {
      startWeekDay,
      paddingDays: Array.from({ length: startWeekDay }, (_, i) => i),
    };
  }, [daysInMonth]);

  // Pre-compute slots by day for O(1) lookup
  const slotsByDay = useMemo(() => {
    const map = new Map<string, ScaleSlot[]>();
    slots.forEach(slot => {
      const existing = map.get(slot.date) || [];
      existing.push(slot);
      map.set(slot.date, existing);
    });
    return map;
  }, [slots]);

  const getOptimizedSlotsForDay = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return slotsByDay.get(dateStr) || [];
  }, [slotsByDay]);

  const handleRemoveMember = useCallback((slotId: string, assignmentId?: string) => {
    onAssignMember(slotId, null, assignmentId);
  }, [onAssignMember]);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full flex flex-col">
      {/* Week days header */}
      <div className="grid grid-cols-7 bg-secondary/50 border-b border-border shrink-0">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-[10px] font-semibold uppercase tracking-wider",
              index === 0 || index === 6 ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - takes remaining space */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {/* Padding for first week */}
        {paddingDays.map((idx) => (
          <div
            key={`padding-${idx}`}
            className="bg-muted/20 border-b border-r border-border"
          />
        ))}

        {/* Days */}
        {daysInMonth.map((date, index) => {
          const daySlots = getOptimizedSlotsForDay(date);
          const isCurrentDay = isToday(date);
          const dayOfWeek = getDay(date);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isLastColumn = (startWeekDay + index + 1) % 7 === 0;

          return (
            <DayCell
              key={format(date, "yyyy-MM-dd")}
              date={date}
              daySlots={daySlots}
              isCurrentDay={isCurrentDay}
              isWeekend={isWeekend}
              isLastColumn={isLastColumn}
              members={members}
              onDayClick={onDayClick}
              onSlotClick={onSlotClick}
              handleRemoveMember={handleRemoveMember}
            />
          );
        })}
      </div>
    </div>
  );
}
