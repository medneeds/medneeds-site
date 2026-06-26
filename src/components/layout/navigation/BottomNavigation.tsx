import { cn } from "@/lib/utils.ts";
import { Calendar, Home, Stethoscope, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Início", path: "/dashboard" },
  { icon: Stethoscope, label: "Ofertas", path: "/ofertas" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: User, label: "Perfil", path: "/perfil" },
];

export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t safe-area-bottom" style={{ borderColor: '' }}>
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
              )}
            >
              <item.icon 
                className={cn(
                  "w-5 h-5 transition-all text-primary-foreground opacity-70",
                  isActive && "opacity-100"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium text-primary-foreground opacity-70",
                isActive && "opacity-100"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
