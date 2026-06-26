import authService, {
  type RegisterData,
  type User,
} from "@/services/auth/AuthService.ts";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ user?: User; isAdmin?: boolean; error: Error | null }>;
  signUp: (data: RegisterData) => Promise<{ user?: User; error: Error | null }>;
  verifyEmail: (token: string) => Promise<{ error: Error }>;
  forgotPassword: (email: string) => Promise<{ error: Error }>;
  resetPassword: (
    token: string,
    newPassword: string,
  ) => Promise<{ error: Error }>;
  signOut: () => Promise<void>;
  requireAuth: (redirectTo?: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
  </div>
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(authService.user);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const isValid = await authService.initialize();
        if (isValid) {
          setUser(authService.user);
        } else {
          setUser(null);
        }
      } catch {
        await authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await authService.login({ email, password });
      if (result.isAdmin) {
        // Admin: não define user no contexto, redireciona para área admin
        navigate("/admin", { replace: true });
        return { isAdmin: true, error: null };
      }
      setUser(result.user);
      return { user: result.user, error: null };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao fazer login";
      return { error: new Error(message) };
    }
  }, [navigate]);

  const signUp = useCallback(async (data: RegisterData) => {
    try {
      const userData = await authService.register(data);
      // Só seta o usuário no contexto se houve auto-login (token retornado pelo backend)
      if (authService.user) {
        setUser(authService.user);
      }
      return { user: userData, error: null };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar conta";
      return { error: new Error(message) };
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      await authService.verifyEmail(token);
      return { error: null };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao verificar token";
      return { error: new Error(message) };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authService.forgotPassword(email);
      return { error: null };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao enviar e-mail";
      return { error: new Error(message) };
    }
  }, []);

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      try {
        await authService.resetPassword(token, newPassword);
        return { error: null };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao redefinir sua senha";
        return { error: new Error(message) };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
      localStorage.removeItem("admin_token");
    } finally {
      setUser(null);
    }
  }, []);

  // Valida autenticação e redireciona se necessário
  const requireAuth = useCallback(
    (redirectTo: string = "/") => {
      if (!loading && !user) {
        navigate(redirectTo, { replace: true });
        return false;
      }
      return !!user;
    },
    [user, loading, navigate],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        verifyEmail,
        forgotPassword,
        resetPassword,
        signOut,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { LoadingComponent };
export type { RegisterData, User };
