import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin/AdminService.ts";
import type { AdminStats } from "@/services/admin/AdminService.ts";

export type { AdminStats };

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      return await adminService.getStats();
    },
    refetchInterval: 30000,
  });
}
