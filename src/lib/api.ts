import axios from "axios";
import { STORAGE_KEYS } from "@/config/constants";

// Proxy requests to `/api` in development to bypass CORS, but keep full URL for production
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — inject JWT token (profile token takes precedence, admin token as fallback)
api.interceptors.request.use(
  (config) => {
    const profileToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const adminToken = localStorage.getItem("admin_token");
    const token = profileToken || adminToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      // Na página de auth o 401 é esperado (tentativa de login) — não limpa tokens nem redireciona
      if (!path.includes("/auth") && !path.includes("/register")) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem("admin_token");
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
