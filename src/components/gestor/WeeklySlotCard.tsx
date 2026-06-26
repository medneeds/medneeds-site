import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  MoreVertical,
  Pencil,
  Trash2,
  UserX,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScaleSlot, GroupMember, SlotAssignment } from "@/hooks/useScales";

interface WeeklySlotCardProps {
  slot: ScaleSlot;
  members: GroupMember[];
  onSlotClick: (slot: ScaleSlot) => void;
  onRemoveMember: (slotId: string, assignmentId?: string) => void;
  onEditSlot: (slot: ScaleSlot) => void;
  onDeleteSlot: (slotId: string) => void;
}

function AssignmentStatusBadge({ status }: { status: string }) {
  const config = {
    confirmed: { label: "Confirmado", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    pending: { label: "Pendente", icon: Clock, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    draft: { label: "Rascunho", icon: Clock, className: "bg-muted text-muted-foreground" },
    swap_requested: { label: "Permuta", icon: RefreshCw, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    published: { label: "Publicado", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  };

  const currentConfig = config[status as keyof typeof config] || config.draft;
  const Icon = currentConfig.icon;

  return (
    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 gap-0.5 border-none", currentConfig.className)}>
      <Icon className="h-2.5 w-2.5" />
      <span className="hidden sm:inline">{currentConfig.label}</span>
    </Badge>
  );
}

function AssignmentRow({
  assignment,
  slot,
  onRemove,
}: {
  assignment: SlotAssignment;
  slot: ScaleSlot;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 px-2 bg-secondary/30 rounded-md group hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage src={assignment.userAvatar} />
          <AvatarFallback className="text-[10px] bg-emerald-200 dark:bg-emerald-800">
            {(assignment.userName || "M").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">
            {assignment.userName || "Médico"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <AssignmentStatusBadge status={assignment.status} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <UserX className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover alocação</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function WeeklySlotCard({
  slot,
  members,
  onSlotClick,
  onRemoveMember,
  onEditSlot,
  onDeleteSlot,
}: WeeklySlotCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `weekly-slot-${slot.id}`,
    data: {
      type: "slot",
      slot,
    },
  });

  const assignments = slot.assignments || [];
  const hasAssignments = assignments.length > 0;
  const maxDoctors = slot.maxDoctors || 1;
  const vacantCount = Math.max(0, maxDoctors - assignments.length);
  const isFull = vacantCount === 0;

  const formatTime = (time: string) => time?.slice(0, 5) || "";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-lg p-3 transition-all",
        isOver && "border-accent bg-accent/10 scale-[1.02] shadow-md",
        hasAssignments && isFull
          ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50"
          : hasAssignments
          ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50"
          : "bg-muted/30 border-dashed border-muted-foreground/30 hover:border-accent/50"
      )}
    >
      {/* Header: Time + Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
          </span>
          {slot.sector && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {slot.sector}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Vacancy indicator */}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 px-1.5 gap-1",
              isFull
                ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
                : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
            )}
          >
            <User className="h-3 w-3" />
            {assignments.length}/{maxDoctors}
          </Badge>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditSlot(slot)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteSlot(slot.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Assignments list */}
      <div className="space-y-1">
        {assignments.map((assignment) => (
          <AssignmentRow
            key={assignment.id}
            assignment={assignment}
            slot={slot}
            onRemove={() => onRemoveMember(slot.id, assignment.id)}
          />
        ))}

        {/* Vacant slots */}
        {vacantCount > 0 && (
          <div
            onClick={() => onSlotClick(slot)}
            className={cn(
              "flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer",
              "border border-dashed border-muted-foreground/30",
              "hover:border-accent hover:bg-accent/5 transition-colors"
            )}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-xs">
                {vacantCount} {vacantCount === 1 ? "vaga disponível" : "vagas disponíveis"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Drop overlay */}
      {isOver && (
        <div className="absolute inset-0 rounded-lg border-2 border-accent bg-accent/20 flex items-center justify-center pointer-events-none">
          <span className="text-accent font-bold text-sm">+ Adicionar médico</span>
        </div>
      )}

      {/* Notes */}
      {slot.notes && (
        <p className="mt-2 text-[10px] text-muted-foreground italic truncate">
          {slot.notes}
        </p>
      )}
    </div>
  );
}
