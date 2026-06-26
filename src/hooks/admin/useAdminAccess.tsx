import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin/AdminService.ts";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export function useAdminAccess() {
  const { user } = useAuthContext();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["admin-access", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      try {
        return await adminService.isPlatformAdmin(user.id);
      } catch {
        return false;
      }
    },
    enabled: !!user?.id,
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading,
  };
}
