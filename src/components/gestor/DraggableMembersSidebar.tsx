import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupMember, ScaleSlot } from "@/hooks/useScales";
import { GripVertical, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DraggableMember } from "./DraggableMember";

interface DraggableMembersSidebarProps {
  members: GroupMember[];
  slots: ScaleSlot[];
}

export function DraggableMembersSidebar({ members, slots }: DraggableMembersSidebarProps) {
  const [search, setSearch] = useState("");

  const getMemberShiftCount = (userId: string) => {
    return slots.filter((s) => s.userId === userId).length;
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
  const unassignedShifts = slots.filter((s) => !s.userId).length;

  return (
    <div className="bg-card rounded-md border-border shadow-card p-4 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">Equipe</h3>
        <Badge variant="secondary" className="ml-auto">
          {members.length}
        </Badge>
      </div>

      {/* Instructions */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-secondary/50 rounded-lg">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Arraste os médicos para os slots
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar médico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Members list */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2 pr-2">
          {filteredMembers.map((member) => (
            <DraggableMember
              key={member.id}
              member={member}
              shiftCount={getMemberShiftCount(member.userId)}
            />
          ))}

          {filteredMembers.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhum médico encontrado
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total de plantões</span>
          <span className="font-semibold">{totalShifts}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Atribuídos</span>
          <span className="font-semibold text-emerald-600">
            {totalShifts - unassignedShifts}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Não atribuídos</span>
          <span className="font-semibold text-amber-600">
            {unassignedShifts}
          </span>
        </div>
      </div>
    </div>
  );
}
