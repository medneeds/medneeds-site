import { MedneedsLogo } from "@/components/brand/MedneedsLogo.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { cn } from "@/lib/utils.ts";
import { useTheme } from "@/ui/hooks";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Calendar,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Stethoscope,
  Sun,
  User,
  Users,
  X
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Ofertas", url: "/ofertas", icon: Stethoscope },
  { title: "Recebimentos", url: "/recebimentos", icon: DollarSign },
  { title: "Transferências", url: "/transferencias", icon: ArrowLeftRight },
  //  TODO: Será implementado posteriormente
  // { title: "Grupos", url: "/grupos", icon: Users, soon: true },
  // { title: "Chat", url: "/chat", icon: MessageCircle, soon: true },
];

const gestorNavItems = [
  //  TODO: Será implementado posteriormente
  // { title: "Gestor", url: "/gestor", icon: ClipboardList, soon: true },
];

const bottomNavItems = [
  { title: "Preferências", url: "/preferencias", icon: Settings },
];

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { setAppearance, isDark } = useTheme();
  
  const toggleTheme = () => {
    setAppearance(isDark ? "light" : "dark");
  };
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (url: string) => {
    navigate(url);
    onClose();
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate("/auth");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[998]"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-background flex flex-col shadow-2xl z-[999]"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-primary">
              <MedneedsLogo size="md" />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {/* Main Navigation */}
            <nav className="flex-1 py-3 px-3 overflow-y-auto">
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <button
                    key={item.url}
                    onClick={() => handleNavigation(item.url)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                      "active:scale-[0.98]",
                      item.soon && "cursor-not-allowed opacity-40 hover:shadow-card hover:border-border",
                      isActive(item.url) 
                        ? "bg-primary text-primary-foreground" 
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "w-5 h-5",
                        isActive(item.url) 
                          ? "text-primary-foreground" 
                          : "text-muted-foreground"
                      )} />
                      <span className="text-sm font-medium">
                        {item.title}
                      </span>
                      {item.soon && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-0.5 rounded-full font-medium">
                          Em breve
                        </span>
                      )}
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4",
                      isActive(item.url) 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground/50"
                    )} />
                  </button>
                ))}
              </div>

              {/* Gestor Section */}
              {/* //  TODO: Será implementado posteriormente */}
              {/*<div className="pt-4 mt-4 border-t border-border">*/}
              {/*  <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">*/}
              {/*    Gestão*/}
              {/*  </span>*/}
              {/*  <div className="mt-2 space-y-1">*/}
              {/*    {gestorNavItems.map((item) => (*/}
              {/*      <button*/}
              {/*        key={item.url}*/}
              {/*        onClick={() => handleNavigation(item.url)}*/}
              {/*        className={cn(*/}
              {/*          "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-200",*/}
              {/*          "active:scale-[0.98]",*/}
              {/*          item.soon && "cursor-not-allowed opacity-40 hover:shadow-card hover:border-border",*/}
              {/*          isActive(item.url) */}
              {/*            ? "bg-primary text-primary-foreground" */}
              {/*            : "text-foreground hover:bg-muted"*/}
              {/*        )}*/}
              {/*      >*/}
              {/*        <div className="flex items-center gap-3">*/}
              {/*          <item.icon className={cn(*/}
              {/*            "w-5 h-5",*/}
              {/*            isActive(item.url) */}
              {/*              ? "text-primary-foreground" */}
              {/*              : "text-muted-foreground"*/}
              {/*          )} />*/}
              {/*          <span className="text-sm font-medium">*/}
              {/*            {item.title}*/}
              {/*          </span>*/}
              {/*          {item.soon && (*/}
              {/*            <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-0.5 rounded-full font-medium">*/}
              {/*              Em breve*/}
              {/*            </span>*/}
              {/*          )}*/}
              {/*        </div>*/}
              {/*        <ChevronRight className={cn(*/}
              {/*          "w-4 h-4",*/}
              {/*          isActive(item.url) */}
              {/*            ? "text-primary-foreground/70" */}
              {/*            : "text-muted-foreground/50"*/}
              {/*        )} />*/}
              {/*      </button>*/}
              {/*    ))}*/}
              {/*  </div>*/}
              {/*</div>*/}
            </nav>

            {/* Bottom Navigation */}
            <div className="p-3 border-t border-border space-y-1 bg-muted/30">
              {bottomNavItems.map((item) => (
                <button
                  key={item.url}
                  onClick={() => handleNavigation(item.url)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                    "active:scale-[0.98]",
                    isActive(item.url) 
                      ? "bg-primary text-primary-foreground" 
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn(
                      "w-5 h-5",
                      isActive(item.url) 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground"
                    )} />
                    <span className="text-sm font-medium">
                      {item.title}
                    </span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4",
                    isActive(item.url) 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground/50"
                  )} />
                </button>
              ))}
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  "text-foreground hover:bg-muted active:scale-[0.98]"
                )}
              >
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Sun className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Moon className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Tema {isDark ? "Claro" : "Escuro"}</span>
                </div>
              </button>

              {/* Login/Logout */}
              {user ? (
                <button
                  onClick={handleLogout}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                    "text-destructive hover:bg-destructive/10 active:scale-[0.98]"
                  )}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sair</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNavigation("/auth")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                    "text-primary hover:bg-primary/10 active:scale-[0.98]"
                  )}
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-sm font-medium">Entrar</span>
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}