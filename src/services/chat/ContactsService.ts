import api from "@/lib/api.ts";
import type { ProfileConnection } from "@/types/api.types.ts";

export const contactsService = {
    async getContacts(userId: string): Promise<ProfileConnection[]> {
        try {
            const where = JSON.stringify({ from: { equals: userId } });
            const { data } = await api.get<{ docs: ProfileConnection[] }>("/profile-connections", {
                params: { where, depth: 2, limit: 1000 },
            });
            return data.docs || [];
        } catch (error) {
            console.error("[contactsService] Error fetching contacts:", error);
            return [];
        }
    },

    async searchContacts(userId: string, query: string): Promise<ProfileConnection[]> {
        try {
            const where = JSON.stringify({
                and: [
                    { from: { equals: userId } },
                    {
                        or: [
                            { "relationship.name": { contains: query } },
                            { "relationship.email": { contains: query } },
                        ],
                    },
                ],
            });
            const { data } = await api.get<{ docs: ProfileConnection[] }>("/profile-connections", {
                params: { where, depth: 2, limit: 1000, sort: "relationship.name" },
            });
            return data.docs || [];
        } catch (error) {
            console.error("[contactsService] Error searching contacts:", error);
            throw error;
        }
    },

    async addContact(fromUserId: string, toUserId: string): Promise<ProfileConnection> {
        const { data } = await api.post<{ doc: ProfileConnection }>("/profile-connections", {
            from: fromUserId,
            relationship: toUserId,
        });
        return data.doc;
    },

    async removeContact(connectionId: string): Promise<void> {
        await api.delete(`/profile-connections/${connectionId}`);
    },
};
