import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin/AdminService.ts";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export interface SubscriptionLimits {
  maxInstitutions: number | null;
  maxSectorsPerInstitution: number | null;
  maxTeamsPerSector: number | null;
  maxMembersPerTeam: number | null;
  maxTotalMembers: number | null;
  currentInstitutions: number;
  currentSectors: Record<string, number>;
  currentTeams: Record<string, number>;
  currentMembers: Record<string, number>;
  totalMembers: number;
  planName: string | null;
  planStatus: string | null;
  canCreateInstitution: () => boolean;
  canCreateSector: (institutionId: string) => boolean;
  canCreateTeam: (sectorId: string) => boolean;
  canAddMember: (teamId: string) => boolean;
  remainingInstitutions: () => number | null;
  remainingSectors: (institutionId: string) => number | null;
  remainingTeams: (sectorId: string) => number | null;
  remainingMembers: (teamId: string) => number | null;
}

export function useSubscriptionLimits() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["subscription-limits", user?.id],
    queryFn: async (): Promise<SubscriptionLimits> => {
      if (!user) {
        return createEmptyLimits();
      }

      const data = await adminService.getSubscriptionLimits(user.id);

      // Rebuild helper methods from the server response
      const limits: SubscriptionLimits = {
        maxInstitutions: data.maxInstitutions ?? null,
        maxSectorsPerInstitution: data.maxSectorsPerInstitution ?? null,
        maxTeamsPerSector: data.maxTeamsPerSector ?? null,
        maxMembersPerTeam: data.maxMembersPerTeam ?? null,
        maxTotalMembers: data.maxTotalMembers ?? null,
        currentInstitutions: data.currentInstitutions ?? 0,
        currentSectors: data.currentSectors ?? {},
        currentTeams: data.currentTeams ?? {},
        currentMembers: data.currentMembers ?? {},
        totalMembers: data.totalMembers ?? 0,
        planName: data.planName ?? "Sem Plano",
        planStatus: data.planStatus ?? null,

        canCreateInstitution: () => {
          if (limits.maxInstitutions === null) return true;
          return limits.currentInstitutions < limits.maxInstitutions;
        },
        canCreateSector: (institutionId: string) => {
          if (limits.maxSectorsPerInstitution === null) return true;
          const current = limits.currentSectors[institutionId] || 0;
          return current < limits.maxSectorsPerInstitution;
        },
        canCreateTeam: (sectorId: string) => {
          if (limits.maxTeamsPerSector === null) return true;
          const current = limits.currentTeams[sectorId] || 0;
          return current < limits.maxTeamsPerSector;
        },
        canAddMember: (teamId: string) => {
          if (limits.maxMembersPerTeam !== null) {
            const current = limits.currentMembers[teamId] || 0;
            if (current >= limits.maxMembersPerTeam) return false;
          }
          if (limits.maxTotalMembers !== null) {
            if (limits.totalMembers >= limits.maxTotalMembers) return false;
          }
          return true;
        },
        remainingInstitutions: () => {
          if (limits.maxInstitutions === null) return null;
          return Math.max(0, limits.maxInstitutions - limits.currentInstitutions);
        },
        remainingSectors: (institutionId: string) => {
          if (limits.maxSectorsPerInstitution === null) return null;
          const current = limits.currentSectors[institutionId] || 0;
          return Math.max(0, limits.maxSectorsPerInstitution - current);
        },
        remainingTeams: (sectorId: string) => {
          if (limits.maxTeamsPerSector === null) return null;
          const current = limits.currentTeams[sectorId] || 0;
          return Math.max(0, limits.maxTeamsPerSector - current);
        },
        remainingMembers: (teamId: string) => {
          if (limits.maxMembersPerTeam === null) return null;
          const current = limits.currentMembers[teamId] || 0;
          return Math.max(0, limits.maxMembersPerTeam - current);
        },
      };

      return limits;
    },
    enabled: !!user,
  });
}

function createEmptyLimits(): SubscriptionLimits {
  return {
    maxInstitutions: null,
    maxSectorsPerInstitution: null,
    maxTeamsPerSector: null,
    maxMembersPerTeam: null,
    maxTotalMembers: null,
    currentInstitutions: 0,
    currentSectors: {},
    currentTeams: {},
    currentMembers: {},
    totalMembers: 0,
    planName: null,
    planStatus: null,
    canCreateInstitution: () => true,
    canCreateSector: () => true,
    canCreateTeam: () => true,
    canAddMember: () => true,
    remainingInstitutions: () => null,
    remainingSectors: () => null,
    remainingTeams: () => null,
    remainingMembers: () => null,
  };
}
