import { useDroppable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScaleSlot, GroupMember, SlotAssignment } from "@/hooks/useScales";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DroppableSlotProps {
  slot: ScaleSlot;
  member: GroupMember | null;
  members?: GroupMember[];
  onSlotClick: (slot: ScaleSlot) => void;
  onRemoveMember: (slotId: string, assignmentId?: string) => void;
}

export function DroppableSlot({ slot, member, members = [], onSlotClick, onRemoveMember }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot.id}`,
    data: {
      type: "slot",
      slot,
    },
  });

  const assignments = slot.assignments || [];
  const hasAssignments = assignments.length > 0;
  const isVacant = !hasAssignments;
  const maxDoctors = slot.maxDoctors || 1;
  const vacantCount = Math.max(0, maxDoctors - assignments.length);

  // Format time compactly (07:00 -> 07h)
  const formatTimeCompact = (time: string) => {
    return time?.slice(0, 5).replace(":", "h") || "";
  };

  const timeDisplay = `${formatTimeCompact(slot.startTime)}-${formatTimeCompact(slot.endTime)}`;

  // Get all doctor names for tooltip
  const allDoctorNames = assignments.map(a => a.userName || "Médico").join(", ");

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        onClick={() => onSlotClick(slot)}
        className={cn(
          "px-1.5 py-1 rounded text-[10px] cursor-pointer transition-all group relative",
          "border border-dashed",
          isOver && "border-accent bg-accent/20 scale-105",
          hasAssignments 
            ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300/60 dark:border-emerald-700/60 border-solid"
            : "bg-amber-50/80 dark:bg-amber-900/20 border-amber-300/60 dark:border-amber-600/60",
          !isOver && "hover:border-accent/50"
        )}
      >
        {/* Compact header: time + sector */}
        <div className="flex items-center justify-between gap-0.5 text-muted-foreground">
          <span className="font-medium text-[9px]">{timeDisplay}</span>
          {slot.sector && (
            <span className="text-[8px] truncate max-w-[40px] opacity-70">{slot.sector}</span>
          )}
        </div>
        
        {/* Doctors list - compact display */}
        <div className="mt-0.5 space-y-0.5">
          {hasAssignments ? (
            <>
              {/* Show all doctors in a compact list */}
              {assignments.slice(0, 6).map((assignment, idx) => (
                <Tooltip key={assignment.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Avatar className="h-3.5 w-3.5 shrink-0">
                        <AvatarImage src={assignment.userAvatar} />
                        <AvatarFallback className="text-[7px] bg-emerald-200 dark:bg-emerald-700">
                          {(assignment.userName || "M").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-[9px] font-medium text-emerald-800 dark:text-emerald-300">
                        {assignment.userName?.split(" ")[0] || "Médico"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {assignment.userName}
                  </TooltipContent>
                </Tooltip>
              ))}
              
              {/* If more than 6, show "+X mais" */}
              {assignments.length > 6 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-medium pl-4">
                      +{assignments.length - 6} mais
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-[200px]">
                    {allDoctorNames}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Show vacant count if there are still vacancies */}
              {vacantCount > 0 && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <User className="h-3 w-3" />
                  <span className="text-[8px] italic">{vacantCount} vaga{vacantCount > 1 ? "s" : ""}</span>
                </div>
              )}
            </>
          ) : (
            // Vacant slot - show vacancy count
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <User className="h-3.5 w-3.5" />
              <span className="text-[9px] font-medium">
                {maxDoctors > 1 ? `${maxDoctors} vagas` : "Vago"}
              </span>
            </div>
          )}
        </div>

        {/* Drop indicator */}
        {isOver && (
          <div className="absolute inset-0 rounded border-2 border-accent bg-accent/30 flex items-center justify-center">
            <span className="text-accent font-bold text-[9px]">+ Adicionar</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
