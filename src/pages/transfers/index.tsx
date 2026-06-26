import { MainLayout } from "@/components/layout/MainLayout";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import DesktopTransfers from "./DesktopTransfers.tsx";
import InstitutionalDesktopTransfers from "./InstitutionalDesktopTransfers.tsx";
import MobileTransfers from "./MobileTransfers.tsx";

export default function Transferencias() {
  const isMobile = useIsMobile();
  const { institutions } = useInstitutionalContext();
  const isInstitutional = institutions.length > 0;

  return (
    <MainLayout mobileTitle="Transferências">
      {isMobile ? <MobileTransfers /> : isInstitutional ? <InstitutionalDesktopTransfers /> : <DesktopTransfers />}
    </MainLayout>
  );
}
