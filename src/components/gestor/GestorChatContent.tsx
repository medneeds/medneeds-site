import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Loader2, 
  Users, 
  Building2, 
  Send,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { useChats, useChatMessages } from "@/hooks/chats/useChats.tsx";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";
import {useGestorContext} from "@/contexts/gestor/useGestorContext.ts";

export function GestorChatContent() {
  const { user } = useAuthContext();
  const { isLoadingGroups, sectors } = useGestorContext();
  const { chats, teamChats, sectorChats, isLoading: loadingChats, createSectorChat } = useChats();
  
  const [activeTab, setActiveTab] = useState<"equipes" | "setores">("equipes");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const { messages, isLoading: loadingMessages, sendMessage } = useChatMessages(selectedChatId);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId) return;
    await sendMessage.mutateAsync(messageInput.trim());
    setMessageInput("");
  };

  const handleCreateSectorChat = async (sectorId: string) => {
    const sector = sectors.find(s => s.id === sectorId);
    await createSectorChat.mutateAsync({ 
      sectorId, 
      name: `Chat - ${sector?.name || "Setor"}` 
    });
  };

  if (isLoadingGroups || loadingChats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Chat List Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "equipes" | "setores")}>
            <div className="px-4 pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="equipes" className="flex-1 gap-1 text-xs">
                  <Users className="w-3 h-3" />
                  Equipes
                </TabsTrigger>
                <TabsTrigger value="setores" className="flex-1 gap-1 text-xs">
                  <Building2 className="w-3 h-3" />
                  Setores
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="equipes" className="m-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 p-2">
                  {teamChats.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum chat de equipe
                    </p>
                  ) : (
                    teamChats.map((chat) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChatId === chat.id
                            ? "bg-accent"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(chat.groupName || chat.name || "CH").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {chat.groupName || chat.name || "Chat"}
                            </p>
                            {chat.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate">
                                {chat.lastMessage.senderName}: {chat.lastMessage.content}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            <Users className="w-2.5 h-2.5 mr-1" />
                            Equipe
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="setores" className="m-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 p-2">
                  {sectorChats.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Nenhum chat de setor
                      </p>
                      {sectors.filter(s => s.id !== "no-sector").length > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const firstSector = sectors.find(s => s.id !== "no-sector");
                            if (firstSector) handleCreateSectorChat(firstSector.id);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Criar Chat de Setor
                        </Button>
                      )}
                    </div>
                  ) : (
                    sectorChats.map((chat) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChatId === chat.id
                            ? "bg-accent"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                              {(chat.sectorName || chat.name || "ST").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {chat.sectorName || chat.name || "Setor"}
                            </p>
                            {chat.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate">
                                {chat.lastMessage.senderName}: {chat.lastMessage.content}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-700">
                            <Building2 className="w-2.5 h-2.5 mr-1" />
                            Setor
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {!selectedChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Selecione uma conversa
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Escolha um chat de equipe ou setor na lista ao lado para começar a conversar
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(() => {
                      const chat = chats.find(c => c.id === selectedChatId);
                      return (chat?.groupName || chat?.sectorName || chat?.name || "CH").substring(0, 2).toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">
                    {(() => {
                      const chat = chats.find(c => c.id === selectedChatId);
                      return chat?.groupName || chat?.sectorName || chat?.name || "Chat";
                    })()}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const chat = chats.find(c => c.id === selectedChatId);
                      return chat?.chatType === "sector" ? "Chat do Setor" : "Chat da Equipe";
                    })()}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg: any) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                          {!isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.profiles?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {(msg.profiles?.name || "U").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            {!isOwn && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {msg.profiles?.name || "Usuário"}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  className="btn-lime" 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessage.isPending}
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
