import { GestorLayout } from "@/components/gestor/GestorLayout";
import { GestorChatContent } from "@/components/gestor/GestorChatContent";

export default function GestorChat() {
  return (
    <GestorLayout activeTab="chat">
      <GestorChatContent />
    </GestorLayout>
  );
}
