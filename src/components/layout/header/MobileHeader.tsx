import { ChevronLeft, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown.tsx";
import { useProfile } from "@/hooks/profile/useProfile.tsx";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showProfile?: boolean;
  rightAction?: React.ReactNode;
  userName?: string;
  className?: string;
  onMenuClick?: () => void;
}

// Routes that should show the greeting header
const greetingRoutes = ["/", "/dashboard"];

export function MobileHeader({
  title,
  showBack = false,
  showProfile = true,
  userName = "",
  className,
  onMenuClick,
}: MobileHeaderProps) {
  const { getAvatarUrl } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const isGreetingRoute = greetingRoutes.includes(location.pathname);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header className={cn("sticky top-0 z-40 bg-primary px-4 py-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Menu Button for Sidebar */}
          {!showBack && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10 -ml-2"
              onClick={onMenuClick}
            >
              <Menu className="w-6 h-6" />
            </Button>
          )}

          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10 gap-1 px-2 -ml-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </Button>
          )}

          {!showBack && showProfile && isGreetingRoute && (
            <>
              <Avatar className="w-10 h-10 border-2 border-primary-foreground/20">
                <AvatarImage src={getAvatarUrl} />
                <AvatarFallback className="bg-accent text-primary text-sm font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-primary-foreground/70 text-xs">
                  {greeting()}
                </span>
                <span className="text-primary-foreground font-semibold">
                  Dr. {userName}
                </span>
              </div>
            </>
          )}

          {!showBack && title && !isGreetingRoute && (
            <h1 className="text-primary-foreground font-semibold text-lg">
              {title}
            </h1>
          )}
        </div>

        {/*TODO: Implementar posteriormente*/}
        {/*<div className="flex items-center gap-2">*/}
        {/*  {rightAction}*/}
        {/*  {!rightAction && (*/}
        {/*    <div className="[&_button]:text-primary-foreground [&_button]:hover:bg-primary-foreground/10">*/}
        {/*      <NotificationsDropdown />*/}
        {/*    </div>*/}
        {/*  )}*/}
        {/*</div>*/}
      </div>
    </header>
  );
}
