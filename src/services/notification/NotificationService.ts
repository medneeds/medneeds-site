import api from "@/lib/api.ts";
import type { Notification } from "@/types/api.types.ts";

export const notificationService = {
    async getNotifications(_userId: string, limit = 50): Promise<Notification[]> {
        const { data } = await api.get<{ docs: Record<string, unknown>[] }>("/notifications", {
            params: { limit, depth: 0, sort: '-createdAt' },
        });
        return (data.docs || []).map((n) => ({
            id: String(n.id ?? ''),
            user_id: '',
            type: String(n.event ?? 'info'),
            title: String(n.title ?? ''),
            message: String(n.body ?? ''),
            data: (n.data as Record<string, unknown> | null) ?? null,
            read: Boolean(n.read),
            created_at: String(n.createdAt ?? new Date().toISOString()),
            priority: String(n.priority ?? 'normal'),
        }));
    },

    async getUnreadCount(): Promise<number> {
        const { data } = await api.get<{ totalDocs?: number; total?: number; docs?: unknown[] }>("/notifications", {
            params: {
                "where[read][equals]": false,
                depth: 0,
                limit: 1,
            },
        });
        if (typeof data?.totalDocs === "number") return data.totalDocs;
        if (typeof data?.total === "number") return data.total;
        if (Array.isArray(data?.docs)) return data.docs.length;
        return 0;
    },

    async markAsRead(notificationId: string): Promise<void> {
        await api.patch(`/notifications/${notificationId}`, { read: true });
    },

    async markAllAsRead(userId: string): Promise<void> {
        await api.patch("/notifications/read-all", { user_id: userId });
    },

    async deleteNotification(notificationId: string): Promise<void> {
        await api.delete(`/notifications/${notificationId}`);
    },
};
