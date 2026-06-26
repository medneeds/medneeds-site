import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  Calendar,
  MapPin,
  User,
  Clock,
  Check,
  X,
  Loader2,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { shiftService } from "@/services/shift/ShiftService.ts";
import { profileService } from "@/services/profile/ProfileService.ts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {useGestorContext} from "@/contexts/gestor/useGestorContext.ts";

interface GestorTransfer {
  id: string;
  fromUserName: string;
  fromUserId: string;
  toUserName?: string;
  toUserId?: string;
  shiftTitle?: string;
  shiftDate?: string;
  shiftLocation?: string;
  reason?: string;
  status: string;
  createdAt: string;
  groupId: string;
  groupName: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: Clock },
  accepted: { label: "Aceita", color: "bg-blue-100 text-blue-700", icon: Check },
  rejected: { label: "Recusada", color: "bg-red-100 text-red-700", icon: X },
  completed: { label: "Concluída", color: "bg-emerald-100 text-emerald-700", icon: Check },
  canceled: { label: "Cancelada", color: "bg-muted text-muted-foreground", icon: X },
};

export function GestorPermutasContent() {
  const { groups, selectedGroupId, setSelectedGroupId } = useGestorContext();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch transfers for managed groups
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["gestor-transfers", groups.map(g => g.id), statusFilter],
    queryFn: async () => {
      if (!groups.length) return [];

      const groupIds = groups.map(g => g.id);

      // 1. Get transfers using service
      // Note: This service method is handling the complexity of fetching transfers for multiple groups
      const transfersData = await shiftService.getGroupTransfers(groupIds, statusFilter);

      if (!transfersData?.length) return [];

      // 2. Get additional data (profiles and shift details if needed)
      // The service returns transfers, but we need user names and shift info.
      // We assume getGroupTransfers returns raw transfers.
      // If the service logic implementation fetched full objects, good. 
      // Based on our implementation, it returns Transfer objects.
      // We need to fetch shift details for each transfer? 
      // Our implementation of getGroupTransfers in shiftService actually fetched shifts first to filter!
      // But it didn't return them attached to the transfer object.
      // To define the contract better, we should have made it return enriched data.
      // However, assuming we have raw transfers:

      const shiftIds = [...new Set(transfersData.map(t => t.shift_id))];
      const userIds = new Set<string>();
      transfersData.forEach(t => {
        if (t.from_user_id) userIds.add(t.from_user_id);
        if (t.to_user_id) userIds.add(t.to_user_id);
      });

      // Fetch profiles
      const profiles = await profileService.getProfilesByUserIds(Array.from(userIds));
      const profileMap = new Map(profiles.map(p => [p.user_id, p.name]));

      // Fetch shifts details
      // We need a way to batch fetch shifts by IDs.
      // Since we don't have getShiftsByIds, we will use Promise.all with getShiftById
      // or assume we can get them some other way.
      // Optimization: We could have returned them from getGroupTransfers.
      // For now, let's fetch them in parallel.
      const shiftsPromises = shiftIds.map(id => shiftService.getShiftById(id));
      const shiftsArray = await Promise.all(shiftsPromises);
      const shiftMap = new Map(shiftsArray.map(s => [s.id, s]));

      const groupMap = new Map(groups.map(g => [g.id, g.name]));

      return transfersData.map(t => {
        const shift = shiftMap.get(t.shift_id || "");
        return {
          id: t.id,
          fromUserName: profileMap.get(t.from_user_id) || "Médico",
          fromUserId: t.from_user_id,
          toUserName: t.to_user_id ? profileMap.get(t.to_user_id) : undefined,
          toUserId: t.to_user_id,
          shiftTitle: shift?.title,
          shiftDate: shift?.start_time,
          shiftLocation: shift?.location,
          reason: t.reason,
          status: t.status,
          createdAt: t.created_at,
          groupId: shift?.group_id || "",
          groupName: groupMap.get(shift?.group_id || "") || "Grupo",
        } as GestorTransfer;
      });
    },
    enabled: groups.length > 0,
  });

  // Filter by selected group
  const filteredTransfers = selectedGroupId
    ? transfers.filter(t => t.groupId === selectedGroupId)
    : transfers;

  const pendingCount = transfers.filter(t => t.status === "pending").length;
  const completedCount = transfers.filter(t => t.status === "completed" || t.status === "accepted").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Permutas</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe as trocas de plantão das suas equipes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {pendingCount} pendentes
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Check className="w-3 h-3" />
            {completedCount} concluídas
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedGroupId || "all"} onValueChange={(v) => setSelectedGroupId(v === "all" ? null : v)}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todas as equipes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as equipes</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="accepted">Aceitas</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="rejected">Recusadas</SelectItem>
            <SelectItem value="canceled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transfers List */}
      {filteredTransfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma permuta encontrada</h3>
          <p className="text-muted-foreground">
            {selectedGroupId
              ? "Esta equipe não possui permutas registradas."
              : "Suas equipes não possuem permutas registradas."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map((transfer, index) => {
            const status = statusConfig[transfer.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={transfer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {transfer.fromUserName} → {transfer.toUserName || "A definir"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {transfer.groupName}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1",
                    status.color
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                  {transfer.shiftTitle && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {transfer.shiftTitle}
                    </div>
                  )}
                  {transfer.shiftDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(transfer.shiftDate), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                  {transfer.shiftLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {transfer.shiftLocation}
                    </div>
                  )}
                </div>

                {transfer.reason && (
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded-lg mb-3">
                    "{transfer.reason}"
                  </p>
                )}

                <div className="text-xs text-muted-foreground">
                  Criada em {format(new Date(transfer.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
