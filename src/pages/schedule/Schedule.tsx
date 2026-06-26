import { OpportunityDetailsModal } from "@/components/jobs/JobDetails/JobDetailsModal.tsx";
import { NewJobModal } from "@/components/jobs/NewJobModal/NewJobModal.tsx";
import { MainLayout } from "@/components/layout/MainLayout.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { jobService } from "@/config/app";
import { Job } from "@/config/types.ts";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext";
import { useUserMode } from "@/contexts/user/UserModeContext";
import { useScheduleData } from "@/hooks/schedule/useScheduleData.ts";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import { InstitutionalSchedule } from "@/pages/schedule/InstitutionalSchedule";
import { useThemeColors } from "@/hooks/ui/useThemeColors.ts";
import { cn } from "@/lib/utils.ts";
import { jobApplicationService } from "@/services/jobs/JobApplicationService.ts";
import {
  formatJobAsAgendaCardItem,
  groupJobsAgendaByDateSections,
  JobAgendaCardItem,
} from "@/services/jobs/utils/formatJob.ts";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ─── helpers ────────────────────────────────────────────────────────────────

/** Converte um JobAgendaCardItem em uma representação de cor para o dot do calendário */
const getJobDotColor = (_job: JobAgendaCardItem) => "bg-primary";

/** Retorna os jobs do dia específico a partir de monthJobs */
const getJobsForDate = (
  jobs: JobAgendaCardItem[],
  date: Date,
): JobAgendaCardItem[] => {
  return jobs.filter((job) => {
    const jobDate = new Date(job.startDateTime);
    return (
      jobDate.getFullYear() === date.getFullYear() &&
      jobDate.getMonth() === date.getMonth() &&
      jobDate.getDate() === date.getDate()
    );
  });
};

/** Formata duração em horas */
const formatDuration = (hours: number) => `${hours}h`;

/** Formata valor em reais a partir de tags */
const extractPriceTag = (job: JobAgendaCardItem): string | null => {
  const priceTag = job.tags.find((t) => t.label.startsWith("R$"));
  return priceTag?.label ?? null;
};

// ─── MobileAgenda ────────────────────────────────────────────────────────────

function MobileAgenda() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isDark } = useThemeColors();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();
  const [jobToEdit, setJobToEdit] = useState<JobAgendaCardItem | undefined>();
  const [jobToDelete, setJobToDelete] = useState<
    JobAgendaCardItem | undefined
  >();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<
    Job | undefined
  >();
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false);
  const [jobToRevert, setJobToRevert] = useState<Job | undefined>();
  const [isReverting, setIsReverting] = useState(false);
  const [initialHasApplied, setInitialHasApplied] = useState<
    boolean | undefined
  >();
  const [initialApplicationsCount, setInitialApplicationsCount] = useState<
    number | undefined
  >();

  const {
    monthJobs,
    allJobs,
    isInitialLoading,
    changeMonth,
    refresh,
    removeJobs,
  } = useScheduleData(user?.id, startOfMonth(new Date()));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekStart = startOfWeek(currentDate);
  const weekDaysArray = Array.from({ length: 7 }, (_, i) =>
    addDays(weekStart, i),
  );
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  // Agrupamento por data para a lista
  const sections = useMemo(
    () => groupJobsAgendaByDateSections(monthJobs, undefined),
    [monthJobs],
  );

  const handleOpenNewEvent = (date?: Date, job?: JobAgendaCardItem) => {
    setJobToEdit(job);
    setModalInitialDate(date || job?.startDateTime || currentDate);
    setModalOpen(true);
  };

  const handleOpenDetails = async (job: JobAgendaCardItem) => {
    const fullJob = allJobs.find(
      (j) => j.id === job.originalJobId || j.id === job.id,
    );
    setSelectedJobForDetails(fullJob);

    if (fullJob && user) {
      const isOwner =
        fullJob.from &&
        typeof fullJob.from === "object" &&
        fullJob.from.id === user.id;
      const isOffer = fullJob.visibility !== "PRIVATE";

      const [applied, apps] = await Promise.all([
        jobApplicationService.hasUserAppliedForJob(fullJob.id, user.id),
        isOwner && isOffer
          ? jobApplicationService.getApplicationsForJob(fullJob.id)
          : Promise.resolve(null),
      ]);

      setInitialHasApplied(applied);
      if (apps) {
        setInitialApplicationsCount(apps.totalDocs);
      } else {
        setInitialApplicationsCount(0);
      }
    }

    setDetailsModalOpen(true);
  };

  const handleEditFromDetails = (job: Job) => {
    setDetailsModalOpen(false);
    handleOpenNewEvent(undefined, formatJobAsAgendaCardItem(job));
  };

  const handleDeleteFromDetails = (job: Job) => {
    setDetailsModalOpen(false);
    setJobToDelete(formatJobAsAgendaCardItem(job));
    setDeleteConfirmOpen(true);
  };

  const handleRevertToOffer = (job: Job) => {
    setJobToRevert(job);
    setRevertConfirmOpen(true);
  };

  const handleRevertConfirmed = async () => {
    if (!jobToRevert) return;
    setIsReverting(true);
    try {
      const jobsToUpdate = [jobToRevert];

      if (
        jobToRevert.singlePaymentForMutipleDates &&
        (jobToRevert.parentRef ||
          (jobToRevert.additionalDates &&
            jobToRevert.additionalDates.length > 0))
      ) {
        const parentId = jobToRevert.parentRef || jobToRevert.id;
        const related = allJobs.filter(
          (j) => j.parentRef === parentId || j.id === parentId,
        );
        related.forEach((rj) => {
          if (!jobsToUpdate.find((j) => j.id === rj.id)) {
            jobsToUpdate.push(rj);
          }
        });
      }

      await Promise.all(
        jobsToUpdate.map((j) =>
          jobService.updateJob(j.id, {
            to: null,
            transferredAt: null,
            visibility: j.visibility === "PRIVATE" ? "PUBLIC" : j.visibility,
          }),
        ),
      );

      toast.success(
        jobsToUpdate.length > 1
          ? `${jobsToUpdate.length} agendamentos retornados para oferta`
          : "Agendamento retornado para oferta",
      );
      setDetailsModalOpen(false);
      refresh();
    } catch (error) {
      console.error("Erro ao retornar agendamento para oferta:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsReverting(false);
      setRevertConfirmOpen(false);
      setJobToRevert(undefined);
    }
  };

  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
    changeMonth(startOfMonth(newDate));
  };

  const handleDeleteConfirmed = async () => {
    if (!jobToDelete?.id) return;

    setIsDeleting(true);
    try {
      await jobService.deleteJob(jobToDelete.originalJobId || jobToDelete.id);
      removeJobs([jobToDelete.id]);
      toast.success("Agendamento excluído com sucesso");
      await refresh();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setJobToDelete(undefined);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <CalendarIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Faça login para ver sua agenda
        </h2>
        <p className="text-muted-foreground mb-4">
          Acesse sua conta para gerenciar seus eventos e plantões.
        </p>
        <Button onClick={() => navigate("/auth")}>Entrar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMonthChange(subMonths(currentDate, 1))}
            className="transition-all hover:brightness-95 dark:hover:brightness-105"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMonthChange(addMonths(currentDate, 1))}
            className="transition-all hover:brightness-95 dark:hover:brightness-105"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Toggle View Mode */}
        <div className="flex justify-center gap-2 mb-3">
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
            className={
              viewMode !== "week"
                ? "transition-all hover:brightness-95 dark:hover:brightness-105"
                : ""
            }
          >
            Semana
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("month")}
            className={
              viewMode !== "month"
                ? "transition-all hover:brightness-95 dark:hover:brightness-105"
                : ""
            }
          >
            Mês
          </Button>
        </div>

        {viewMode === "week" ? (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, idx) => {
              const dayDate = weekDaysArray[idx];
              const dayJobs = getJobsForDate(
                allJobs.map(formatJobAsAgendaCardItem),
                dayDate,
              );
              return (
                <div key={day} className="text-center">
                  <span className="text-xs text-muted-foreground">{day}</span>
                  <button
                    onClick={() => setCurrentDate(dayDate)}
                    className={cn(
                      "w-9 h-9 mx-auto flex flex-col items-center justify-center rounded text-sm font-medium mt-1 relative transition-all",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded text-xs",
                        isToday(dayDate) &&
                          "bg-primary text-primary-foreground font-bold",
                        isSameDay(dayDate, currentDate) &&
                          !isToday(dayDate) &&
                          "bg-accent text-lime-dark ring-1 ring-primary/30",
                      )}
                    >
                      {format(dayDate, "d")}
                    </span>
                    {dayJobs.length > 0 && (
                      <div className="flex gap-[1px] mt-0.5">
                        {dayJobs.slice(0, 3).map((_, i) => (
                          <span
                            key={i}
                            className="w-[3px] h-[3px] rounded-full bg-primary"
                          />
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dayJobs = getJobsForDate(monthJobs, day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setCurrentDate(day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center text-xs relative transition-all rounded transition-all hover:brightness-95 dark:hover:brightness-105",
                      !isSameMonth(day, currentDate) &&
                        "text-muted-foreground/30",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded",
                        isToday(day) &&
                          "bg-primary text-primary-foreground font-bold",
                        isSameDay(day, currentDate) &&
                          !isToday(day) &&
                          "bg-accent text-lime-dark ring-1 ring-primary/30",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayJobs.length > 0 && (
                      <div className="flex gap-[1px] mt-0.5">
                        {dayJobs.slice(0, 3).map((_, idx) => (
                          <span
                            key={idx}
                            className="w-[3px] h-[3px] rounded-full bg-primary"
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto bg-background px-4">
        {isInitialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum agendamento</p>
            <Button
              variant="outline"
              className="mt-4 transition-all hover:brightness-95 dark:hover:brightness-105"
              onClick={() => handleOpenNewEvent()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar agendamento
            </Button>
          </div>
        ) : (
          sections.map((section) => {
            const sectionDate = new Date(section.title + "T00:00:00");
            const dayName = format(sectionDate, "EEEE", { locale: ptBR });
            const formattedDate = format(sectionDate, "dd 'de' MMMM", {
              locale: ptBR,
            });
            const isTodayDate = isToday(sectionDate);

            return (
              <div key={section.title}>
                <div
                  className={cn(
                    "p-4 text-sm font-semibold capitalize text-primary",
                  )}
                >
                  {isTodayDate ? "Hoje, " : ""}
                  {dayName}, {formattedDate}
                </div>

                {section.data.map((job) => {
                  if (!job.id) return null;
                  const priceTag = extractPriceTag(job);
                  return (
                    <div
                      key={job.id}
                      className={cn(
                        "w-full flex border-b border-border bg-card overflow-hidden rounded-md",
                        "transition-all hover:brightness-95 dark:hover:brightness-105",
                        "border-l-4 border-l-accent",
                      )}
                    >
                      <button
                        onClick={() => handleOpenDetails(job)}
                        className="flex-1 px-4 py-3 flex gap-3 text-left min-w-0"
                      >
                        <div className="text-center min-w-[50px]">
                          <span className="text-lg font-bold text-foreground">
                            {dayjs(job.startDateTime).format("HH:mm")}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {formatDuration(job.durationInHours)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm line-clamp-1">
                            {job.title}
                          </h4>
                          {job.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {job.subtitle}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {job.tags
                              .filter((t) => !t.label.startsWith("R$"))
                              .map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-secondary text-secondary-foreground"
                                >
                                  {tag.label}
                                </span>
                              ))}
                            {priceTag && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-accent/20 text-accent-foreground">
                                {priceTag}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => handleOpenNewEvent()}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg z-40 hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      <NewJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refresh()}
        initialDate={modalInitialDate}
        jobToEdit={
          jobToEdit
            ? allJobs.find((j) => j.id === jobToEdit.originalJobId)
            : undefined
        }
      />

      <OpportunityDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        job={selectedJobForDetails}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
        onRevertToOffer={handleRevertToOffer}
        initialHasApplied={initialHasApplied}
        initialApplicationsCount={initialApplicationsCount}
      />

      <AlertDialog open={revertConfirmOpen} onOpenChange={setRevertConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja transformar este agendamento em uma oferta? Isso removerá o
              profissional atual e tornará a vaga disponível para outros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault();
                handleRevertConfirmed();
              }}
              disabled={isReverting}
            >
              {isReverting ? "Processando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirmed();
              }}
              disabled={isDeleting}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── DesktopAgenda ───────────────────────────────────────────────────────────

function DesktopAgenda() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isDark } = useThemeColors();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();
  const [jobToEdit, setJobToEdit] = useState<JobAgendaCardItem | undefined>();
  const [jobToDelete, setJobToDelete] = useState<
    JobAgendaCardItem | undefined
  >();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<
    Job | undefined
  >();
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false);
  const [jobToRevert, setJobToRevert] = useState<Job | undefined>();
  const [isReverting, setIsReverting] = useState(false);
  const [initialHasApplied, setInitialHasApplied] = useState<
    boolean | undefined
  >();
  const [initialApplicationsCount, setInitialApplicationsCount] = useState<
    number | undefined
  >();

  const {
    monthJobs,
    allJobs,
    isInitialLoading,
    isChangingMonth,
    changeMonth,
    refresh,
    removeJobs,
  } = useScheduleData(user?.id, startOfMonth(new Date()));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDaysArray = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Jobs do dia selecionado
  const selectedDateJobs = useMemo(
    () => (selectedDate ? getJobsForDate(monthJobs, selectedDate) : []),
    [monthJobs, selectedDate],
  );

  const handleOpenNewEvent = (date?: Date, job?: JobAgendaCardItem) => {
    setJobToEdit(job);
    setModalInitialDate(
      date || job?.startDateTime || selectedDate || new Date(),
    );
    setModalOpen(true);
  };

  const handleOpenDetails = async (job: JobAgendaCardItem) => {
    const fullJob = allJobs.find(
      (j) => j.id === job.originalJobId || j.id === job.id,
    );
    setSelectedJobForDetails(fullJob);

    if (fullJob && user) {
      const isOwner =
        fullJob.from &&
        typeof fullJob.from === "object" &&
        fullJob.from.id === user.id;
      const isOffer = fullJob.visibility !== "PRIVATE";

      const [applied, apps] = await Promise.all([
        jobApplicationService.hasUserAppliedForJob(fullJob.id, user.id),
        isOwner && isOffer
          ? jobApplicationService.getApplicationsForJob(fullJob.id)
          : Promise.resolve(null),
      ]);

      setInitialHasApplied(applied);
      if (apps) {
        setInitialApplicationsCount(apps.totalDocs);
      } else {
        setInitialApplicationsCount(0);
      }
    }

    setDetailsModalOpen(true);
  };

  const handleEditFromDetails = (job: Job) => {
    setDetailsModalOpen(false);
    handleOpenNewEvent(undefined, formatJobAsAgendaCardItem(job));
  };

  const handleDeleteFromDetails = (job: Job) => {
    setDetailsModalOpen(false);
    setJobToDelete(formatJobAsAgendaCardItem(job));
    setDeleteConfirmOpen(true);
  };

  const handleRevertToOffer = (job: Job) => {
    setJobToRevert(job);
    setRevertConfirmOpen(true);
  };

  const handleRevertConfirmed = async () => {
    if (!jobToRevert) return;
    setIsReverting(true);
    try {
      const jobsToUpdate = [jobToRevert];

      if (
        jobToRevert.singlePaymentForMutipleDates &&
        (jobToRevert.parentRef ||
          (jobToRevert.additionalDates &&
            jobToRevert.additionalDates.length > 0))
      ) {
        const parentId = jobToRevert.parentRef || jobToRevert.id;
        const related = allJobs.filter(
          (j) => j.parentRef === parentId || j.id === parentId,
        );
        related.forEach((rj) => {
          if (!jobsToUpdate.find((j) => j.id === rj.id)) {
            jobsToUpdate.push(rj);
          }
        });
      }

      await Promise.all(
        jobsToUpdate.map((j) =>
          jobService.updateJob(j.id, {
            to: null,
            transferredAt: null,
            visibility: j.visibility === "PRIVATE" ? "PUBLIC" : j.visibility,
          }),
        ),
      );

      toast.success(
        jobsToUpdate.length > 1
          ? `${jobsToUpdate.length} agendamentos retornados para oferta`
          : "Agendamento retornado para oferta",
      );
      setDetailsModalOpen(false);
      refresh();
    } catch (error) {
      console.error("Erro ao retornar agendamento para oferta:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsReverting(false);
      setRevertConfirmOpen(false);
      setJobToRevert(undefined);
    }
  };

  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
    changeMonth(startOfMonth(newDate));
  };

  const handleDeleteConfirmed = async () => {
    if (!jobToDelete?.id) return;

    setIsDeleting(true);
    try {
      await jobService.deleteJob(jobToDelete.originalJobId || jobToDelete.id);
      removeJobs([jobToDelete.id]);
      toast.success("Agendamento excluído com sucesso");
      refresh();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setJobToDelete(undefined);
    }
  };

  if (authLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarIcon className="w-20 h-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-2">
            Faça login para ver sua agenda
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Acesse sua conta para gerenciar seus eventos, plantões e
            compromissos.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Entrar na plataforma
          </Button>
        </div>
      </div>
    );
  }

  const loading = isInitialLoading || isChangingMonth;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9 rounded-lg transition-all hover:brightness-95 dark:hover:brightness-105"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="page-header mb-0">
            <h1 className="page-title">Agenda</h1>
            <p className="page-subtitle">Gerencie seus compromissos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="btn-lime hover:brightness-95 dark:hover:brightness-105 transition-opacity"
            onClick={() => handleOpenNewEvent()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo agendamento
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-md shadow-sm overflow-hidden">
          <div className="p-4 border-b border-muted flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleMonthChange(
                    isCalendarExpanded
                      ? subMonths(currentDate, 1)
                      : subWeeks(currentDate, 1),
                  )
                }
                className="transition-all hover:brightness-95 dark:hover:brightness-105"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground capitalize min-w-[160px] text-center">
                {isCalendarExpanded
                  ? format(currentDate, "MMMM yyyy", { locale: ptBR })
                  : `${format(weekStart, "dd", { locale: ptBR })} - ${format(weekEnd, "dd 'de' MMM", { locale: ptBR })}`}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleMonthChange(
                    isCalendarExpanded
                      ? addMonths(currentDate, 1)
                      : addWeeks(currentDate, 1),
                  )
                }
                className="transition-all hover:brightness-95 dark:hover:brightness-105"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMonthChange(new Date())}
                className="transition-all hover:brightness-95 dark:hover:brightness-105"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                className="gap-1 transition-all hover:brightness-95 dark:hover:brightness-105"
              >
                {isCalendarExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Retrair
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Expandir
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div
                key={isCalendarExpanded ? "month" : "week"}
                className="grid grid-cols-7 gap-1"
              >
                {isCalendarExpanded ? (
                  <>
                    {emptyDays.map((_, index) => (
                      <div key={`empty-${index}`} className="aspect-square" />
                    ))}
                    {days.map((day) => {
                      const dayJobs = getJobsForDate(monthJobs, day);
                      const hasJobs = dayJobs.length > 0;
                      const isSelected =
                        selectedDate && isSameDay(day, selectedDate);

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          onDoubleClick={() => handleOpenNewEvent(day)}
                          className={cn(
                            "aspect-square flex flex-col items-center justify-center transition-all relative rounded-lg p-2 transition-all hover:brightness-95 dark:hover:brightness-105",
                            !isSameMonth(day, currentDate) &&
                              "text-muted-foreground/30",
                          )}
                        >
                          <span
                            className={cn(
                              "w-7 h-7 flex items-center justify-center rounded text-sm font-medium transition-all",
                              isToday(day) &&
                                !isSelected &&
                                "ring-2 ring-accent/70 text-foreground font-semibold",
                              isSelected &&
                                "bg-accent text-primary shadow-sm w-8 h-8",
                            )}
                          >
                            {format(day, "d")}
                          </span>
                          {hasJobs && (
                            <div className="flex gap-[2px] mt-0.5 h-[6px]">
                              {dayJobs.slice(0, 3).map((job, idx) => (
                                <span
                                  key={idx}
                                  className={cn(
                                    "w-[4px] h-[4px] rounded-full",
                                    getJobDotColor(job),
                                  )}
                                />
                              ))}
                              {dayJobs.length > 3 && (
                                <span className="text-[7px] font-medium text-muted-foreground leading-none">
                                  +{dayJobs.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  weekDaysArray.map((day) => {  
                    const dayJobs = getJobsForDate(monthJobs, day);
                    const hasJobs = dayJobs.length > 0;
                    const isSelected =
                      selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        onDoubleClick={() => handleOpenNewEvent(day)}
                        className={cn(
                          "py-4 flex flex-col items-center justify-center transition-all relative hover:brightness-95 dark:hover:brightness-105 rounded-lg",
                          !isSameMonth(day, currentDate) &&
                            "text-muted-foreground/50",
                        )}
                      >
                        <span
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg text-base font-medium transition-all",
                            isToday(day) &&
                              !isSelected &&
                              "ring-2 ring-accent/70 text-primary font-semibold",
                            isSelected &&
                              "bg-accent text-primary shadow-sm",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {hasJobs && (
                          <div className="flex gap-[2px] mt-1.5">
                            {dayJobs.slice(0, 3).map((job, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  "w-[5px] h-[5px] rounded-full",
                                  getJobDotColor(job),
                                )}
                              />
                            ))}
                            {dayJobs.length > 3 && (
                              <span className="text-[8px] font-medium text-muted-foreground leading-none ml-0.5">
                                +{dayJobs.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="space-y-4">
          <div className="bg-card rounded-md p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground capitalize">
                  {selectedDate
                    ? format(selectedDate, "EEEE", { locale: ptBR })
                    : "Selecione um dia"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDate
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })
                    : ""}
                </p>
              </div>
            </div>

            {selectedDateJobs.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum compromisso</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => handleOpenNewEvent()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar agendamento
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {selectedDateJobs.length} compromisso
                {selectedDateJobs.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {selectedDateJobs.map((job, index) => {
            if (!job.id) return null;
            const priceTag = extractPriceTag(job);

            return (
              <div
                key={job.id}
                className={cn(
                  "w-full bg-card rounded-md shadow-card overflow-hidden group relative",
                  "hover:shadow-elevated transition-all cursor-pointer",
                  "border-l-4 border-l-primary",
                )}
              >
                <button
                  onClick={() => handleOpenDetails(job)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between mb-2 pr-8">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground line-clamp-1">
                        {job.title}
                      </h4>
                      {job.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {job.subtitle}
                        </p>
                      )}
                    </div>
                    {job.caption && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium ml-2 shrink-0 bg-secondary text-secondary-foreground">
                        {job.caption}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                    <span className="font-medium">
                      {dayjs(job.startDateTime).format("HH:mm")}
                    </span>
                    <span className="px-1.5 py-0.5 bg-secondary rounded text-xs">
                      {formatDuration(job.durationInHours)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {job.tags
                      .filter((t) => !t.label.startsWith("R$"))
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag.label}
                        </span>
                      ))}
                    {priceTag && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/20 text-accent-foreground">
                        {priceTag}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      <NewJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refresh()}
        initialDate={modalInitialDate}
        jobToEdit={
          jobToEdit
            ? allJobs.find((j) => j.id === jobToEdit.originalJobId)
            : undefined
        }
      />

      <OpportunityDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        job={selectedJobForDetails}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
        onRevertToOffer={handleRevertToOffer}
        initialHasApplied={initialHasApplied}
        initialApplicationsCount={initialApplicationsCount}
      />

      <AlertDialog open={revertConfirmOpen} onOpenChange={setRevertConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja transformar este agendamento em uma oferta? Isso removerá o
              profissional atual e tornará a vaga disponível para outros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault();
                handleRevertConfirmed();
              }}
              disabled={isReverting}
            >
              {isReverting ? "Processando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirmed();
              }}
              disabled={isDeleting}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Schedule() {
  const isMobile = useIsMobile();
  const { user } = useAuthContext();
  const { medicoModeActive } = useUserMode();

  const isInstitutionalUser = user?.accountType === 'institutional';

  if (isInstitutionalUser) {
    return (
      <MainLayout mobileTitle="Agenda">
        <InstitutionalSchedule />
      </MainLayout>
    );
  }

  return (
    <MainLayout mobileTitle="Agenda">
      {isMobile ? <MobileAgenda /> : <DesktopAgenda />}
    </MainLayout>
  );
}
