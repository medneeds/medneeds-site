import api from "@/lib/api.ts";
import { STORAGE_KEYS } from "@/config/constants";

const ADMIN_TOKEN_KEY = "admin_token";

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalInstitutions: number;
    totalGroups: number;
    activeScales: number;
    openShifts: number;
    pendingTransfers: number;
    pendingApplications: number;
    hierarchiesCount: number;
    groupsCount: number;
}

export const adminService = {
    // -------- Auth --------
    async adminLogin(email: string, password: string): Promise<{ token: string }> {
        const { data } = await api.post<{ token: string; user: unknown }>("/users/login", { email, password });
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        return data;
    },

    adminLogout(): void {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
    },

    getAdminToken(): string | null {
        return localStorage.getItem(ADMIN_TOKEN_KEY);
    },

    // -------- Stats --------
    async getStats(): Promise<AdminStats> {
        const { data } = await api.get<AdminStats>("/admin/stats");
        return data;
    },

    // -------- Access --------
    async isPlatformAdmin(_userId: string): Promise<boolean> {
        return !!localStorage.getItem(ADMIN_TOKEN_KEY);
    },

    // -------- Users --------
    async getUsers(params?: Record<string, unknown>): Promise<any[]> {
        const { data } = await api.get<any[]>("/admin/users", { params });
        return data;
    },

    async updateUserRole(userId: string, role: string): Promise<void> {
        await api.patch(`/admin/users/${userId}/role`, { role });
    },

    // -------- Institutions --------
    async getInstitutions(params?: Record<string, unknown>): Promise<any[]> {
        const { data } = await api.get<any[]>("/admin/institutions", { params });
        return data;
    },

    async createInstitution(payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.post("/institutions", payload);
        return data;
    },

    async createProfile(payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.post("/profiles", payload);
        return data;
    },

    async createInstitutionMember(payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.post("/institution_members", payload);
        return data;
    },

    // -------- Subscriptions --------
    async getSubscriptions(params?: Record<string, unknown>): Promise<any[]> {
        const { data } = await api.get<any[]>("/admin/subscriptions", { params });
        return data;
    },

    async getPlans(): Promise<any[]> {
        const { data } = await api.get<any[]>("/admin/plans");
        return data;
    },

    // Aliases for AdminSubscriptions page compatibility
    async getSubscriptionPlans(): Promise<any[]> {
        return this.getPlans();
    },

    async createSubscription(payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.post("/admin/subscriptions", payload);
        return data;
    },

    async updateSubscription(subscriptionId: string, payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.put(`/admin/subscriptions/${subscriptionId}`, payload);
        return data;
    },

    async deleteSubscription(subscriptionId: string): Promise<void> {
        await api.delete(`/admin/subscriptions/${subscriptionId}`);
    },

    // Aliases for AdminSubscriptions page compatibility
    async createSubscriptionPlan(payload: Record<string, unknown>): Promise<any> {
        // Assuming plans share the same endpoint as subscriptions or have a specific one.
        // Based on previous code, they seem to be plans.
        // Let's check getPlans endpoint: /admin/plans.
        // So create/update should probably be on /admin/plans
        const { data } = await api.post("/admin/plans", payload);
        return data;
    },

    async updateSubscriptionPlan(planId: string, payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.put(`/admin/plans/${planId}`, payload);
        return data;
    },

    async deleteSubscriptionPlan(planId: string): Promise<void> {
        await api.delete(`/admin/plans/${planId}`);
    },

    // -------- Announcements --------
    async getAnnouncements(): Promise<any[]> {
        const { data } = await api.get<any[]>("/admin/announcements");
        return data;
    },

    async createAnnouncement(payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.post("/admin/announcements", payload);
        return data;
    },

    async updateAnnouncement(announcementId: string, payload: Record<string, unknown>): Promise<any> {
        const { data } = await api.put(`/admin/announcements/${announcementId}`, payload);
        return data;
    },

    async deleteAnnouncement(announcementId: string): Promise<void> {
        await api.delete(`/admin/announcements/${announcementId}`);
    },

    // -------- Subscription Limits --------
    async getSubscriptionLimits(userId: string): Promise<any> {
        const { data } = await api.get("/admin/subscription-limits", { params: { user_id: userId } });
        return data;
    },
};
