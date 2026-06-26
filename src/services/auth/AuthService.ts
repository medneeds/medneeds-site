import { STORAGE_KEYS } from "@/config/constants.ts";
import { clearUserFilterPointers } from "@/services/filters/utils/userPrefs.ts";
import { jwtDecode } from "jwt-decode";
import { Profile } from "@/config/types.ts";
import api from "@/lib/api.ts";

// Tipos
export type User = Profile;

export interface AuthResponse {
  user: User;
  token: string;
  exp: number;
  isAdmin?: boolean;
}

const ADMIN_TOKEN_KEY = "admin_token";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  register: {
    type: "CRM" | "institutional" | "scheduler" | "responsible";
    number?: number;
    uf?: string;
  };
  accountType?: 'personal' | 'institutional';
}

// Chaves de armazenamento
const AUTH_TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
const USER_DATA_KEY = STORAGE_KEYS.USER_DATA;

class AuthService {
  private _token: string | null = null;
  private _user: User | null = null;
  private _exp: number | null = null;
  private _loginInProgress = false;

  get token(): string | null {
    return this._token;
  }

  get user(): User | null {
    return this._user;
  }

  // Verifica se o token JWT é válido (não expirado)
  isTokenValid(): boolean {
    if (!this._exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return this._exp > now;
  }

  // Inicializa o serviço, carregando dados do armazenamento
  async initialize(): Promise<boolean> {
    try {
      const [tokenData, userData] = await Promise.all([
        localStorage.getItem(AUTH_TOKEN_KEY),
        localStorage.getItem(USER_DATA_KEY),
      ]);

      if (tokenData && userData) {
        this._token = tokenData;
        this._user = JSON.parse(userData);

        try {
          const decoded = jwtDecode<{ exp: number }>(tokenData);
          this._exp = decoded.exp;

          return this.isTokenValid();
        } catch (error) {
          console.error("Error decoding token:", error);
          await this.logout();
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Error initializing auth service:", error);
      return false;
    }
  }

  // Login com email e senha — tenta users/login primeiro (admin), depois profiles/login (usuário comum)
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (this._loginInProgress) {
      console.warn("Login já em andamento, evitando potencial recursão");
      throw new Error("Login já em andamento. Tente novamente em alguns instantes.");
    }

    this._loginInProgress = true;

    try {
      // 1. Tenta admin (users) — silencioso se falhar com 401
      try {
        const adminResp = await api.post<{ token: string; user: any; exp?: number }>(
          "/users/login",
          { email: credentials.email, password: credentials.password },
        );
        localStorage.setItem(ADMIN_TOKEN_KEY, adminResp.data.token);
        // Garante que nenhum token de profile antigo sobreponha o token admin nas requisições
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        return {
          user: adminResp.data.user as User,
          token: adminResp.data.token,
          exp: adminResp.data.exp ?? 0,
          isAdmin: true,
        };
      } catch (adminErr: any) {
        // Se não for 401, erro inesperado — lança direto
        if (adminErr.response?.status !== 401) {
          throw new Error(
            adminErr.response?.data?.errors?.[0]?.message ||
            adminErr.response?.data?.message ||
            "Falha no login",
          );
        }
        // 401 significa que não é um usuário admin — continua para profiles
      }

      // 2. Tenta perfil (profiles)
      try {
        const response = await api.post<AuthResponse>("/profiles/login", {
          email: credentials.email,
          password: credentials.password,
        });

        const data = response.data;
        this._token = data.token;
        this._user = data.user;
        this._exp = data.exp;

        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));

        return { user: data.user, token: data.token, exp: data.exp, isAdmin: false };
      } catch (profileErr: any) {
        const message =
          profileErr.response?.data?.errors?.[0]?.message ||
          profileErr.response?.data?.message ||
          "Email ou senha incorretos.";
        throw new Error(message);
      }
    } finally {
      this._loginInProgress = false;
    }
  }

  // Registro de novo usuário
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await api.post("/profiles", {
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        cpf: data.cpf,
        register: data.register,
        accountType: data.accountType ?? 'personal',
      });

      const responseData = response.data;

      // Alguns backends retornam apenas o usuário criado, sem token
      const returnedUser: User | undefined = responseData?.user ?? responseData;
      const returnedToken: string | undefined = responseData?.token;
      const returnedExp: number | undefined = responseData?.exp;

      if (returnedToken && returnedUser) {
        // Registro com login automático
        this._token = returnedToken;
        this._user = returnedUser;
        this._exp = returnedExp ?? null;

        localStorage.setItem(AUTH_TOKEN_KEY, returnedToken);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(returnedUser));

      } else {
        // Registro sem login automático: garante estado "deslogado"
        this._token = null;
        this._user = null;
        this._exp = null;
      }

      return returnedUser as User;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        `Falha no registro (${error.response?.status || "Erro"})`;
      console.error("[AuthService] register FAILED", message);
      throw new Error(message);
    }
  }

  // Enviar solicitação de redefinição de senha
  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post("/profiles/forgot-password", { email });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Falha ao solicitar redefinição de senha";
      console.error("Forgot password error:", message);
      throw new Error(message);
    }
  }

  // Redefinir senha com token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post("/profiles/reset-password", {
        token,
        password: newPassword,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Falha ao redefinir senha";
      console.error("Reset password error:", message);
      throw new Error(message);
    }
  }

  // Verificar email com token
  async verifyEmail(token: string): Promise<void> {
    try {
      const cleanToken = token.trim().replace(/\s+/g, '').toLowerCase();
      await api.post(`/profiles/verify/${cleanToken}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Falha ao verificar email";
      console.error("Verify email error:", message);
      throw new Error(message);
    }
  }

  // Atualizar o perfil do usuário
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this._token || !this._user) {
      throw new Error("Usuário não autenticado");
    }

    try {
      const response = await api.patch<User>(
        `/profiles/${this._user.id}`,
        userData,
      );

      const updatedUser = response.data;

      this._user = { ...this._user, ...updatedUser };

      // Salva no armazenamento
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(this._user));

      return this._user;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Falha ao atualizar perfil";
      console.error("[AuthService] Update profile error:", message);
      throw new Error(message);
    }
  }

  // Atualiza somente no armazenamento local (fallback quando API falhar)
  async setFiltersLocally(filters: string | null): Promise<void> {
    if (!this._user) return;
    this._user = { ...this._user, filters } as User;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(this._user));
  }

  // Recarrega os dados do usuário do servidor
  async refreshUser(): Promise<User | null> {
    if (!this._token || !this._user) {
      return null;
    }

    try {
      const response = await api.get<User>(`/profiles/${this._user.id}`);
      const updatedUser = response.data;

      this._user = updatedUser;

      // Salva no armazenamento
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(this._user));

      return this._user;
    } catch (error: any) {
      console.error("Refresh user error:", error.message);
      return this._user;
    }
  }

  // Logout - limpa os dados de autenticação
  async logout(): Promise<void> {
    this._token = null;
    this._user = null;
    this._exp = null;

    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      // Limpar ponteiros de filtros escopados do usuário atual
      await clearUserFilterPointers();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Obtém o cabeçalho de autorização para requisições
  getAuthHeader() {
    return this._token ? { Authorization: `Bearer ${this._token}` } : {};
  }
}

// Exporta uma instância única do serviço
export const authService = new AuthService();
export default authService;
