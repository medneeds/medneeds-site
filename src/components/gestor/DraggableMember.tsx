import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GripVertical, Crown, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupMember } from "@/hooks/useScales";

interface DraggableMemberProps {
  member: GroupMember;
  shiftCount: number;
  isDragging?: boolean;
}

const roleIcons = {
  admin: Crown,
  gestor: Shield,
  medico: User,
};

export function DraggableMember({ member, shiftCount, isDragging: externalDragging }: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `member-${member.userId}`,
    data: {
      type: "member",
      member,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const RoleIcon = roleIcons[member.role] || User;
  const dragging = isDragging || externalDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border bg-card",
        "cursor-grab active:cursor-grabbing transition-all",
        "hover:border-accent/50 hover:shadow-md",
        dragging && "opacity-50 scale-95 border-accent shadow-lg z-50"
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback className="text-xs bg-accent/10 text-accent font-medium">
          {member.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{member.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RoleIcon className="h-3 w-3" />
          <span>{member.role === "admin" ? "Admin" : member.role === "gestor" ? "Gestor" : "Médico"}</span>
        </div>
      </div>
      
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">{shiftCount}</span>
        <p className="text-[10px] text-muted-foreground">plantões</p>
      </div>
    </div>
  );
}

// Overlay component for dragging preview
export function DraggableMemberOverlay({ member }: { member: GroupMember }) {
  const RoleIcon = roleIcons[member.role] || User;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-accent bg-card shadow-2xl scale-105">
      <GripVertical className="h-4 w-4 text-accent flex-shrink-0" />
      
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback className="text-xs bg-accent text-accent-foreground font-medium">
          {member.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{member.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RoleIcon className="h-3 w-3" />
          <span>{member.role === "admin" ? "Admin" : member.role === "gestor" ? "Gestor" : "Médico"}</span>
        </div>
      </div>
    </div>
  );
}
