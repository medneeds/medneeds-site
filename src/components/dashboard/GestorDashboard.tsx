import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManagedGroup, useGestorStats } from "@/hooks/gestor/useGestorStats.tsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { AlertCircle, CalendarDays, CheckCircle2, ChevronRight, Clock, Loader2, RefreshCw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GroupCardProps {
  group: ManagedGroup;
  onClick: () => void;
}

function GroupCard({ group, onClick }: GroupCardProps) {
  const scaleStatus = group.currentScale?.status;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-md p-5 border border-border shadow-card cursor-pointer hover:border-accent/50 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{group.name}</h3>
          {group.institutionName && (
            <p className="text-sm text-muted-foreground">{group.institutionName}</p>
          )}
        </div>
        <Badge variant={scaleStatus === "published" ? "default" : "secondary"}>
          {scaleStatus === "published" ? "Publicada" : "Rascunho"}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{group.memberCount}</p>
          <p className="text-xs text-muted-foreground">Médicos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{group.shiftsThisMonth}</p>
          <p className="text-xs text-muted-foreground">Plantões/mês</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{group.pendingTransfers}</p>
          <p className="text-xs text-muted-foreground">Permutas</p>
        </div>
      </div>

      {/* Members preview */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {group.members?.slice(0, 5).map((member, idx) => (
            <Avatar key={idx} className="h-8 w-8 border-2 border-background">
              <AvatarImage src={member.avatarUrl} />
              <AvatarFallback className="text-xs bg-accent/10 text-accent">
                {member.name?.slice(0, 2).toUpperCase() || "MD"}
              </AvatarFallback>
            </Avatar>
          ))}
          {(group.memberCount || 0) > 5 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background">
              <span className="text-xs font-medium text-muted-foreground">+{(group.memberCount || 0) - 5}</span>
            </div>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </motion.div>
  );
}

interface TransferRequestCardProps {
  transfer: {
    id: string;
    fromUserName: string;
    toUserName?: string;
    groupName: string;
    shiftDate?: string;
    reason?: string;
    status: string;
    createdAt: string;
  };
}

function TransferRequestCard({ transfer }: TransferRequestCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <RefreshCw className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">
          {transfer.fromUserName} → {transfer.toUserName || "A definir"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {transfer.groupName} • {transfer.shiftDate ? format(new Date(transfer.shiftDate), "dd/MM", { locale: ptBR }) : "Data pendente"}
        </p>
      </div>
      <Badge variant="outline" className="text-amber-600 border-amber-300">
        Pendente
      </Badge>
    </div>
  );
}

export function GestorDashboardDesktop() {
  const navigate = useNavigate();
  const { stats, groups, pendingTransfers, isLoading } = useGestorStats();

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Stats Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-md p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalGroups}</p>
                <p className="text-sm text-muted-foreground">Equipes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-md p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.publishedScales}</p>
                <p className="text-sm text-muted-foreground">Escalas publicadas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-md p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.draftScales}</p>
                <p className="text-sm text-muted-foreground">Escalas em rascunho</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-md p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingTransfers}</p>
                <p className="text-sm text-muted-foreground">Permutas pendentes</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-2 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-foreground">Minhas equipes</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/grupos")}>
                Ver todas <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            {groups.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onClick={() => navigate(`/gestor/${group.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-md p-8 border border-border text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma equipe encontrada</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/grupos")}>
                  Gerenciar grupos
                </Button>
              </div>
            )}
          </motion.section>

          {/* Quick Actions for Scales */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-semibold text-lg text-foreground mb-4">Ações rápidas</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => groups[0] && navigate(`/gestor/${groups[0].id}/escalas`)}
                disabled={groups.length === 0}
              >
                <CalendarDays className="h-6 w-6 text-accent" />
                <span>Montar escala</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/transferencias")}
              >
                <RefreshCw className="h-6 w-6 text-amber-600" />
                <span>Ver permutas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/grupos")}
              >
                <Users className="h-6 w-6 text-blue-600" />
                <span>Gerenciar equipes</span>
              </Button>
            </div>
          </motion.section>
        </div>

        {/* Sidebar - Pending Transfers */}
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-md p-5 border border-border shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Permutas pendentes</h3>
              <Badge variant="secondary">{pendingTransfers.length}</Badge>
            </div>
            
            {pendingTransfers.length > 0 ? (
              <div className="space-y-3">
                {pendingTransfers.slice(0, 5).map((transfer) => (
                  <TransferRequestCard key={transfer.id} transfer={transfer} />
                ))}
                {pendingTransfers.length > 5 && (
                  <Button variant="ghost" className="w-full" size="sm" onClick={() => navigate("/transferencias")}>
                    Ver todas ({pendingTransfers.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm text-muted-foreground">Nenhuma permuta pendente</p>
              </div>
            )}
          </motion.section>

          {/* Alert Banner */}
          {stats.draftScales > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-amber-50 dark:bg-amber-900/20 rounded-md p-5 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    Escalas pendentes
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Você tem {stats.draftScales} escala(s) em rascunho aguardando publicação.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => groups[0] && navigate(`/gestor/${groups[0].id}/escalas`)}
                  >
                    Revisar escalas
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GestorDashboardMobile() {
  const navigate = useNavigate();
  const { stats, groups, pendingTransfers, isLoading } = useGestorStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-4 space-y-4">
      {/* Stats */}
      <section className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">{stats.totalGroups}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Equipes</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              <span className="text-2xl font-bold">{stats.pendingTransfers}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Permutas pendentes</p>
          </div>
        </div>
      </section>

      {/* Alert */}
      {stats.draftScales > 0 && (
        <section className="px-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {stats.draftScales} escala(s) em rascunho
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </section>
      )}

      {/* Groups */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Minhas equipes</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/grupos")}>
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-3">
          {groups.map((group) => (
            <div 
              key={group.id}
              onClick={() => navigate(`/gestor/${group.id}`)}
              className="bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground">{group.name}</h3>
                <Badge variant={group.currentScale?.status === "published" ? "default" : "secondary"} className="text-xs">
                  {group.currentScale?.status === "published" ? "Publicada" : "Rascunho"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{group.memberCount} médicos</span>
                <span>•</span>
                <span>{group.shiftsThisMonth} plantões</span>
              </div>
            </div>
          ))}
          
          {groups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma equipe encontrada</p>
            </div>
          )}
        </div>
      </section>

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Permutas pendentes</h2>
            <Badge variant="secondary">{pendingTransfers.length}</Badge>
          </div>
          
          <div className="space-y-2">
            {pendingTransfers.slice(0, 3).map((transfer) => (
              <div key={transfer.id} className="bg-card rounded-xl p-4 border border-border">
                <p className="font-medium text-sm">{transfer.fromUserName} → {transfer.toUserName || "A definir"}</p>
                <p className="text-xs text-muted-foreground mt-1">{transfer.groupName}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="px-4 pt-2">
        <h2 className="font-semibold text-foreground mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => groups[0] && navigate(`/gestor/${groups[0].id}/escalas`)}
            disabled={groups.length === 0}
          >
            <CalendarDays className="h-5 w-5 text-accent" />
            <span className="text-xs">Escalas</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/transferencias")}
          >
            <RefreshCw className="h-5 w-5 text-amber-600" />
            <span className="text-xs">Permutas</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-2"
            onClick={() => navigate("/grupos")}
          >
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-xs">Equipes</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
