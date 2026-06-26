import { GestorLayout } from "@/components/gestor/GestorLayout";
import { GestorSetoresContent } from "@/components/gestor/GestorSetoresContent";

export default function GestorSectors() {
  return (
    <GestorLayout activeTab="setores">
      <GestorSetoresContent />
    </GestorLayout>
  );
}
