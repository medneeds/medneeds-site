import { Bell, LogOut, AlertTriangle, CheckCircle2, XCircle, Info, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { useProfile } from "@/hooks/profile/useProfile.tsx";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Topbar() {
  const { firstName, formattedName, initials, getAvatarUrl } = useProfile();
  const { signOut } = useAuthContext();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="h-16 bg-primary px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <h1 className="text-primary-foreground font-semibold text-lg">
          {greeting()},{" "}
          <span className="text-accent">{firstName || "Usuário"}</span>
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Notification Bell */}
        <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-primary-foreground hover:bg-primary-foreground/10 w-9 h-9"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Sem notificações no momento.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const isAbsent = n.event?.includes("absent") || n.event === "checkin:overdue";
                  const isSuccess = n.event === "checkin:done" || n.event === "checkout:done" || n.event?.includes("approved");
                  const isDanger = n.event?.includes("cancelled") || n.event?.includes("rejected") || n.event === "job:unassigned";
                  const isScale = n.event?.includes("scale") || n.event?.includes("job:assigned") || n.event?.includes("job:modified");

                  const IconEl = isAbsent
                    ? AlertTriangle
                    : isSuccess
                    ? CheckCircle2
                    : isDanger
                    ? XCircle
                    : isScale
                    ? Calendar
                    : Info;

                  const iconColor = isAbsent
                    ? "text-amber-500"
                    : isSuccess
                    ? "text-green-500"
                    : isDanger
                    ? "text-destructive"
                    : "text-blue-500";

                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "px-3 py-2.5 flex gap-2.5 cursor-default border-b last:border-b-0",
                        !n.read && "bg-accent/5"
                      )}
                    >
                      <IconEl className={cn("w-4 h-4 mt-0.5 flex-shrink-0", iconColor)} />
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            {n.title}
                          </p>
                        )}
                        <p className="text-sm text-foreground/80 leading-snug">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-primary-foreground/10"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={getAvatarUrl} alt={formattedName} />
                <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{formattedName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/perfil")}
              className="cursor-pointer"
            >
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/preferencias")}
              className="cursor-pointer"
            >
              Preferências
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
