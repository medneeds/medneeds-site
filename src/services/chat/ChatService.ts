import api from "@/lib/api.ts";
import type { Chat, Message } from "@/types/api.types.ts";

export const chatService = {
    async startChat(participants: string[], matrixUserId?: string, matrixAccessToken?: string): Promise<any> {
        const { data } = await api.post("/chat/start", {
            participants,
            matrixUserId,
            matrixAccessToken,
        });
        return data;
    },

    async getChats(userId: string): Promise<any[]> {
        const { data } = await api.get<{ docs: any[] }>(`/chat`, {
            params: { "where[participants][contains]": userId },
        });
        return data.docs || [];
    },

    async getMessages(chatId: string): Promise<Message[]> {
        const { data } = await api.get<Message[]>(`/chats/${chatId}/messages`);
        return data;
    },

    async sendMessage(chatId: string, payload: { sender_id: string; content: string }): Promise<Message> {
        const { data } = await api.post<Message>(`/chats/${chatId}/messages`, payload);
        return data;
    },

    async createSectorChat(sectorId: string, name: string): Promise<Chat> {
        const { data } = await api.post<Chat>("/chats", { sector_id: sectorId, name, is_group: true });
        return data;
    },

    async createGroupChat(groupId: string, name: string): Promise<Chat> {
        const { data } = await api.post<Chat>("/chats", { group_id: groupId, name, is_group: true });
        return data;
    },

    async getLastGroupMessage(groupId: string): Promise<Message | null> {
        const { data: chats } = await api.get<Chat[]>("/chats", { params: { group_id: groupId } });
        const chat = chats?.[0];

        if (!chat) return null;

        const { data: messages } = await api.get<Message[]>(`/chats/${chat.id}/messages`, {
            params: { limit: 1, order: "desc" },
        });

        return messages?.[0] || null;
    },
};
