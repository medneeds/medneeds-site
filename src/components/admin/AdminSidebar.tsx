import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
  Bell,
  Settings,
  Shield,
  CreditCard,
} from "lucide-react";
import { MedneedsLogo } from "@/components/brand/MedneedsLogo";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/admin/instituicoes", icon: Building2, label: "Instituições" },
  { to: "/admin/usuarios", icon: Users, label: "Usuários" },
  { to: "/admin/assinaturas", icon: CreditCard, label: "Assinaturas" },
  { to: "/admin/escalas", icon: Calendar, label: "Escalas" },
  { to: "/admin/comunicados", icon: Bell, label: "Comunicados" },
  { to: "/admin/auditoria", icon: FileText, label: "Auditoria" },
  { to: "/admin/configuracoes", icon: Settings, label: "Configurações" },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-primary flex flex-col min-h-screen">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <MedneedsLogo size="sm" />
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium text-accent">Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-accent"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <span>← Voltar ao App</span>
        </NavLink>
      </div>
    </aside>
  );
}
