import React, { createContext, useCallback, useContext, useState } from "react";
import api from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
}

interface AdminContextValue {
  admin: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const ADMIN_KEY = "medneeds_admin_token";

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: AdminUser }>("/admin/login", {
        email,
        password,
      });
      const { user, token } = res.data;
      localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
      localStorage.setItem(`${ADMIN_KEY}_jwt`, token);
      setAdmin(user);
      return {};
    } catch (err: any) {
      return { error: err?.response?.data?.message ?? "Credenciais inválidas." };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(`${ADMIN_KEY}_jwt`);
    setAdmin(null);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminContext must be used inside AdminProvider");
  return ctx;
}
