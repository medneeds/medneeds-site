import { GestorLayout } from "@/components/gestor/GestorLayout";
import { GestorPermutasContent } from "@/components/gestor/GestorPermutasContent";

export default function GestorExchanges() {
  return (
    <GestorLayout activeTab="permutas">
      <GestorPermutasContent />
    </GestorLayout>
  );
}
