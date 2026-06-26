import { useState, useCallback, useEffect } from "react";

export type NotificationType =
  | "shift_created"
  | "shift_updated"
  | "swap_request"
  | "check_in"
  | "conflict";

export interface ScheduleNotification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = "schedule_notifications";

function loadFromStorage(): ScheduleNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: ScheduleNotification[]) {
  // Manter apenas as 50 mais recentes
  const trimmed = notifications.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function useScheduleNotifications() {
  const [notifications, setNotifications] = useState<ScheduleNotification[]>(
    () => loadFromStorage()
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (type: NotificationType, message: string, meta?: Record<string, unknown>) => {
      const n: ScheduleNotification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        message,
        createdAt: new Date().toISOString(),
        read: false,
        meta,
      };
      setNotifications((prev) => {
        const next = [n, ...prev];
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Sincroniza quando outra aba grava no localStorage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setNotifications(loadFromStorage());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { notifications, unreadCount, addNotification, markAllRead, clearAll };
}
