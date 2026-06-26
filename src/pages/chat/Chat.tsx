import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";

// Mock data
const mockConversations = [
  {
    id: "1",
    name: "Equipe UTI - Hospital São Lucas",
    lastMessage: "Dr. Carlos: Alguém pode cobrir o plantão de amanhã?",
    time: new Date(Date.now() - 300000),
    unread: 3,
    avatar: null,
    isGroup: true,
  },
  {
    id: "2",
    name: "Plantonistas Emergência SP",
    lastMessage: "Escala de janeiro publicada!",
    time: new Date(Date.now() - 3600000),
    unread: 0,
    avatar: null,
    isGroup: true,
  },
  {
    id: "3",
    name: "Clínica Médica Regional",
    lastMessage: "Dra. Ana: Confirmado para sexta.",
    time: new Date(Date.now() - 86400000),
    unread: 1,
    avatar: null,
    isGroup: true,
  },
];

const mockMessages = [
  { id: "1", senderId: "other1", senderName: "Dr. Carlos", text: "Boa tarde pessoal!", time: new Date(Date.now() - 3600000) },
  { id: "2", senderId: "other1", senderName: "Dr. Carlos", text: "Alguém consegue cobrir meu plantão de amanhã? Surgiu uma emergência familiar.", time: new Date(Date.now() - 3500000) },
  { id: "3", senderId: "me", senderName: "Você", text: "Qual horário, Dr. Carlos?", time: new Date(Date.now() - 3400000) },
  { id: "4", senderId: "other1", senderName: "Dr. Carlos", text: "Das 19h às 7h, 12 horas.", time: new Date(Date.now() - 3300000) },
  { id: "5", senderId: "other2", senderName: "Dra. Mariana", text: "Eu posso cobrir! Já estava mesmo querendo pegar mais um plantão essa semana.", time: new Date(Date.now() - 3200000) },
  { id: "6", senderId: "other1", senderName: "Dr. Carlos", text: "Perfeito, Mariana! Muito obrigado! Vou registrar a troca no sistema.", time: new Date(Date.now() - 3100000) },
  { id: "7", senderId: "me", senderName: "Você", text: "Boa, já vi que a troca foi registrada. Tudo certo 👍", time: new Date(Date.now() - 300000) },
];

export default function Chat() {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = mockConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 border-r border-border bg-card flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-9 w-9 rounded-lg hover:bg-secondary"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground">Chat</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left border-b border-border",
                  selectedConversation?.id === conversation.id && "bg-secondary"
                )}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conversation.avatar || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                    {conversation.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground truncate">{conversation.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {format(conversation.time, "HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                </div>
                {conversation.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                    {conversation.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col bg-background"
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                      {selectedConversation.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedConversation.name}</h3>
                    <p className="text-xs text-muted-foreground">12 membros</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {mockMessages.map((msg, index) => {
                  const isMe = msg.senderId === "me";
                  const showAvatar = index === 0 || mockMessages[index - 1].senderId !== msg.senderId;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-3", isMe && "justify-end")}
                    >
                      {!isMe && showAvatar && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                            {msg.senderName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isMe && !showAvatar && <div className="w-8" />}
                      <div className={cn("max-w-[70%]", isMe && "order-first")}>
                        {!isMe && showAvatar && (
                          <p className="text-xs text-muted-foreground mb-1">{msg.senderName}</p>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-card border border-border rounded-bl-none"
                          )}
                        >
                          <p className="text-sm">{msg.text}</p>
                        </div>
                        <p className={cn("text-xs text-muted-foreground mt-1", isMe && "text-right")}>
                          {format(msg.time, "HH:mm")}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && message.trim()) {
                        // Send message
                        setMessage("");
                      }
                    }}
                  />
                  <Button className="btn-lime" size="icon">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <p>Selecione uma conversa</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
