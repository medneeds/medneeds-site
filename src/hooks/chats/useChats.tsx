import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat/ChatService.ts";
import { toast } from "sonner";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export interface Chat {
  id: string;
  name: string | null;
  chatType: "team" | "sector";
  groupId: string | null;
  sectorId: string | null;
  groupName?: string;
  sectorName?: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function useChats() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading, error, refetch } = useQuery({
    queryKey: ["user-chats", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const data = await chatService.getChats(user.id);

      return (data || []).map((chat: any) => ({
        id: chat.id,
        name: chat.name,
        chatType: chat.chat_type as "team" | "sector",
        groupId: chat.group_id,
        sectorId: chat.sector_id,
        groupName: chat.group_name || chat.groups?.name,
        sectorName: chat.sector_name || chat.sectors?.name,
        lastMessage: chat.last_message ? {
          content: chat.last_message.content,
          createdAt: chat.last_message.created_at,
          senderName: chat.last_message.sender_name || "Usuário",
        } : undefined,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
      } as Chat));
    },
    enabled: !!user,
  });

  const createSectorChat = useMutation({
    mutationFn: async ({ sectorId, name }: { sectorId: string; name?: string }) => {
      return await chatService.createSectorChat(sectorId, name || "Chat do setor");
    },
    onSuccess: () => {
      toast.success("Chat do setor criado!");
      queryClient.invalidateQueries({ queryKey: ["user-chats"] });
    },
    onError: (error) => {
      console.error("Error creating sector chat:", error);
      toast.error("Erro ao criar chat do setor");
    },
  });

  return {
    chats,
    teamChats: chats.filter(c => c.chatType === "team"),
    sectorChats: chats.filter(c => c.chatType === "sector"),
    isLoading,
    error,
    refetch,
    createSectorChat,
  };
}

export function useChatMessages(chatId: string | null) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const data = await chatService.getMessages(chatId);
      return data || [];
    },
    enabled: !!chatId && !!user,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId || !user) throw new Error("Chat or user not available");
      return await chatService.sendMessage(chatId, { sender_id: user.id, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["user-chats"] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
