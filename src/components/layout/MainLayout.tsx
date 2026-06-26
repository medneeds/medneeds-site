import { useShiftNotifications } from "@/hooks/shifts/useShiftNotifications.tsx";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import { ReactNode } from "react";
import { AppSidebar } from "./bar/AppSidebar.tsx";
import { Topbar } from "./bar/Topbar.tsx";
import { MobileLayout } from "./MobileLayout";

interface MainLayoutProps {
  children: ReactNode;
  mobileTitle?: string;
  showMobileBack?: boolean;
  mobileRightAction?: React.ReactNode;
}

export function MainLayout({ 
  children, 
  mobileTitle, 
  showMobileBack = false,
  mobileRightAction 
}: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  // Enable real-time notifications for shift applications
  useShiftNotifications();

  // Mobile layout
  if (isMobile) {
    return (
      <MobileLayout 
        title={mobileTitle} 
        showBack={showMobileBack}
        rightAction={mobileRightAction}
      >
        {children}
      </MobileLayout>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
