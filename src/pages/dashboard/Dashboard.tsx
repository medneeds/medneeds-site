import {
  GestorDashboardDesktop,
  GestorDashboardMobile,
} from "@/components/dashboard/GestorDashboard.tsx";
import {
  MedicoInstitucionalDesktopDashboard,
  MedicoInstitucionalMobileDashboard,
} from "@/components/dashboard/MedicoInstitucionalDashboard.tsx";
import { QuickActions } from "@/components/dashboard/QuickActions.tsx";
import { ApplicationsSummaryCard } from "@/components/dashboard/card/ApplicationsSummaryCard.tsx";
import { ShiftCard } from "@/components/dashboard/card/ShiftCard.tsx";
import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { BannerCarousel } from "@/components/mobile/BannerCarousel.tsx";
import { MobileShiftData } from "@/components/mobile/MobileShiftCard.tsx";
import { ShiftCarousel } from "@/components/mobile/ShiftCarousel.tsx";
import { Chip } from "@/components/ui/Chip.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import { useUserMode } from "@/contexts/user/UserModeContext.tsx";
import InstitutionalDashboard from "@/pages/institution/InstitutionalDashboard.tsx";
import { useDashboardJobs } from "@/hooks/dashboard/useDashboardJobs.tsx";
import { useOnboardingStatus } from "@/hooks/onboarding/useOnboardingStatus.tsx";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import { profileService } from "@/services/profile/ProfileService.ts";
import { formatCurrency } from "@/utils/numberFormatter";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function MobileMedicoDashboard() {
  const { todayJobs, upcomingJobs, loading } = useDashboardJobs();
  // const { pendingCount } = useSolicitations();
  const navigate = useNavigate();

  // Merge jobs (from API) — convert to MobileShiftData
  const jobTodayShifts: MobileShiftData[] = todayJobs.map((s) => ({
    ...s,
    sector: s.sector || "",
    status: s.status === "completed" ? "completed" : "pending",
  }));
  const jobUpcomingShifts: MobileShiftData[] = upcomingJobs.map((s) => ({
    ...s,
    sector: s.sector || "",
    status: s.status === "completed" ? "completed" : "pending",
  }));

  // Combine (deduplicated by id)
  const allTodayShifts = deduplicateById([...jobTodayShifts]);
  const allUpcomingShifts = deduplicateById([...jobUpcomingShifts]);

  return (
    <div className="pb-4 space-y-4">
      {/* Banner Carousel */}
      <div className="pt-4">
        <BannerCarousel />
      </div>

      {/* Today's Events */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : allTodayShifts.length > 0 ? (
        <section className="px-4 py-2">
          <h2 className="font-semibold text-foreground mb-3">
            Compromissos de hoje
          </h2>
          <div className="space-y-3">
            {todayJobs.map((job) => (
              <div
                key={job.id}
                className="bg-card rounded-xl p-4 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: "#3B82F6" }}
                onClick={() => navigate("/agenda")}
              >
                <h4 className="font-semibold text-foreground text-base mb-1">
                  Hoje às {job.startTime} - {job.title}
                </h4>
                {job.location && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {job.location}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {job?.value > 0.0 && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      {formatCurrency(job.value)}
                    </span>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Chip variant={"purple"} size="sm">
                      {job.modality}
                    </Chip>
                    <Chip variant="blue" size="sm">
                      {job.duration}
                    </Chip>
                    <Chip variant={"green"} size="sm">
                      {job.clinicalArea}
                    </Chip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Upcoming Events Carousel */}
      {allUpcomingShifts.length > 0 && (
        <ShiftCarousel
          title="Próximos compromissos"
          shifts={allUpcomingShifts}
          linkTo="/agenda"
          linkText="Abrir calendário"
        />
      )}

      {/* Solicitations Card — real data */}
      <ApplicationsSummaryCard />

      {/* Quick Actions */}
      <section className="pt-2">
        <QuickActions />
      </section>
    </div>
  );
}

function DesktopMedicoDashboard() {
  const { user } = useAuthContext();
  const { todayJobs, upcomingJobs, feedJobs, loading } = useDashboardJobs();
  // const { pendingCount } = useSolicitations();
  const { needsOnboarding } = useOnboardingStatus();
  // const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  // Merge jobs (from API) — convert to MobileShiftData
  const jobTodayShifts: MobileShiftData[] = todayJobs.map((s) => ({
    ...s,
    sector: s.sector || "",
    status: s.status === "completed" ? "completed" : "pending",
  }));
  const jobUpcomingShifts: MobileShiftData[] = upcomingJobs.map((s) => ({
    ...s,
    sector: s.sector || "",
    status: s.status === "completed" ? "completed" : "pending",
  }));

  // Check if there is any content for today/upcoming (events OR jobs)
  const hasTodayContent = jobTodayShifts.length > 0 || todayJobs.length > 0;
  const hasUpcomingContent =
    jobUpcomingShifts.length > 0 || upcomingJobs.length > 0;

  // Refresh user profile on mount
  useEffect(() => {
    if (user?.id) {
      profileService.getProfile(user.id).catch(() => {});
    }
  }, [user?.id]);

  return (
    <div className="page-container">
      {/* Banner Carousel - Added for Desktop */}
      {/*//TODO: Aguardar verificação do Doutor */}
      {/*<motion.section*/}
      {/*  initial={{ opacity: 0, y: 20 }}*/}
      {/*  animate={{ opacity: 1, y: 0 }}*/}
      {/*  className="mb-8"*/}
      {/*>*/}
      {/*  <BannerCarousel />*/}
      {/*</motion.section>*/}

      {/* Quick Actions - First Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <QuickActions />
      </motion.section>

      <div className="grid gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Events + Jobs */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-md p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg text-foreground">
                  Compromissos de hoje
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() => navigate("/agenda")}
              >
                Ver agenda <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : hasTodayContent ? (
              <div className="space-y-3">
                {todayJobs.map((shift) => (
                  <ShiftCard
                    key={`job-${shift.id}`}
                    shift={shift}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum compromisso para hoje</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/agenda")}
                >
                  Agendar
                </Button>
              </div>
            )}
          </motion.section>

          {/* Upcoming Events + Jobs */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-md p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-foreground">
                Próximos compromissos
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() => navigate("/agenda")}
              >
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : hasUpcomingContent ? (
              <div className="space-y-3">
                {upcomingJobs.map((shift) => (
                  <ShiftCard
                    key={`job-${shift.id}`}
                    shift={shift}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <p className="text-sm">Nenhum compromisso agendado</p>
              </div>
            )}
          </motion.section>

          {/* Applications Summary Card */}
          <ApplicationsSummaryCard />
        </div>

        {/* Right Sidebar Content */}
        <div className="space-y-6">
          {/* Notifications summary */}
          {/*{unreadCount > 0 && (*/}
          {/*  <motion.div*/}
          {/*    initial={{ opacity: 0, x: 20 }}*/}
          {/*    animate={{ opacity: 1, x: 0 }}*/}
          {/*    transition={{ delay: 0.1 }}*/}
          {/*    className="bg-card rounded-md border-border shadow-card cursor-pointer hover:shadow-elevated transition-shadow"*/}
          {/*    onClick={() => navigate("/notificacoes")}*/}
          {/*  >*/}
          {/*    <div className="flex items-center gap-3">*/}
          {/*      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">*/}
          {/*        <Bell className="w-5 h-5 text-accent" />*/}
          {/*      </div>*/}
          {/*      <div>*/}
          {/*        <p className="font-semibold text-foreground text-sm">*/}
          {/*          {unreadCount} {unreadCount === 1 ? "notificação" : "notificações"} não {unreadCount === 1 ? "lida" : "lidas"}*/}
          {/*        </p>*/}
          {/*        <p className="text-xs text-muted-foreground">Clique para visualizar</p>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </motion.div>*/}
          {/*)}*/}
        </div>
      </div>
    </div>
  );
}

/** Deduplicate items by `id` field, keeping the first occurrence. */
function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { isGestorMode, medicoModeActive } = useUserMode();
  const { myPermissions, institutions } = useInstitutionalContext();
  const { user } = useAuthContext();

  const role = myPermissions?.role;
  const isInstRegister = (user?.register as { type?: string } | undefined)?.type === 'institutional';
  const isInstitutionalRole =
    !medicoModeActive &&
    (isInstRegister ||
      role === "institutional" ||
      role === "scheduler" ||
      role === "responsible" ||
      role === "administrative" ||
      role === "CRM");

  if (isInstitutionalRole) {
    return <InstitutionalDashboard />;
  }

  return (
    <MainLayout>
      {isGestorMode ? (
        isMobile ? (
          <GestorDashboardMobile />
        ) : (
          <GestorDashboardDesktop />
        )
      ) : medicoModeActive && institutions.length > 0 ? (
        isMobile ? (
          <MedicoInstitucionalMobileDashboard />
        ) : (
          <MedicoInstitucionalDesktopDashboard />
        )
      ) : isMobile ? (
        <MobileMedicoDashboard />
      ) : (
        <DesktopMedicoDashboard />
      )}
    </MainLayout>
  );
}
