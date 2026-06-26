import { GestorLayout } from "@/components/gestor/GestorLayout";
import { GestorInstituicoesContent } from "@/components/gestor/GestorInstituicoesContent";

export default function GestorInstitutions() {
  return (
    <GestorLayout activeTab="instituicoes">
      <GestorInstituicoesContent />
    </GestorLayout>
  );
}
