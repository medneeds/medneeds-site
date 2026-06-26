import {
  AlertTriangle,
  Bell,
  BriefcaseMedical,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  Send,
  Trash2,
  UserCheck,
  UserMinus,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/notifications/useNotifications.tsx";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface EventStyle {
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
}

function getEventStyle(type: string): EventStyle {
  // Pagamentos / Recebimentos
  if (type === "payment:marked-paid")
    return { icon: <CircleDollarSign className="h-4 w-4" />, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/30" };
  if (type === "payment:unmarked-paid")
    return { icon: <CircleDollarSign className="h-4 w-4" />, colorClass: "text-orange-500", bgClass: "bg-orange-50 dark:bg-orange-950/30" };
  if (type === "payment:marked-received")
    return { icon: <WalletCards className="h-4 w-4" />, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/30" };
  if (type === "payment:unmarked-received")
    return { icon: <WalletCards className="h-4 w-4" />, colorClass: "text-orange-500", bgClass: "bg-orange-50 dark:bg-orange-950/30" };

  // Ciclo do plantão
  if (type === "job:assigned")
    return { icon: <UserCheck className="h-4 w-4" />, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/30" };
  if (type === "job:unassigned")
    return { icon: <UserMinus className="h-4 w-4" />, colorClass: "text-destructive", bgClass: "bg-destructive/10" };
  if (type === "job:cancelled")
    return { icon: <XCircle className="h-4 w-4" />, colorClass: "text-destructive", bgClass: "bg-destructive/10" };
  if (type === "job:modified")
    return { icon: <RefreshCw className="h-4 w-4" />, colorClass: "text-amber-600", bgClass: "bg-amber-50 dark:bg-amber-950/30" };
  if (type === "job:created-in-team")
    return { icon: <BriefcaseMedical className="h-4 w-4" />, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-950/30" };

  // Candidaturas
  if (type === "received:job-application")
    return { icon: <Send className="h-4 w-4" />, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-950/30" };
  if (type === "approved:job-application")
    return { icon: <CheckCircle2 className="h-4 w-4" />, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/30" };
  if (type === "rejected:swap-homologation" || type === "offer:rejected")
    return { icon: <XCircle className="h-4 w-4" />, colorClass: "text-destructive", bgClass: "bg-destructive/10" };
  if (type === "pending:swap-homologation" || type === "approved:swap-homologation")
    return { icon: <Clock className="h-4 w-4" />, colorClass: "text-amber-600", bgClass: "bg-amber-50 dark:bg-amber-950/30" };
  if (type === "alert:scheduler-action-required" || type === "reminder:scheduler-action-required")
    return { icon: <AlertTriangle className="h-4 w-4" />, colorClass: "text-destructive", bgClass: "bg-destructive/10" };

  // Ausência
  if (type.startsWith("absent:"))
    return { icon: <AlertTriangle className="h-4 w-4" />, colorClass: "text-destructive", bgClass: "bg-destructive/10" };

  // Check-in / Check-out
  if (type === "checkin:done")
    return { icon: <LogIn className="h-4 w-4" />, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 dark:bg-emerald-950/30" };
  if (type === "checkout:done")
    return { icon: <LogOut className="h-4 w-4" />, colorClass: "text-blue-600", bgClass: "bg-blue-50 dark:bg-blue-950/30" };
  if (type === "checkin:overdue")
    return { icon: <AlertTriangle className="h-4 w-4" />, colorClass: "text-orange-500", bgClass: "bg-orange-50 dark:bg-orange-950/30" };

  // Ofertas
  if (type === "offer:hole-published")
    return { icon: <BriefcaseMedical className="h-4 w-4" />, colorClass: "text-orange-500", bgClass: "bg-orange-50 dark:bg-orange-950/30" };

  // Default
  return { icon: <Bell className="h-4 w-4" />, colorClass: "text-primary", bgClass: "bg-primary/10" };
}

function priorityBadge(priority?: string) {
  if (priority === "urgent")
    return <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive uppercase tracking-wide">Urgente</span>;
  if (priority === "high")
    return <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wide dark:bg-orange-950/40">Alta</span>;
  return null;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { icon, colorClass, bgClass } = getEventStyle(notification.type);
  const d = notification.data;
  const jobDate = d?.startDateTime
    ? new Date(String(d.startDateTime)).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;
  const institutionName = d?.institutionName ? String(d.institutionName) : null;
  const teamName = d?.teamName ? String(d.teamName) : null;
  const screen = d?.screen ? String(d.screen) : null;

  function handleClick() {
    if (!notification.read) onMarkAsRead(notification.id);
    if (screen) navigate(screen);
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex gap-3 p-3 rounded-lg transition-colors",
        notification.read ? "bg-background" : "bg-accent/40",
        screen && "cursor-pointer hover:bg-accent/60"
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center", bgClass, colorClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1 flex-wrap">
          <p className="text-sm font-semibold leading-tight flex-1 min-w-0">{notification.title}</p>
          {priorityBadge(notification.priority)}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        {(institutionName || teamName || jobDate) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {institutionName && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                {institutionName}
              </span>
            )}
            {teamName && (
              <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">
                {teamName}
              </span>
            )}
            {jobDate && (
              <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                {jobDate}
              </span>
            )}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationsDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const urgentCount = notifications.filter(
    (n) => !n.read && (n.priority === "urgent" || n.priority === "high")
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant={urgentCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={() => markAllAsRead.mutate()}
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[420px]">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center space-y-1">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={(id) => markAsRead.mutate(id)}
                  onDelete={(id) => deleteNotification.mutate(id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs text-center text-muted-foreground justify-center cursor-pointer"
              onClick={() => {
                notifications.forEach((n) => {
                  if (!n.read) markAsRead.mutate(n.id);
                });
              }}
            >
              Ver todas as notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
