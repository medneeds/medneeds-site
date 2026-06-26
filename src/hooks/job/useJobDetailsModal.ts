import { useEffect, useState, useCallback, useMemo } from "react";
import { Job } from "@/config/types.ts";
import { jobApplicationService } from "@/services/jobs/JobApplicationService.ts";
import { jobService } from "@/config/app.ts";
import { toast } from "sonner";
import dayjs from "dayjs";
import type { JobApplication } from "@/types/api.types.ts";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ModalAction = {
  label: string;
  icon: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
} | null;

export interface JobApplicationWithContext {
  application: JobApplication;
  job: Job;
  dateContext: string;
}

interface UseJobDetailsModalOptions {
  open: boolean;
  job: Job | undefined;
  initialHasApplied?: boolean;
  initialApplicationsCount?: number;
  onEdit?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onRevertToOffer?: (job: Job) => void;
  onAssumeOffer?: (job: Job) => void;
  onApplied?: () => void;
  onRefresh?: () => void;
  hideCancel?: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useJobDetailsModal({
  open,
  job,
  initialHasApplied,
  initialApplicationsCount,
  onEdit,
  onDelete,
  onApplied,
  onRefresh,
  hideCancel,
}: UseJobDetailsModalOptions) {
  const { user } = useAuthContext();

  // ─── Estado ───────────────────────────────────────────────────────────────

  const [hasApplied, setHasApplied] = useState(initialHasApplied ?? false);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isApplyingToAll, setIsApplyingToAll] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [applicationsCount, setApplicationsCount] = useState(
    initialApplicationsCount ?? 0,
  );

  // Confirmation dialogs
  const [showConfirmApply, setShowConfirmApply] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [pendingApplyAction, setPendingApplyAction] = useState<{
    type: "single" | "singleDate" | "allDates";
    jobId?: string;
    jobs?: Job[];
  } | null>(null);

  // Application status
  const [applicationRequestedAt, setApplicationRequestedAt] =
    useState<Date | null>(null);

  // Related jobs (parent/children)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [loadingRelatedJobs, setLoadingRelatedJobs] = useState(false);

  // All applications (for multiple dates)
  const [allApplications, setAllApplications] = useState<
    JobApplicationWithContext[]
  >([]);
  const [loadingAllApplications, setLoadingAllApplications] = useState(false);
  const [userApplicationsByJob, setUserApplicationsByJob] = useState<
    Map<string, JobApplication>
  >(new Map());
  const [hasApplications, setHasApplications] = useState(false);

  // ─── Derivados ────────────────────────────────────────────────────────────

  const isOwner = !!(
    job?.from &&
    typeof job.from === "object" &&
    job.from.id === user?.id
  );
  const isTransferred = !!job?.transferredAt;
  const isTransferredToUser =
    job?.to &&
    typeof job.to === "object" &&
    user &&
    job.to.id === user.id &&
    isOwner;
  const isOffer = job?.visibility !== "PRIVATE";
  const canEdit = isOwner && !isTransferred;
  const canDelete = isOwner && !isTransferred;
  const isExpired = !!(
    job?.startDateTime && new Date(job.startDateTime) <= new Date()
  );
  const hasSinglePayment = job?.singlePaymentForMutipleDates === true;
  const hasAdditionalDates = !!(
    job?.additionalDates &&
    Array.isArray(job.additionalDates) &&
    job.additionalDates.length > 0
  );
  const hasMultipleDates = hasAdditionalDates;

  const canAssumeOffer = isOwner && !isTransferred && isOffer;
  const canShare =
    job?.visibility === "PUBLIC" || (job?.visibility === "UNLISTED" && isOwner);
  const canRevertToOffer =
    isTransferredToUser || (isOwner && job?.visibility === "PRIVATE");

  // ─── Carregar related jobs ────────────────────────────────────────────────

  const loadRelatedJobs = useCallback(async (currentJob: Job) => {
    setLoadingRelatedJobs(true);
    try {
      if (currentJob.parentRef) {
        // Se este job tem um pai, carregar o pai e todos os irmãos
        const parentJob = await jobService.getJob(currentJob.parentRef);
        if (parentJob) {
          const childrenResult = await jobService.getJobs({
            where: { parentRef: { equals: currentJob.parentRef } },
            limit: 100,
          });
          const allJobs = [
            parentJob as unknown as Job,
            ...(childrenResult.docs as unknown as Job[]),
          ];
          allJobs.sort(
            (a, b) =>
              new Date(a.startDateTime).getTime() -
              new Date(b.startDateTime).getTime(),
          );
          setRelatedJobs(allJobs);
        }
        return;
      }

      // Se este job é pai, carregar todos os filhos
      const childrenResult = await jobService.getJobs({
        where: { parentRef: { equals: currentJob.id } },
        limit: 100,
      });
      const allJobs = childrenResult.docs as unknown as Job[];
      allJobs.sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      );
      setRelatedJobs(allJobs);
    } catch (error) {
      console.error(
        "[useJobDetailsModal] Erro ao carregar jobs relacionados:",
        error,
      );
    } finally {
      setLoadingRelatedJobs(false);
    }
  }, []);

  // ─── Carregar todas as aplicações ─────────────────────────────────────────

  const loadAllApplications = useCallback(
    async (currentJob: Job, related: Job[] = []) => {
      setLoadingAllApplications(true);
      try {
        const jobsToCheck = [currentJob, ...related];
        const allApps: JobApplicationWithContext[] = [];

        try {
          const jobIds = jobsToCheck.map((j) => j.id);
          const result = await jobApplicationService.getJobApplications({
            where: { job: { in: jobIds } },
            limit: 500,
          });
          const applications = result.docs || [];

          applications.forEach((application) => {
            const appJobId =
              typeof application.job === "object" && application.job !== null
                ? application.job.id
                : application.job;
            const jobToCheck =
              jobsToCheck.find((j) => j.id === appJobId) || currentJob;

            const dateContext = jobToCheck.startDateTime
              ? new Date(jobToCheck.startDateTime).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Data não definida";

            allApps.push({
              application,
              job: jobToCheck,
              dateContext,
            });
          });
        } catch (error) {
          console.error(
            `[useJobDetailsModal] Erro ao carregar aplicações para os jobs:`,
            error,
          );
        }

        setAllApplications(allApps);

        const userAppsByJob = new Map<string, JobApplication>();
        let userApplied = false;

        allApps.forEach((app) => {
          const applicant = app.application.applicant;
          const isUserApplication =
            applicant === user?.id ||
            (typeof applicant === "object" &&
              applicant !== null &&
              "id" in applicant &&
              (applicant as { id: string }).id === user?.id);

          if (isUserApplication) {
            userAppsByJob.set(app.job.id, app.application);
            userApplied = true;
          }
        });

        setUserApplicationsByJob(userAppsByJob);
        setHasApplied(userApplied);
        setHasApplications(allApps.length > 0);

        const uniqueApplicants = new Set<string>();
        allApps.forEach((app) => {
          const applicant = app.application.applicant;
          if (applicant) {
            const id =
              typeof applicant === "object" &&
              applicant !== null &&
              "id" in applicant
                ? (applicant as { id: string }).id
                : (applicant as string);
            if (id) uniqueApplicants.add(id);
          }
        });
        setApplicationsCount(uniqueApplicants.size);

        // Calcular hasMultipleDates
        const hasAdditional =
          Array.isArray(currentJob.additionalDates) &&
          currentJob.additionalDates.length > 0;
      } catch (error) {
        console.error(
          "[useJobDetailsModal] Erro ao carregar aplicações:",
          error,
        );
      } finally {
        setLoadingAllApplications(false);
      }
    },
    [user?.id],
  );

  const hasUserAppliedToJob = useCallback(
    (jobId: string) => userApplicationsByJob.has(jobId),
    [userApplicationsByJob],
  );

  // ─── Efeito: carregar dados quando o modal abre ──────────────────────────

  useEffect(() => {
    if (!open || !job || !user) {
      // Resetar estado quando fecha
      if (!open) {
        setHasApplied(initialHasApplied ?? false);
        setApplicationsCount(initialApplicationsCount ?? 0);
        setRelatedJobs([]);
        setAllApplications([]);
        setUserApplicationsByJob(new Map());
        setHasApplications(false);
      }
      return;
    }

    // Verificar status de aplicação
    if (initialHasApplied !== undefined) {
      setHasApplied(initialHasApplied);
    } else {
      setLoadingApplication(true);
      jobApplicationService
        .hasUserAppliedForJob(job.id, user.id)
        .then((applied) => setHasApplied(applied))
        .catch(() => {})
        .finally(() => setLoadingApplication(false));
    }

    if (initialApplicationsCount !== undefined) {
      setApplicationsCount(initialApplicationsCount);
    }

    // Carregar related jobs se tem datas adicionais
    const jobHasAdditionalDates = !!(
      job.additionalDates &&
      Array.isArray(job.additionalDates) &&
      job.additionalDates.length > 0
    );
    if (jobHasAdditionalDates || job.parentRef) {
      loadRelatedJobs(job);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    job?.id,
    user?.id,
    initialHasApplied,
    initialApplicationsCount,
    loadRelatedJobs,
  ]);

  // Carregar aplicações quando job ou relatedJobs mudarem
  useEffect(() => {
    if (!open || !job || !user) return;

    const jobHasAdditionalDates = !!(
      job.additionalDates &&
      Array.isArray(job.additionalDates) &&
      job.additionalDates.length > 0
    );

    if (relatedJobs.length > 0 && !loadingRelatedJobs) {
      loadAllApplications(job, relatedJobs);
    } else if (
      !loadingRelatedJobs &&
      !jobHasAdditionalDates &&
      !job.parentRef
    ) {
      // Sem related jobs, carregar apenas para o principal
      const jobIsOwner = !!(
        job.from &&
        typeof job.from === "object" &&
        job.from.id === user.id
      );
      const jobIsOffer = job.visibility !== "PRIVATE";
      if (jobIsOwner && jobIsOffer && initialApplicationsCount === undefined) {
        jobApplicationService
          .getApplicationsForJob(job.id)
          .then((result) => setApplicationsCount(result.totalDocs))
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    job?.id,
    relatedJobs.length,
    loadingRelatedJobs,
    loadAllApplications,
    user?.id,
    initialApplicationsCount,
  ]);

  // ─── Carregar applicationRequestedAt ──────────────────────────────────────

  useEffect(() => {
    if (!user || !job || !hasApplied) {
      setApplicationRequestedAt(null);
      return;
    }
    jobApplicationService.getUserJobApplication(job.id, user.id).then((app) => {
      if (app?.createdAt) {
        setApplicationRequestedAt(new Date(app.createdAt));
      } else {
        setApplicationRequestedAt(null);
      }
    });
  }, [user, job, hasApplied]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Abre o diálogo de confirmação em vez de aplicar diretamente
  const handleApply = useCallback(() => {
    if (!job || !user || hasApplied) return;
    setPendingApplyAction({ type: "single" });
    setShowConfirmApply(true);
  }, [job, user, hasApplied]);

  // Executa a aplicação após confirmação
  const confirmApply = useCallback(async () => {
    if (!job || !user) return;
    setShowConfirmApply(false);
    const action = pendingApplyAction;
    setPendingApplyAction(null);

    if (action?.type === "allDates" && action.jobs) {
      // Aplicar para todas as datas
      setIsApplyingToAll(true);
      try {
        await Promise.all(
          action.jobs.map(async (jobItem) => {
            // Double-check no servidor
            const alreadyApplied =
              await jobApplicationService.hasUserAppliedForJob(
                jobItem.id,
                user.id,
              );
            if (alreadyApplied) return;
            const publisherId =
              typeof jobItem.from === "object"
                ? jobItem.from?.id
                : jobItem.from;
            return jobApplicationService.createJobApplication({
              job: jobItem.id,
              publisher: publisherId || "",
              applicant: user.id,
            });
          }),
        );
        toast.success(`Solicitações enviadas com sucesso.`);
        if (job) await loadAllApplications(job, relatedJobs);
        onApplied?.();
        onRefresh?.();
      } catch (error) {
        console.error("Error applying to all dates:", error);
        toast.error(
          "Não foi possível enviar as solicitações. Tente novamente.",
        );
      } finally {
        setIsApplyingToAll(false);
      }
      return;
    }

    if (action?.type === "singleDate" && action.jobId) {
      // Aplicar para uma data específica
      setIsApplying(true);
      try {
        // Double-check no servidor
        const alreadyApplied = await jobApplicationService.hasUserAppliedForJob(
          action.jobId,
          user.id,
        );
        if (alreadyApplied) {
          toast.error("Você já solicitou esta data.");
          setIsApplying(false);
          return;
        }
        const targetJob = [job, ...relatedJobs].find(
          (j) => j.id === action.jobId,
        );
        if (!targetJob) {
          setIsApplying(false);
          return;
        }
        const publisherId =
          typeof targetJob.from === "object"
            ? targetJob.from?.id
            : targetJob.from;
        await jobApplicationService.createJobApplication({
          job: action.jobId,
          publisher: publisherId || "",
          applicant: user.id,
        });
        toast.success("Candidatura enviada com sucesso!");
        await loadAllApplications(job, relatedJobs);
        onApplied?.();
        onRefresh?.();
      } catch (error) {
        console.error("Error applying for specific date:", error);
        toast.error("Erro ao enviar candidatura. Tente novamente.");
      } finally {
        setIsApplying(false);
      }
      return;
    }

    // Aplicação simples (single)
    setIsApplying(true);
    try {
      // Double-check no servidor
      const alreadyApplied = await jobApplicationService.hasUserAppliedForJob(
        job.id,
        user.id,
      );
      if (alreadyApplied) {
        toast.error("Você já solicitou esta oferta.");
        setIsApplying(false);
        return;
      }
      await jobApplicationService.createJobApplication({
        job: job.id,
        publisher: typeof job.from === "object" ? job.from.id : job.from,
        applicant: user.id,
      });
      setHasApplied(true);
      toast.success("Candidatura enviada com sucesso!");
      onApplied?.();
      onRefresh?.();
    } catch (error) {
      console.error("Error applying for job:", error);
      toast.error("Erro ao enviar candidatura. Tente novamente.");
    } finally {
      setIsApplying(false);
    }
  }, [
    job,
    user,
    pendingApplyAction,
    relatedJobs,
    loadAllApplications,
    onApplied,
    onRefresh,
  ]);

  // Abre o diálogo de confirmação de cancelamento
  const handleCancelApplication = useCallback(() => {
    if (!job || !user || !hasApplied) return;
    setShowConfirmCancel(true);
  }, [job, user, hasApplied]);

  // Executa o cancelamento após confirmação
  const confirmCancel = useCallback(async () => {
    if (!job || !user) return;
    setShowConfirmCancel(false);

    setIsCancelling(true);
    try {
      if (hasSinglePayment && relatedJobs.length > 0) {
        const allJobs = [job, ...relatedJobs];
        await Promise.allSettled(
          allJobs.map((jobItem) =>
            jobApplicationService.cancelJobApplication(jobItem.id, user.id),
          ),
        );
      } else {
        await jobApplicationService.cancelJobApplication(job.id, user.id);
      }

      setHasApplied(false);
      setApplicationRequestedAt(null);
      toast.success("Solicitação cancelada com sucesso!");
      onApplied?.();
      onRefresh?.();

      if (relatedJobs.length > 0) {
        await loadAllApplications(job, relatedJobs);
      }
    } catch (error) {
      console.error("Error cancelling application:", error);
      toast.error("Erro ao cancelar solicitação. Tente novamente.");
    } finally {
      setIsCancelling(false);
    }
  }, [
    job,
    user,
    hasSinglePayment,
    relatedJobs,
    onApplied,
    onRefresh,
    loadAllApplications,
  ]);

  // Abre confirmação para aplicar em todas as datas
  const handleApplyToAllDates = useCallback(
    (jobs: Job[]) => {
      if (!user) return;
      // Filtrar: não expirados E não já aplicados
      const availableJobs = jobs.filter(
        (j) =>
          j.startDateTime &&
          dayjs(j.startDateTime).isAfter(dayjs()) &&
          !userApplicationsByJob.has(j.id),
      );
      if (availableJobs.length === 0) {
        toast.warning("Nenhuma data disponível para solicitar.");
        return;
      }
      setPendingApplyAction({ type: "allDates", jobs: availableJobs });
      setShowConfirmApply(true);
    },
    [user, userApplicationsByJob],
  );

  // Abre confirmação para aplicar em uma data específica
  const handleApplyToJob = useCallback(
    (jobId: string) => {
      if (!job || !user || userApplicationsByJob.has(jobId)) return;
      setPendingApplyAction({ type: "singleDate", jobId });
      setShowConfirmApply(true);
    },
    [job, user, userApplicationsByJob],
  );

  const handleCancelApplicationForJob = useCallback(
    async (jobId: string) => {
      if (!job || !user || !userApplicationsByJob.has(jobId)) return;

      setIsCancelling(true);
      try {
        if (hasSinglePayment && relatedJobs.length > 0) {
          const allJobs = [job, ...relatedJobs];
          await Promise.allSettled(
            allJobs.map((jobItem) =>
              jobApplicationService.cancelJobApplication(jobItem.id, user.id),
            ),
          );
        } else {
          await jobApplicationService.cancelJobApplication(jobId, user.id);
        }
        toast.success("Solicitação cancelada com sucesso!");
        await loadAllApplications(job, relatedJobs);
        onApplied?.();
        onRefresh?.();
      } catch (error) {
        console.error("Error cancelling application for specific date:", error);
        toast.error("Erro ao cancelar solicitação da data. Tente novamente.");
      } finally {
        setIsCancelling(false);
      }
    },
    [
      job,
      user,
      userApplicationsByJob,
      relatedJobs,
      loadAllApplications,
      onApplied,
      onRefresh,
      hasSinglePayment,
    ],
  );

  // Cancelar pendingApply se fechar o dialog
  const dismissConfirmApply = useCallback(() => {
    setShowConfirmApply(false);
    setPendingApplyAction(null);
  }, []);

  const dismissConfirmCancel = useCallback(() => {
    setShowConfirmCancel(false);
  }, []);

  const handleConfirmTransfer = useCallback(
    async (applicantId: string) => {
      if (!job) return;

      setIsTransferring(true);
      try {
        if (hasSinglePayment && relatedJobs.length > 0) {
          const allJobs = [job, ...relatedJobs];

          // Transferir todos os jobs disponíveis
          await Promise.allSettled(
            allJobs.map(async (jobItem) => {
              await jobService.updateJob(jobItem.id, {
                to: applicantId,
                transferredAt: new Date().toISOString(),
              });
            }),
          );

          // Aceitar aplicações para todos os jobs
          await Promise.allSettled(
            allJobs.map(async (jobItem) => {
              const appAuth = allApplications.find(
                (a) =>
                  a.job.id === jobItem.id &&
                  (typeof a.application.applicant === "object" &&
                  a.application.applicant !== null
                    ? (a.application.applicant as { id: string }).id
                    : a.application.applicant) === applicantId,
              )?.application;

              if (appAuth) {
                await jobApplicationService.updateJobApplicationStatus(
                  appAuth.id,
                  "ACCEPTED",
                );
              }
            }),
          );

          toast.success("Transferência realizada com sucesso para o bloco.");
        } else {
          // Transferência normal
          await jobService.updateJob(job.id, {
            to: applicantId,
            transferredAt: new Date().toISOString(),
          });

          const application = allApplications.find(
            (a) =>
              (typeof a.application.applicant === "object" &&
              a.application.applicant !== null
                ? (a.application.applicant as { id: string }).id
                : a.application.applicant) === applicantId,
          )?.application;

          if (application) {
            await jobApplicationService.updateJobApplicationStatus(
              application.id,
              "ACCEPTED",
            );
          }

          toast.success("Transferência realizada com sucesso.");
        }

        if (relatedJobs.length > 0) {
          await loadAllApplications(job, relatedJobs);
        }
        onApplied?.();
        onRefresh?.();
      } catch (error) {
        console.error("Erro ao transferir job:", error);
        toast.error("Não foi possível transferir a oferta. Tente novamente.");
      } finally {
        setIsTransferring(false);
      }
    },
    [
      job,
      hasSinglePayment,
      relatedJobs,
      allApplications,
      loadAllApplications,
      onApplied,
      onRefresh,
    ],
  );

  // ─── Ações do toolbar (adaptado de useJobActionsToolbar) ──────────────────

  const [mainAction, secondaryAction]: [ModalAction, ModalAction] =
    useMemo(() => {
      if (!user || !job) return [null, null];

      // PRIORIDADE 1: Se foi transferido para o usuário
      if (isTransferredToUser) {
        return [null, null]; // No portal, não tem "Ver na agenda"
      }

      // PRIORIDADE 2: Se é o dono do job (e não foi transferido)
      if (isOwner && !isTransferred && !job.to && (onEdit || onDelete)) {
        const actions: ModalAction[] = [];

        // Editar (só se não tem aplicações ou não é PRIVATE)
        if (
          onEdit &&
          ((!loadingAllApplications && !hasApplications) ||
            job.visibility !== "PRIVATE")
        ) {
          actions.push({
            label: isOffer ? "Editar oferta" : "Editar agendamento",
            icon: "pencil",
            variant: "default",
            onPress: () => onEdit(job),
          });
        }

        // Excluir
        if (onDelete) {
          actions.push({
            label: "Excluir",
            icon: "trash",
            variant: "destructive",
            onPress: () => onDelete(job),
          });
        }

        if (actions.length > 0) {
          return [actions[0] || null, actions[1] || null];
        }
      }

      // Se foi transferido para outro usuário, não mostrar ações
      if (isTransferred && !isTransferredToUser) {
        return [null, null];
      }

      // Se o job já passou, não mostrar ações de solicitar
      if (isExpired) {
        return [null, null];
      }

      // Múltiplas datas sem singlePayment
      if (hasMultipleDates && !hasSinglePayment) {
        const allJobs = [job, ...relatedJobs];
        const availableJobs = allJobs.filter(
          (j) =>
            j.startDateTime &&
            dayjs(j.startDateTime).isAfter(dayjs()) &&
            !hasUserAppliedToJob(j.id),
        );

        if (availableJobs.length === 0) return [null, null];

        return [
          null,
          {
            label:
              availableJobs.length === 1
                ? "Solicitar 1 data disponível"
                : `Solicitar ${availableJobs.length} datas disponíveis`,
            icon: "repeat",
            loading: isApplyingToAll,
            disabled: isApplyingToAll,
            onPress: () => handleApplyToAllDates(allJobs),
          },
        ];
      }

      // Já aplicou - mostrar cancelar
      if (hasApplied) {
        if (isTransferred || !!job.to || hideCancel) return [null, null];

        return [
          {
            label: "Cancelar solicitação",
            icon: "repeat",
            variant: "destructive" as const,
            loading: isCancelling,
            disabled: isCancelling || isApplyingToAll,
            onPress: handleCancelApplication,
          },
          null,
        ];
      }

      // Job normal - solicitar
      return [
        null,
        {
          label: `Solicitar ${job.modality?.name}`,
          icon: "repeat",
          loading: isApplying,
          disabled: isApplying || loadingApplication,
          onPress: handleApply,
        },
      ];
    }, [
      user,
      job,
      isOwner,
      isTransferred,
      isTransferredToUser,
      isOffer,
      isExpired,
      hasMultipleDates,
      hasSinglePayment,
      hasApplications,
      hasApplied,
      loadingAllApplications,
      loadingApplication,
      isApplying,
      isCancelling,
      isApplyingToAll,
      relatedJobs,
      handleApply,
      handleCancelApplication,
      handleApplyToAllDates,
      onEdit,
      onDelete,
      hasUserAppliedToJob,
      hideCancel,
    ]);

  return {
    // Estado
    hasApplied,
    loadingApplication,
    isApplying,
    isCancelling,
    isApplyingToAll,
    isTransferring,
    applicationsCount,
    relatedJobs,
    loadingRelatedJobs,
    allApplications,
    loadingAllApplications,
    hasApplications,
    hasMultipleDates,
    hasSinglePayment,
    userApplicationsByJob,
    applicationRequestedAt,

    // Confirmation dialogs
    showConfirmApply,
    showConfirmCancel,
    pendingApplyAction,
    confirmApply,
    confirmCancel,
    dismissConfirmApply,
    dismissConfirmCancel,

    // Derivados
    isOwner,
    isTransferred,
    isTransferredToUser,
    isOffer,
    canEdit,
    canDelete,
    canAssumeOffer,
    canShare,
    canRevertToOffer,
    isExpired,

    // Ações toolbar
    mainAction,
    secondaryAction,

    // Handlers
    handleApply,
    handleCancelApplication,
    handleApplyToAllDates,
    handleApplyToJob,
    handleCancelApplicationForJob,
    handleConfirmTransfer,
    hasUserAppliedToJob,
  };
}
