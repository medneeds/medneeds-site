import { useState, useCallback, useEffect, useRef } from "react";
import institutionalService, {
  type BackendNotification,
} from "@/services/institution/InstitutionalService";
import {
  useScheduleNotifications,
  type ScheduleNotification,
} from "@/hooks/schedule/useScheduleNotifications";

export type { BackendNotification };

export interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority?: "low" | "normal" | "high" | "urgent";
  source: "backend" | "local";
  event?: string;
  data?: Record<string, unknown>;
}

const POLL_INTERVAL_MS = 60_000; // 1 minuto

function backendToUnified(n: BackendNotification): UnifiedNotification {
  return {
    id: `be_${n.id}`,
    title: n.title,
    message: n.body,
    createdAt: n.createdAt,
    read: n.read,
    priority: n.priority,
    source: "backend",
    event: n.event,
    data: n.data,
  };
}

function localToUnified(n: ScheduleNotification): UnifiedNotification {
  return {
    id: `lc_${n.id}`,
    title: "",
    message: n.message,
    createdAt: n.createdAt,
    read: n.read,
    source: "local",
    event: n.type,
    data: n.meta,
  };
}

export function useNotifications() {
  const [backendNotifications, setBackendNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { notifications: localNotifications, markAllRead: markLocalAllRead } =
    useScheduleNotifications();

  const fetchBackend = useCallback(async () => {
    try {
      const res = await institutionalService.getNotifications({ limit: 30 });
      setBackendNotifications(res.docs ?? []);
    } catch {
      // silencia erros de rede — não quebra a UI
    }
  }, []);

  // Poll inicial + intervalo
  useEffect(() => {
    setLoading(true);
    fetchBackend().finally(() => setLoading(false));

    timerRef.current = setInterval(fetchBackend, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchBackend]);

  const unified: UnifiedNotification[] = [
    ...backendNotifications.map(backendToUnified),
    ...localNotifications.map(localToUnified),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = unified.filter((n) => !n.read).length;

  const markAllRead = useCallback(async () => {
    // Marca locais
    markLocalAllRead();

    // Marca backend (apenas as não lidas para evitar chamadas desnecessárias)
    const unreadBackend = backendNotifications.filter((n) => !n.read);
    if (unreadBackend.length === 0) return;

    try {
      await institutionalService.markAllNotificationsRead(unreadBackend.map((n) => n.id));
      setBackendNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silencia erros
    }
  }, [backendNotifications, markLocalAllRead]);

  const markOneRead = useCallback(
    async (unifiedId: string) => {
      if (unifiedId.startsWith("be_")) {
        const backendId = unifiedId.slice(3);
        try {
          await institutionalService.markNotificationRead(backendId);
          setBackendNotifications((prev) =>
            prev.map((n) => (n.id === backendId ? { ...n, read: true } : n))
          );
        } catch {
          // silencia
        }
      }
    },
    []
  );

  return {
    notifications: unified,
    unreadCount,
    loading,
    markAllRead,
    markOneRead,
    refresh: fetchBackend,
  };
}
