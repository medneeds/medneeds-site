import { LoadingComponent } from "@/contexts/auth/AuthContext.tsx";
import React, { useEffect } from "react";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Wrapper simples para proteger rotas.
 * Centraliza toda a lógica no AuthProvider.
 */
export function ProtectedRoute({
  children,
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { loading, requireAuth } = useAuthContext();

  useEffect(() => {
    requireAuth(redirectTo);
  }, [redirectTo, requireAuth]);

  if (loading) {
    return <LoadingComponent />;
  }

  return <>{children}</>;
}
