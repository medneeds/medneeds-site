import { LoadingComponent } from "@/contexts/auth/AuthContext.tsx";
import { useGestorAccess } from "@/hooks/gestor/useGestorAccess.tsx";
import { useEffect } from "react";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

interface GestorAuthGuardProps {
  children: React.ReactNode;
}

export function GestorAuthGuard({ children }: GestorAuthGuardProps) {
  const { loading: authLoading, requireAuth } = useAuthContext();
  const { canAccessGestor, isLoading: gestorLoading } = useGestorAccess();

  useEffect(() => {
    requireAuth("/gestor/login");
  }, [requireAuth]);

  // Show loading state
  if (authLoading || gestorLoading) {
    return <LoadingComponent />;
  }

  // Not authorized
  if (!canAccessGestor) {
    return null;
  }

  return <>{children}</>;
}
