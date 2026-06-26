import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupMember, ScaleSlot } from "@/hooks/useScales";
import { Crown, Shield, User, Users } from "lucide-react";

interface MembersSidebarProps {
  members: GroupMember[];
  slots: ScaleSlot[];
}

const roleIcons = {
  admin: Crown,
  gestor: Shield,
  medico: User,
};

const roleLabels = {
  admin: "Admin",
  gestor: "Gestor",
  medico: "Médico",
};

export function MembersSidebar({ members, slots }: MembersSidebarProps) {
  const getMemberShiftCount = (userId: string) => {
    return slots.filter((s) => s.userId === userId).length;
  };

  // Sort members: gestors first, then by shift count
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "admin" || a.role === "gestor") return -1;
    if (b.role === "admin" || b.role === "gestor") return 1;
    return getMemberShiftCount(b.userId) - getMemberShiftCount(a.userId);
  });

  return (
    <div className="bg-card rounded-mdder border-border shadow-card p-4 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">Membros</h3>
        <Badge variant="secondary" className="ml-auto">
          {members.length}
        </Badge>
      </div>

      <ScrollArea className="max-h-[500px]">
        <div className="space-y-2">
          {sortedMembers.map((member) => {
            const shiftCount = getMemberShiftCount(member.userId);
            const RoleIcon = roleIcons[member.role] || User;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.avatarUrl} />
                  <AvatarFallback className="text-xs bg-accent/10 text-accent font-medium">
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RoleIcon className="h-3 w-3" />
                    <span>{roleLabels[member.role]}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">
                    {shiftCount}
                  </span>
                  <p className="text-xs text-muted-foreground">plantões</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total de plantões</span>
          <span className="font-medium">{slots.length}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">Não atribuídos</span>
          <span className="font-medium text-amber-600">
            {slots.filter((s) => !s.userId).length}
          </span>
        </div>
      </div>
    </div>
  );
}
