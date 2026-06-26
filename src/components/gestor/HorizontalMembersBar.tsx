import { useState, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, GripVertical, Users } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { GroupMember, ScaleSlot } from "@/hooks/useScales";

interface HorizontalMembersBarProps {
  members: GroupMember[];
  slots: ScaleSlot[];
}

// Draggable member chip
function DraggableMemberChip({ 
  member, 
  shiftCount 
}: { 
  member: GroupMember; 
  shiftCount: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `member-${member.userId}`,
    data: {
      type: "member",
      member,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 bg-secondary/80 rounded-full cursor-grab active:cursor-grabbing",
        "border border-border hover:border-accent/50 transition-all shrink-0",
        "hover:shadow-sm hover:bg-secondary",
        isDragging && "opacity-50 shadow-lg border-accent"
      )}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground" />
      <Avatar className="h-6 w-6 border border-background">
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback className="text-[10px] bg-accent/20 text-accent-foreground">
          {member.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium text-foreground whitespace-nowrap">
        {member.name.split(" ")[0]}
      </span>
      {shiftCount > 0 && (
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {shiftCount}
        </Badge>
      )}
    </div>
  );
}

export function HorizontalMembersBar({ members, slots }: HorizontalMembersBarProps) {
  const [search, setSearch] = useState("");

  const getMemberShiftCount = (userId: string) => {
    return slots.filter((s) => 
      s.userId === userId || s.assignments?.some(a => a.userId === userId)
    ).length;
  };

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let filtered = members;
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = members.filter((m) => 
        m.name.toLowerCase().includes(searchLower) ||
        m.specialties?.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    // Sort: gestors first, then by name
    return [...filtered].sort((a, b) => {
      if (a.role === "admin" || a.role === "gestor") return -1;
      if (b.role === "admin" || b.role === "gestor") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [members, search]);

  const totalShifts = slots.length;
  const unassignedShifts = slots.filter((s) => !s.userId && (!s.assignments || s.assignments.length === 0)).length;

  return (
    <div className="bg-card border border-border rounded-xl p-2.5 mb-3">
      <div className="flex items-center gap-3">
        {/* Team label */}
        <div className="flex items-center gap-1.5 px-2 shrink-0">
          <Users className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-foreground">Equipe</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {members.length}
          </Badge>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border shrink-0" />

        {/* Search */}
        {/*TODO: Verificar necessidade dessa bara de pesquisa*/}
        {/*<div className="relative shrink-0 w-32">*/}
        {/*  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />*/}
        {/*  <Input*/}
        {/*    placeholder="Buscar..."*/}
        {/*    value={search}*/}
        {/*    onChange={(e) => setSearch(e.target.value)}*/}
        {/*    className="pl-7 h-7 text-xs w-full"*/}
        {/*  />*/}
        {/*</div>*/}

        {/* Separator */}
        <div className="h-6 w-px bg-border shrink-0" />

        {/* Drag hint */}
        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
          <GripVertical className="h-3 w-3" />
          <span className="text-[10px]">Arraste →</span>
        </div>

        {/* Members horizontal scroll */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-2 py-0.5 px-1">
            {filteredMembers.map((member) => (
              <DraggableMemberChip
                key={member.id}
                member={member}
                shiftCount={getMemberShiftCount(member.userId)}
              />
            ))}

            {filteredMembers.length === 0 && (
              <div className="text-xs text-muted-foreground px-3">
                Nenhum médico encontrado
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>

        {/* Quick stats */}
        <div className="flex items-center gap-3 shrink-0 border-l border-border pl-3">
          <div className="text-center">
            <div className="text-xs font-bold text-emerald-600">{totalShifts - unassignedShifts}</div>
            <div className="text-[9px] text-muted-foreground">atrib.</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-amber-600">{unassignedShifts}</div>
            <div className="text-[9px] text-muted-foreground">vagos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
