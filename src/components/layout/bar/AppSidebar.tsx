import {
  MedneedsIcon,
  MedneedsLogo,
} from "@/components/brand/MedneedsLogo.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import { useUserMode } from "@/contexts/user/UserModeContext.tsx";
import { useGestorAccess } from "@/hooks/gestor/useGestorAccess.tsx";
import { useProfile } from "@/hooks/profile/useProfile.tsx";
import { cn } from "@/lib/utils.ts";
import { useTheme } from "@/ui/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Building2,
  Calendar,
  ChevronLeft,
  DollarSign,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

// Navigation items for MEDICO mode
const medicoNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Ofertas", url: "/ofertas", icon: Stethoscope },
  { title: "Solicitações", url: "/solicitacoes", icon: Users },
  { title: "Recebimentos", url: "/recebimentos", icon: DollarSign },
  { title: "Transferências", url: "/transferencias", icon: ArrowLeftRight },
  //TODO: Adicionar grupos posteriormente
  // { title: "Grupos", url: "/grupos", icon: Users },
];

// Navigation items for GESTOR mode
const gestorNavItems = [
  { title: "Escalas", url: "/gestor", icon: Calendar },
  { title: "Equipes", url: "/gestor/equipes", icon: Users },
  { title: "Permutas", url: "/gestor/permutas", icon: RefreshCw },
  { title: "Chat", url: "/gestor/chat", icon: MessageCircle },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const {
    initials: userInitials,
    formattedName,
    profile,
    getAvatarUrl,
  } = useProfile();
  const { canAccessGestor } = useGestorAccess();
  const { toggleMode, isGestorMode, medicoModeActive, toggleMedicoMode, canToggleMedicoMode } = useUserMode();
  const { appearance, setAppearance, isDark } = useTheme();
  const { hasOperationalPermission, permissionsLoading, myPermissions } =
    useInstitutionalContext();

  const isInstitutional  = user?.accountType === 'institutional';
  const isInstRegister   = (user?.register as { type?: string } | undefined)?.type === 'institutional';
  const isInstAdmin      = myPermissions?.role === 'institutional';
  const showVisao        = isInstitutional && isInstRegister;
  const showPermissoes   = isInstitutional && !permissionsLoading && (isInstAdmin || hasOperationalPermission("manage_permissions") || myPermissions?.role === 'administrative');
  const showConvites     = isInstitutional && !permissionsLoading && (isInstAdmin || hasOperationalPermission("manage_invites") || hasOperationalPermission("generate_invite_token"));
  const showTimes        = isInstitutional && !permissionsLoading && (isInstAdmin || hasOperationalPermission("manage_teams"));
  const showGerencial    = showVisao || showPermissoes || showConvites || showTimes;

  // Itens do nav ocultos para usuários institucionais fora do modo médico
  const isInstitutionalNonMedico = isInstitutional && !medicoModeActive;
  const ROLE_LABELS: Record<string, string> = {
    institutional: "Admin Institucional",
    administrative: "Administrativo",
    scheduler: "Escalista",
    responsible: "Responsável",
    CRM: "CRM",
  };
  const roleLabel = isInstitutionalNonMedico && myPermissions?.role
    ? (ROLE_LABELS[myPermissions.role] ?? myPermissions.role)
    : null;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    if (path === "/institucional") return location.pathname === "/institucional";
    if (path === "/institucional/convites") return location.pathname === "/institucional/convites";
    if (path === "/institucional/times") return location.pathname === "/institucional/times";
    if (path === "/institucional/cadastro") return location.pathname === "/institucional/cadastro";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const specialty = roleLabel ?? profile?.specialty ?? "Médico";

  // Para usuários institucionais fora do modo médico, ocultar itens pessoais
  const visibleMedicoItems = isInstitutionalNonMedico
    ? medicoNavItems.filter((item) =>
        item.url === "/dashboard" || item.url === "/agenda"
      )
    : medicoNavItems;

  // Current navigation items based on mode
  const currentNavItems = isGestorMode ? gestorNavItems : visibleMedicoItems;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen sticky top-0 flex flex-col border-r"
      style={{
        backgroundColor: `hsl(var(--primary))`,
        borderColor: `hsla(223, 48%, 22%, 1.00)`,
      }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center justify-between px-4 border-b"
        style={{ borderColor: `hsla(223, 48%, 22%, 1.00)` }}
      >
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MedneedsLogo size="md" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-8 h-8"
            >
              <MedneedsIcon className="w-8 h-8" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-colors"
          style={{
            backgroundColor: `hsl(var(--primary) / 0.2)`,
            color: `hsl(var(--primary-foreground))`,
          }}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* User Profile Summary */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b"
            style={{ borderColor: `hsla(223, 48%, 22%, 1.00)` }}
          >
            <div className="p-4">
              {/* User Avatar & Info with Mode Toggle */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 flex justify-center items-center">
                  <AvatarImage
                    src={getAvatarUrl}
                    className="rounded-full"
                    style={{ objectFit: "cover" }}
                  />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold p-3 rounded-full">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: `hsl(var(--primary-foreground))` }}
                  >
                    {formattedName}
                  </h3>

                  <p
                    className="text-xs truncate"
                    style={{
                      color: `hsl(var(--primary-foreground) / 0.6)`,
                    }}
                  >
                    {specialty}
                  </p>
                </div>
              </div>

              {/* Toggle Médico/Gestor */}
              {canAccessGestor && (
                <div className="flex items-center justify-between mt-4 py-2 px-1">
                  <span
                    className="text-xs"
                    style={{ color: `hsl(var(--primary-foreground) / 0.6)` }}
                  >
                    {isGestorMode ? "Gestor" : "Médico"}
                  </span>
                  <Switch
                    checked={isGestorMode}
                    onCheckedChange={() => {
                      toggleMode();
                      navigate("/dashboard");
                    }}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
              )}

              {/* Toggle Modo Médico — para quem tem permissão act_as_medico */}
              {canToggleMedicoMode && (
                <div
                  className="flex items-center justify-between py-2 px-1 rounded-lg mt-1"
                  style={{
                    backgroundColor: medicoModeActive
                      ? `hsl(var(--accent) / 0.08)`
                      : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: medicoModeActive ? `hsl(var(--accent))` : `hsl(var(--primary-foreground) / 0.6)` }}
                    >
                      Modo Médico
                    </span>
                    {medicoModeActive && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `hsl(var(--accent) / 0.2)`,
                          color: `hsl(var(--accent))`,
                        }}
                      >
                        ON
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={medicoModeActive}
                    onCheckedChange={toggleMedicoMode}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
              )}

              {/*TODO: Será implementado posteriormente*/}
              {/* Stats - Only show in Médico mode */}
              {/*{isMedicoMode && (*/}
              {/*  <div className="space-y-2 mt-4">*/}
              {/*    {stats.loading ? (*/}
              {/*      <div className="flex items-center justify-center py-4">*/}
              {/*        <Loader2 className="w-4 h-4 animate-spin text-sidebar-foreground/50" />*/}
              {/*      </div>*/}
              {/*    ) : (*/}
              {/*      <>*/}
              {/*        /!* Month Indicator *!/*/}
              {/*        <div className="flex items-center mb-2">*/}
              {/*          <span className="text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-wider">*/}
              {/*            {new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}/{new Date().getFullYear().toString().slice(-2)}*/}
              {/*          </span>*/}
              {/*        </div>*/}

              {/*        /!* Events This Month *!/*/}
              {/*        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-sidebar-accent/30">*/}
              {/*          <div className="flex items-center gap-2">*/}
              {/*            <Calendar className="w-4 h-4 text-sidebar-foreground/70" />*/}
              {/*            <span className="text-xs text-sidebar-foreground/70">Plantões/mês</span>*/}
              {/*          </div>*/}
              {/*          <span className="text-sm font-semibold text-sidebar-foreground">*/}
              {/*            {stats.eventsThisMonth}*/}
              {/*          </span>*/}
              {/*        </div>*/}

              {/*        /!* Hours Worked *!/*/}
              {/*        <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-sidebar-accent/30">*/}
              {/*          <div className="flex items-center gap-2">*/}
              {/*            <Clock className="w-4 h-4 text-sidebar-foreground/70" />*/}
              {/*            <span className="text-xs text-sidebar-foreground/70">Horas/mês</span>*/}
              {/*          </div>*/}
              {/*          <span className="text-sm font-semibold text-sidebar-foreground">*/}
              {/*            {stats.hoursThisMonth}h*/}
              {/*          </span>*/}
              {/*        </div>*/}

              {/*        /!* Amount Received *!/*/}
              {/*        <NavLink */}
              {/*          to="/recebimentos"*/}
              {/*          className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"*/}
              {/*        >*/}
              {/*          <div className="flex items-center gap-2">*/}
              {/*            <DollarSign className="w-4 h-4 text-emerald-600" />*/}
              {/*            <span className="text-xs text-sidebar-foreground/70">Recebido</span>*/}
              {/*          </div>*/}
              {/*          <div className="flex items-center gap-1">*/}
              {/*            <span className="text-sm font-semibold text-emerald-600">*/}
              {/*              {formatCurrency(stats.totalReceived)}*/}
              {/*            </span>*/}
              {/*            {stats.countReceived > 0 && (*/}
              {/*              <TrendingUp className="w-3 h-3 text-emerald-600" />*/}
              {/*            )}*/}
              {/*          </div>*/}
              {/*        </NavLink>*/}

              {/*        /!* Amount Pending *!/*/}
              {/*        <NavLink */}
              {/*          to="/recebimentos"*/}
              {/*          className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"*/}
              {/*        >*/}
              {/*          <div className="flex items-center gap-2">*/}
              {/*            <DollarSign className="w-4 h-4 text-amber-600" />*/}
              {/*            <span className="text-xs text-sidebar-foreground/70">A receber</span>*/}
              {/*          </div>*/}
              {/*          <span className="text-sm font-semibold text-amber-600">*/}
              {/*            {formatCurrency(stats.totalPending)}*/}
              {/*          </span>*/}
              {/*        </NavLink>*/}
              {/*      </>*/}
              {/*    )}*/}
              {/*  </div>*/}
              {/*)}*/}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed User Summary */}
      <AnimatePresence mode="wait">
        {collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-2 border-b"
            style={{ borderColor: `hsla(223, 48%, 22%, 1.00)` }}
          >
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={getAvatarUrl}
                className="rounded-full"
                style={{ objectFit: "cover" }}
              />
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            {/* Collapsed Mode Indicator */}
            {canAccessGestor && (
              <div
                onClick={toggleMode}
                className={cn(
                  "w-6 h-6 mx-auto mt-2 rounded-full flex items-center justify-center cursor-pointer transition-colors",
                )}
                style={{
                  backgroundColor: isGestorMode
                    ? `hsl(var(--accent) / 0.3)`
                    : `hsl(var(--primary) / 0.2)`,
                  color: isGestorMode
                    ? `hsl(var(--accent))`
                    : `hsl(var(--primary-foreground) / 0.6)`,
                }}
                title={isGestorMode ? "Modo Gestor" : "Modo Médico"}
              >
                <span className="text-[10px] font-bold">
                  {isGestorMode ? "G" : "M"}
                </span>
              </div>
            )}

            {/* Indicador Modo Médico colapsado */}
            {canToggleMedicoMode && (
              <div
                onClick={toggleMedicoMode}
                className="w-6 h-6 mx-auto mt-1 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  backgroundColor: medicoModeActive
                    ? `hsl(var(--accent) / 0.3)`
                    : `hsl(var(--primary) / 0.2)`,
                  color: medicoModeActive
                    ? `hsl(var(--accent))`
                    : `hsl(var(--primary-foreground) / 0.4)`,
                }}
                title={medicoModeActive ? "Modo Médico ativo" : "Ativar Modo Médico"}
              >
                <span className="text-[10px] font-bold">Dr</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "group",
              )}
              style={
                isActive(item.url)
                  ? {
                      backgroundColor: `hsl(215 100% 91%)`,
                      color: `hsl(208 100% 11%)`,
                    }
                  : {
                      color: `hsl(var(--primary-foreground))`,
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive(item.url)) {
                  e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.url)) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive(item.url)
                    ? ""
                    : "opacity-70 group-hover:opacity-100",
                )}
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </div>

        {/* Institutional section */}
        {showGerencial && (
          <div className="mt-4">
            <div
              className="mx-3 mb-3 border-t"
              style={{ borderColor: `hsla(223, 48%, 22%, 1.00)` }}
            />

            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: `hsl(var(--primary-foreground) / 0.4)` }}
                >
                  Gerencial
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {showVisao && (
                <NavLink
                  to="/institucional"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  )}
                  style={
                    isActive("/institucional")
                      ? { backgroundColor: `hsl(215 100% 91%)`, color: `hsl(208 100% 11%)` }
                      : { color: `hsl(var(--primary-foreground))` }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive("/institucional"))
                      e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive("/institucional"))
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Building2
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive("/institucional") ? "" : "opacity-70 group-hover:opacity-100",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Visão Institucional
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              )}

              {showVisao && (
                <NavLink
                  to="/institucional/cadastro"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  )}
                  style={
                    isActive("/institucional/cadastro")
                      ? { backgroundColor: `hsl(215 100% 91%)`, color: `hsl(208 100% 11%)` }
                      : { color: `hsl(var(--primary-foreground))` }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive("/institucional/cadastro"))
                      e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive("/institucional/cadastro"))
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Building2
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive("/institucional/cadastro") ? "" : "opacity-70 group-hover:opacity-100",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Cadastro
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              )}

              {showConvites && (
                <NavLink
                  to="/institucional/convites"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  )}
                  style={
                    isActive("/institucional/convites")
                      ? { backgroundColor: `hsl(215 100% 91%)`, color: `hsl(208 100% 11%)` }
                      : { color: `hsl(var(--primary-foreground))` }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive("/institucional/convites"))
                      e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive("/institucional/convites"))
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <UserPlus
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive("/institucional/convites") ? "" : "opacity-70 group-hover:opacity-100",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Convites
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              )}

              {showTimes && (
                <NavLink
                  to="/institucional/times"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  )}
                  style={
                    isActive("/institucional/times")
                      ? { backgroundColor: `hsl(215 100% 91%)`, color: `hsl(208 100% 11%)` }
                      : { color: `hsl(var(--primary-foreground))` }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive("/institucional/times"))
                      e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive("/institucional/times"))
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Users
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive("/institucional/times") ? "" : "opacity-70 group-hover:opacity-100",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Times
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              )}

              {showPermissoes && (
                <NavLink
                  to="/institucional/permissoes"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  )}
                  style={
                    isActive("/institucional/permissoes")
                      ? { backgroundColor: `hsl(215 100% 91%)`, color: `hsl(208 100% 11%)` }
                      : { color: `hsl(var(--primary-foreground))` }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive("/institucional/permissoes"))
                      e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive("/institucional/permissoes"))
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ShieldCheck
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive("/institucional/permissoes") ? "" : "opacity-70 group-hover:opacity-100",
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Permissões
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom - Support & Login/Logout */}
      <div
        className="p-3 border-t space-y-1"
        style={{ borderColor: `hsla(223, 48%, 22%, 1.00)` }}
      >
        {user && (
          <button
            onClick={() => setAppearance(isDark ? "light" : "dark")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "group",
            )}
            style={{ color: `hsl(var(--primary-foreground))` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title={isDark ? "Modo Claro" : "Modo Escuro"}
          >
            {isDark ? (
              <Sun
                className="w-5 h-5 flex-shrink-0"
                style={{ opacity: "0.7" }}
              />
            ) : (
              <Moon
                className="w-5 h-5 flex-shrink-0"
                style={{ opacity: "0.7" }}
              />
            )}
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {isDark ? "Claro" : "Escuro"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {user && (
          <a
            href={import.meta.env.VITE_WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "group",
            )}
            style={{ color: `hsl(var(--primary-foreground))` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <MessageCircle
              className="w-5 h-5 flex-shrink-0"
              style={{ opacity: "0.7" }}
            />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Suporte
                </motion.span>
              )}
            </AnimatePresence>
          </a>
        )}

        {user ? (
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "group",
            )}
            style={{ color: `hsl(var(--primary-foreground))` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `hsl(var(--destructive) / 0.1)`;
              e.currentTarget.style.color = `hsl(var(--destructive))`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = `hsl(var(--primary-foreground))`;
            }}
          >
            <LogOut
              className="w-5 h-5 flex-shrink-0"
              style={{ opacity: "0.7" }}
            />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ) : (
          <NavLink
            to="/auth"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "group",
            )}
            style={{ color: `hsl(var(--primary-foreground))` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <LogIn
              className="w-5 h-5 flex-shrink-0"
              style={{ opacity: "0.7" }}
            />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Entrar
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        )}
      </div>
    </motion.aside>
  );
}
