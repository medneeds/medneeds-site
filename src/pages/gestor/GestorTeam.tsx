import { useState } from "react";
import { GestorLayout } from "@/components/gestor/GestorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Users,
  MoreVertical,
  Calendar,
  MessageCircle,
  Settings,
  Trash2,
  UserPlus,
  Loader2,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { groupService } from "@/services/group/GroupService.ts";
import { chatService } from "@/services/chat/ChatService.ts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { AssignTeamToSectorDialog } from "@/components/gestor/AssignTeamToSectorDialog";
import { CreateTeamDialog } from "@/components/gestor/CreateTeamDialog";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import {useGestorContext} from "@/contexts/gestor/useGestorContext.ts";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  role: "admin" | "gestor" | "medico";
  createdAt: string;
}

interface TeamDetails {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  members: TeamMember[];
  nextScale?: { month: number; year: number; status: string };
  lastActivity?: string;
}

function GestorTeamContent() {
  const isMobile = useIsMobile();
  const { allGroups, isLoadingGroups } = useGestorContext();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignSectorTeam, setAssignSectorTeam] = useState<{ id: string; name: string; currentSectorId?: string } | null>(null);

  // Fetch detailed info for each group
  const { data: teamsDetails = [], isLoading } = useQuery({
    queryKey: ["gestor-teams-details", allGroups.map(g => g.id)],
    queryFn: async () => {
      if (!allGroups.length) return [];

      const detailsPromises = allGroups.map(async (group) => {
        // Fetch details using service
        const details = await groupService.getTeamDetails(group.id);

        // Fetch last message
        const lastMessage = await chatService.getLastGroupMessage(group.id);
        const lastActivity = lastMessage?.created_at as string | undefined;

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          memberCount: details.members?.length || 0,
          members: (details.members || []).map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            name: m.profiles?.name || "Médico",
            avatarUrl: m.profiles?.avatar_url,
            role: m.role,
            createdAt: m.created_at,
          })),
          nextScale: details.nextScale ? {
            month: details.nextScale.month,
            year: details.nextScale.year,
            status: details.nextScale.status,
          } : undefined,
          lastActivity,
        };
      });

      return Promise.all(detailsPromises);
    },
    enabled: allGroups.length > 0,
  });

  const filteredTeams = teamsDetails.filter(
    (t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    gestor: "Gestor",
    medico: "Médico",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    gestor: "bg-blue-100 text-blue-700",
    medico: "bg-emerald-100 text-emerald-700",
  };

  if (isLoadingGroups || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Actions Bar */}
      <div className={`flex items-center gap-2 md:gap-4 ${isMobile ? 'flex-col' : 'justify-between'}`}>
        <div className={`relative ${isMobile ? 'w-full' : 'flex-1 max-w-md'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Button
          className={`btn-lime gap-2 ${isMobile ? 'w-full h-11' : ''}`}
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Criar Equipe
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTeams.map((team, index) => {
          // Find group info from allGroups to get sector
          const groupInfo = allGroups.find(g => g.id === team.id);

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {team.memberCount} membros
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/gestor?group=${team.id}`)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignSectorTeam({
                        id: team.id,
                        name: team.name,
                        currentSectorId: groupInfo?.sectorId
                      })}>
                        <Building2 className="w-4 h-4 mr-2" />
                        Atribuir Setor
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Convidar Membro
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Equipe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Sector Badge */}
                {groupInfo?.sectorName && (
                  <div className="mb-3">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Building2 className="w-3 h-3" />
                      {groupInfo.sectorName}
                    </Badge>
                  </div>
                )}

                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Próxima Escala</p>
                    {team.nextScale ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">
                          {format(new Date(team.nextScale.year, team.nextScale.month - 1), "MMM/yy", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 ml-1">
                          {team.nextScale.status === "published" ? "Publicada" : "Rascunho"}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhuma</span>
                    )}
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Última Atividade</p>
                    {team.lastActivity ? (
                      <span className="text-sm font-medium">
                        {format(new Date(team.lastActivity), "dd/MM HH:mm")}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </div>
                </div>

                {/* Members preview */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Membros</p>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 5).map((member) => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback className="text-xs bg-muted">
                          {member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.memberCount > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                        <span className="text-xs font-medium text-muted-foreground">
                          +{team.memberCount - 5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Roles summary */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(
                    team.members.reduce((acc, m) => {
                      acc[m.role] = (acc[m.role] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([role, count]) => (
                    <span key={role} className={`px-2 py-0.5 text-xs rounded-full ${roleColors[role]}`}>
                      {count} {roleLabels[role]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border p-3 flex gap-2 bg-secondary/20">
                <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={() => navigate(`/gestor/chat?group=${team.id}`)}>
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={() => navigate(`/gestor?group=${team.id}`)}>
                  <Calendar className="w-4 h-4" />
                  Escalas
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 gap-2">
                  <Users className="w-4 h-4" />
                  Membros
                </Button>
              </div>
            </motion.div>
          );
        })}

        {/* Create Team Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: filteredTeams.length * 0.05 }}
          onClick={() => setCreateDialogOpen(true)}
          className="bg-secondary/30 rounded-xl border-2 border-dashed border-border p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/50 hover:bg-secondary/50 transition-all min-h-[300px]"
        >
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Criar nova equipe</h3>
          <p className="text-sm text-muted-foreground">
            Organize sua equipe e gerencie escalas
          </p>
        </motion.div>
      </div>

      {/* Create Team Dialog */}
      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Assign Team to Sector Dialog */}
      <AssignTeamToSectorDialog
        open={!!assignSectorTeam}
        onOpenChange={(open) => !open && setAssignSectorTeam(null)}
        team={assignSectorTeam}
      />
    </div>
  );
}

export default function GestorTeam() {
  return (
    <GestorLayout activeTab="equipes">
      <GestorTeamContent />
    </GestorLayout>
  );
}
