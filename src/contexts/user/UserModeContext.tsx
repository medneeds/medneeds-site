import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGestorAccess } from "@/hooks/gestor/useGestorAccess.tsx";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext";
import { useAuthContext } from "@/contexts/auth/useAuthContext";

type UserMode = "medico" | "gestor";

interface UserModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
  canToggle: boolean;
  isGestorMode: boolean;
  isMedicoMode: boolean;
  // Modo médico para usuários com permissão act_as_medico
  medicoModeActive: boolean;
  toggleMedicoMode: () => void;
  canToggleMedicoMode: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

export function UserModeProvider({ children }: { children: ReactNode }) {
  const { canAccessGestor, isLoading } = useGestorAccess();
  const { permissionsLoading, myPermissions } = useInstitutionalContext();
  const { user } = useAuthContext();

  const [mode, setModeState] = useState<UserMode>("medico");
  const [medicoModeActive, setMedicoModeActive] = useState(false);

  const isInstRegister = (user?.register as { type?: string } | undefined)?.type === 'institutional';

  // register.type === 'institutional' → acesso total sem depender de parâmetros
  // demais roles institucionais → liberado desde que não seja CRM
  const canToggleMedicoMode =
    isInstRegister ||
    (!permissionsLoading && myPermissions !== null && myPermissions?.role !== "CRM");

  // Carrega estado salvo
  useEffect(() => {
    const savedMode = localStorage.getItem("userMode") as UserMode | null;
    if (savedMode && (savedMode === "medico" || savedMode === "gestor")) {
      setModeState(savedMode);
    }
    const savedMedico = localStorage.getItem("medicoMode");
    if (savedMedico === "true") {
      setMedicoModeActive(true);
    }
  }, []);

  // Desativa modo gestor se perder acesso
  useEffect(() => {
    if (!isLoading && !canAccessGestor && mode === "gestor") {
      setModeState("medico");
      localStorage.setItem("userMode", "medico");
    }
  }, [canAccessGestor, isLoading, mode]);

  // Desativa modo médico se perder a permissão (institucional sempre mantém)
  useEffect(() => {
    if (!isInstRegister && !permissionsLoading && !canToggleMedicoMode && medicoModeActive) {
      setMedicoModeActive(false);
      localStorage.setItem("medicoMode", "false");
    }
  }, [isInstRegister, canToggleMedicoMode, permissionsLoading, medicoModeActive]);

  const setMode = (newMode: UserMode) => {
    if (newMode === "gestor" && !canAccessGestor) return;
    setModeState(newMode);
    localStorage.setItem("userMode", newMode);
  };

  const toggleMode = () => {
    const newMode = mode === "medico" ? "gestor" : "medico";
    setMode(newMode);
  };

  const toggleMedicoMode = () => {
    if (!canToggleMedicoMode) return;
    const next = !medicoModeActive;
    setMedicoModeActive(next);
    localStorage.setItem("medicoMode", String(next));
  };

  return (
    <UserModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        canToggle: canAccessGestor,
        isGestorMode: mode === "gestor",
        isMedicoMode: mode === "medico",
        medicoModeActive,
        toggleMedicoMode,
        canToggleMedicoMode,
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const context = useContext(UserModeContext);
  if (context === undefined) {
    throw new Error("useUserMode must be used within a UserModeProvider");
  }
  return context;
}
