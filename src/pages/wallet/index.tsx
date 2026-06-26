import { MainLayout } from "@/components/layout/MainLayout";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import DesktopWallet from "./DesktopWallet.tsx";
import InstitutionalDesktopWallet from "./InstitutionalDesktopWallet.tsx";
import MobileWallet from "./MobileWallet.tsx";

export default function Recebimentos() {
  const isMobile = useIsMobile();
  const { institutions } = useInstitutionalContext();
  const isInstitutional = institutions.length > 0;

  return (
    <MainLayout mobileTitle="Recebimentos">
      {isMobile ? <MobileWallet /> : isInstitutional ? <InstitutionalDesktopWallet /> : <DesktopWallet />}
    </MainLayout>
  );
}
