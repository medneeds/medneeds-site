import { GestorLayout } from "@/components/gestor/GestorLayout";
import { GestorEscalasContent } from "@/components/gestor/GestorEscalasContent";

//TODO: Verificar a necessidade do uso dessa tela
export default function GestorScales() {
  return (
    <GestorLayout activeTab="escalas">
      <GestorEscalasContent />
    </GestorLayout>
  );
}
