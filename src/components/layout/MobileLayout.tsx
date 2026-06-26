import { MobileSidebar } from "@/components/layout/bar/MobileSidebar.tsx";
import { useProfile } from "@/hooks/profile/useProfile.tsx";
import { ReactNode, useState } from "react";
import { MobileHeader } from "./header/MobileHeader.tsx";
import { BottomNavigation } from "./navigation/BottomNavigation.tsx";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showBottomNav?: boolean;
  rightAction?: React.ReactNode;
  headerClassName?: string;
}

export function MobileLayout({
  children,
  title,
  showBack = false,
  showBottomNav = true,
  rightAction,
  headerClassName
}: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { firstName } = useProfile();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
      <MobileHeader
        title={title}
        showBack={showBack}
        rightAction={rightAction}
        userName={firstName}
        className={headerClassName}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`flex-1 overflow-y-auto bg-background ${showBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {showBottomNav && <BottomNavigation />}
    </div>
  );
}
