import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import { startOfMonth, addMonths, subMonths } from "date-fns";
import { useGestorAccess } from "@/hooks/gestor/useGestorAccess.tsx";
import { groupService } from "@/services/group/GroupService.ts";
import { useQuery } from "@tanstack/react-query";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export interface ManagedGroup {
  id: string;
  name: string;
  description?: string;
  institutionId?: string;
  institutionName?: string;
  sectorId?: string;
  sectorName?: string;
  memberCount: number;
  role: "admin" | "gestor";
}

export interface Sector {
  id: string;
  name: string;
  description?: string;
  institutionId: string;
  institutionName?: string;
  groupCount: number;
}

interface GestorContextType {
  selectedSectorId: string | null;
  setSelectedSectorId: (id: string | null) => void;
  selectedSector: Sector | null;
  sectors: Sector[];
  isLoadingSectors: boolean;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  selectedGroup: ManagedGroup | null;
  groups: ManagedGroup[];
  allGroups: ManagedGroup[];
  isLoadingGroups: boolean;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
}

export const GestorContext = createContext<GestorContextType | undefined>(undefined);

export function GestorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const { managedGroups: managedGroupIds, isLoading: isLoadingAccess } = useGestorAccess();
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));

  // Fetch groups details with sector info
  const { data: allGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["gestor-managed-groups", user?.id, managedGroupIds],
    queryFn: async () => {
      if (!user || !managedGroupIds.length) return [];

      const groupsData = await groupService.getGroups({ ids: managedGroupIds });
      if (!groupsData) return [];

      // Get member counts for each group
      const enrichedGroups = await Promise.all(
        groupsData.map(async (group: any) => {
          const members = await groupService.getMembers(group.id);

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            sectorId: group.sector_id || group.sectorId,
            sectorName: group.sector_name || group.sectorName,
            institutionId: group.institution_id || group.institutionId,
            institutionName: group.institution_name || group.institutionName,
            memberCount: members?.length || 0,
            role: (group.user_role as "admin" | "gestor") || "gestor",
          };
        })
      );

      return enrichedGroups as ManagedGroup[];
    },
    enabled: !!user && managedGroupIds.length > 0 && !isLoadingAccess,
  });

  // Fetch sectors
  const { data: sectorsFromDb = [], isLoading: isLoadingSectors } = useQuery({
    queryKey: ["gestor-sectors", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const data = await groupService.getSectorsByUser(user.id);
      if (!data) return [];

      return data.map((sector: any) => ({
        id: sector.id,
        name: sector.name,
        description: sector.description,
        institutionId: sector.institution_id,
        institutionName: sector.institution?.name || sector.institution_name,
        groupCount: 0,
      })) as Sector[];
    },
    enabled: !!user,
  });

  // Combine sectors with group counts
  const sectors = useMemo(() => {
    const sectorMap = new Map<string, Sector>();

    sectorsFromDb.forEach(sector => {
      sectorMap.set(sector.id, { ...sector, groupCount: 0 });
    });

    allGroups.forEach(group => {
      if (group.sectorId && sectorMap.has(group.sectorId)) {
        const sector = sectorMap.get(group.sectorId)!;
        sectorMap.set(group.sectorId, { ...sector, groupCount: sector.groupCount + 1 });
      }
    });

    const groupsWithoutSector = allGroups.filter(g => !g.sectorId);
    if (groupsWithoutSector.length > 0) {
      sectorMap.set("no-sector", {
        id: "no-sector",
        name: "Sem setor",
        institutionId: "",
        groupCount: groupsWithoutSector.length,
      });
    }

    return Array.from(sectorMap.values()).sort((a, b) => {
      if (a.id === "no-sector") return 1;
      if (b.id === "no-sector") return -1;
      return a.name.localeCompare(b.name);
    });
  }, [sectorsFromDb, allGroups]);

  // Filter groups by selected sector
  const groups = useMemo(() => {
    if (!selectedSectorId) return allGroups;

    if (selectedSectorId === "no-sector") {
      return allGroups.filter(g => !g.sectorId);
    }

    return allGroups.filter(g => g.sectorId === selectedSectorId);
  }, [allGroups, selectedSectorId]);

  // Auto-select first sector
  useEffect(() => {
    if (sectors.length > 0 && !selectedSectorId) {
      setSelectedSectorId(sectors[0].id);
    }
  }, [sectors, selectedSectorId]);

  // Auto-select first group
  useEffect(() => {
    if (groups.length > 0) {
      const isCurrentValid = groups.some(g => g.id === selectedGroupId);
      if (!isCurrentValid) {
        setSelectedGroupId(groups[0].id);
      }
    } else if (groups.length === 0) {
      setSelectedGroupId(null);
    }
  }, [groups, selectedGroupId]);

  const selectedSector = sectors.find(s => s.id === selectedSectorId) || null;
  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  const goToPreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  return (
    <GestorContext.Provider
      value={{
        selectedSectorId,
        setSelectedSectorId,
        selectedSector,
        sectors,
        isLoadingSectors,
        selectedGroupId,
        setSelectedGroupId,
        selectedGroup,
        groups,
        allGroups,
        isLoadingGroups: isLoadingGroups || isLoadingAccess,
        selectedMonth,
        setSelectedMonth,
        goToPreviousMonth,
        goToNextMonth,
      }}
    >
      {children}
    </GestorContext.Provider>
  );
}

