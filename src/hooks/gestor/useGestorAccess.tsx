import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin/AdminService.ts";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export function useGestorAccess() {
  const { user } = useAuthContext();

  const { data: canAccessGestor, isLoading } = useQuery({
    queryKey: ["gestor-access", user?.id],
    queryFn: async () => {
      // if (!user?.id) return false;
      // try {
      //   return await groupService.isGestor(user.id);
      // } catch {
      //   return false;
      // }
      return false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: isPlatformAdmin } = useQuery({
    queryKey: ["platform-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      try {
        return await adminService.isPlatformAdmin(user.id);
      } catch {
        return false;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: managedGroups } = useQuery({
    queryKey: ["managed-groups", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        //TODO: Verificar código
        // return await groupService.getManagedGroups(user.id);
        return [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    canAccessGestor: canAccessGestor ?? false,
    isPlatformAdmin: isPlatformAdmin ?? false,
    managedGroups: managedGroups ?? [],
    isLoading,
  };
}
