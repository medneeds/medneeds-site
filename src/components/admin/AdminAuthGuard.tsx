import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!adminToken) {
      navigate("/auth", { replace: true });
    }
  }, [adminToken, navigate]);

  if (!adminToken) return null;

  return <>{children}</>;
}
