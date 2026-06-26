import { useQuery } from "@tanstack/react-query";
import { shiftService } from "@/services/shift/ShiftService.ts";

export interface RecentShift {
  id: string;
  title: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  status: string;
  value: number | null;
  specialty: string | null;
  created_at: string;
  creator_name?: string;
  applications_count: number;
}

export function useRecentShifts(limit = 10) {
  return useQuery({
    queryKey: ["admin-recent-shifts", limit],
    queryFn: async (): Promise<RecentShift[]> => {
      const data = await shiftService.getRecentShifts(limit);
      return data as RecentShift[];
    },
    refetchInterval: 30000,
  });
}
