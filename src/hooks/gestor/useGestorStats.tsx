import { useQuery } from "@tanstack/react-query";
import { groupService } from "@/services/group/GroupService.ts";
import { shiftService } from "@/services/shift/ShiftService.ts";
import { useGestorAccess } from "./useGestorAccess.tsx";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export interface GestorStats {
  totalGroups: number;
  totalMembers: number;
  publishedScales: number;
  draftScales: number;
  pendingTransfers: number;
}

export interface ManagedGroup {
  id: string;
  name: string;
  description?: string;
  institutionName?: string;
  memberCount: number;
  shiftsThisMonth: number;
  pendingTransfers: number;
  currentScale?: {
    id: string;
    status: string;
    month: number;
    year: number;
  };
  members?: Array<{
    userId: string;
    name: string;
    avatarUrl?: string;
  }>;
}

export interface PendingTransfer {
  id: string;
  fromUserName: string;
  toUserName?: string;
  groupName: string;
  shiftDate?: string;
  reason?: string;
  status: string;
  createdAt: string;
}

export function useGestorStats() {
  const { user } = useAuthContext();
  const { managedGroups: managedGroupIds } = useGestorAccess();

  // Fetch managed groups with details
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["gestor-groups-details", user?.id, managedGroupIds],
    queryFn: async () => {
      if (!user || !managedGroupIds.length) return [];

      // Get groups data
      const groupsData = await groupService.getGroups({ ids: managedGroupIds });

      // For each group, get members and scale info
      const enrichedGroups = await Promise.all(
        (groupsData || []).map(async (group: any) => {
          // Get members
          const members = await groupService.getMembers(group.id);

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            institutionName: group.institution_name || group.institutionName,
            memberCount: members?.length || 0,
            shiftsThisMonth: 0,
            pendingTransfers: 0,
            members: (members || []).slice(0, 5).map((m: any) => ({
              userId: m.user_id,
              name: m.name || "Médico",
              avatarUrl: m.avatar_url,
            })),
          } as ManagedGroup;
        })
      );

      return enrichedGroups;
    },
    enabled: !!user && managedGroupIds.length > 0,
  });

  // Fetch pending transfers
  const { data: pendingTransfers = [], isLoading: isLoadingTransfers } = useQuery({
    queryKey: ["gestor-pending-transfers", user?.id, managedGroupIds],
    queryFn: async () => {
      if (!user || !managedGroupIds.length) return [];

      const transfers = await shiftService.getTransfers({
        group_ids: managedGroupIds,
        status: "pending",
      });

      return (transfers || []).map((t: any) => ({
        id: t.id,
        fromUserName: t.from_user_name || "Médico",
        toUserName: t.to_user_name,
        groupName: t.group_name || "Grupo",
        shiftDate: t.shift_date || t.proposed_date,
        reason: t.reason,
        status: t.status,
        createdAt: t.created_at,
      } as PendingTransfer));
    },
    enabled: !!user && managedGroupIds.length > 0,
  });

  // Calculate stats
  const stats: GestorStats = {
    totalGroups: groups.length,
    totalMembers: groups.reduce((acc, g) => acc + (g.memberCount || 0), 0),
    publishedScales: groups.filter((g) => g.currentScale?.status === "published").length,
    draftScales: groups.filter((g) => g.currentScale?.status === "draft").length,
    pendingTransfers: pendingTransfers.length,
  };

  return {
    stats,
    groups,
    pendingTransfers,
    isLoading: isLoadingGroups || isLoadingTransfers,
  };
}
