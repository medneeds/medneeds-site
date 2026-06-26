import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout.tsx";
import {
  Loader2,
  ArrowLeftRight,
  Trash2,
  MapPin,
  Clock,
  Calendar,
  Check,
  X,
  User,
  Building2,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jobApplicationService } from "@/services/jobs/JobApplicationService.ts";
import { jobService } from "@/config/app.ts";
import { JobApplication, Media } from "@/types/api.types.ts";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Chip } from "@/components/ui/Chip.tsx";
import { UserAvatar } from "@/components/layout/user/UserAvatar.tsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";
import { cn } from "@/lib/utils.ts";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import institutionalService, { type TeamItem } from "@/services/institution/InstitutionalService.ts";
import { toast } from "sonner";
import { getAvatarUrl } from "@/utils/avatar.ts";
import { OpportunityDetailsModal } from "@/components/jobs/JobDetails/JobDetailsModal.tsx";
import { NewOfferModal } from "@/components/offer/NewOfferModal/NewOfferModal.tsx";
import { formatCurrency } from "@/utils/numberFormatter";
import { Job } from "@/config/types.ts";
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

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

type TabType = "received" | "sent";

// --- ApplicationCard ---
function ApplicationCard({
  application,
  activeTab,
  onDelete,
  onAccept,
  onReject,
  onOpenDetails,
}: {
  application: JobApplication;
  activeTab: TabType;
  onDelete: (app: JobApplication) => void;
  onAccept: (app: JobApplication) => void;
  onReject: (app: JobApplication) => void;
  onOpenDetails: (jobId: string, status: string) => void;
}) {
  const isReceived = activeTab === "received";

  const job =
    typeof application.job === "object"
      ? (application.job as unknown as Job)
      : null;
  const jobId =
    typeof application.job === "string"
      ? application.job
      : (application.job as any)?.id;

  const applicant =
    typeof application.applicant === "object"
      ? (application.applicant as any)
      : null;
  const publisher =
    typeof application.publisher === "object"
      ? (application.publisher as any)
      : null;
  const displayUser = isReceived ? applicant : publisher;

  const getStatusText = (status: string) => {
    if (isReceived) {
      switch (status) {
        case "ACCEPTED":
          return "Você transferiu";
        case "REJECTED":
          return "Rejeitada";
        case "PENDING":
          return "Recebida";
        default:
          return "Desconhecido";
      }
    } else {
      switch (status) {
        case "ACCEPTED":
          return "Aceita";
        case "REJECTED":
          return "Rejeitada";
        case "PENDING":
          return "Pendente";
        default:
          return "Desconhecido";
      }
    }
  };

  const statusColors: Record<string, string> = {
    ACCEPTED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all group relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={
              displayUser?.profilePicture &&
              typeof displayUser.profilePicture === "object"
                ? `${getAvatarUrl((displayUser.profilePicture as any).url)}`
                : undefined
            }
            alt={displayUser?.name || "Usuário"}
            fallback={displayUser?.name?.charAt(0)}
            className="w-10 h-10 border-2 border-background shadow-sm"
            size="lg"
          />

          <div>
            <h4 className="font-semibold text-foreground text-sm leading-tight">
              {isReceived && application.status === "ACCEPTED"
                ? `Transferido para ${(displayUser?.name as string | undefined)?.split(" ")[0] || "Usuário"}`
                : isReceived && application.status === "PENDING"
                  ? `${(displayUser?.name as string | undefined)?.split(" ")[0] || "Usuário"} solicitou`
                  : !isReceived && application.status === "PENDING"
                    ? "Você solicitou"
                    : `${(displayUser?.name as string | undefined)?.split(" ")[0] || "Usuário"} transferiu para você`}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dayjs(
                application.status === "PENDING"
                  ? application.createdAt
                  : application.updatedAt,
              ).fromNow()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReceived && application.status === "PENDING" && (
            <>
              <button
                onClick={() => onAccept(application)}
                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                title="Aceitar solicitação"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReject(application)}
                className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                title="Rejeitar solicitação"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          <Badge
            className={cn(
              "text-[10px] uppercase font-bold px-2 py-0.5",
              statusColors[application.status] ||
                "bg-background text-secondary-foreground",
            )}
          >
            {getStatusText(application.status)}
          </Badge>

          {application.status !== "ACCEPTED" && (
            <button
              onClick={() => onDelete(application)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              title="Excluir solicitação"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div
        onClick={() => job ? onOpenDetails(job.id, application.status) : jobId ? onOpenDetails(jobId, application.status) : undefined}
        className={cn(
          "bg-card/30 rounded-lg p-3 transition-colors",
          (job || jobId) ? "cursor-pointer hover:bg-card/50" : "",
        )}
      >
        {job ? (
          <>
            {(() => {
              const j = job as any;
              const instName =
                typeof j.institution === "object" && j.institution
                  ? j.institution.tradeName || j.institution.legalName || null
                  : null;
              const teamName =
                typeof j.team === "object" && j.team ? j.team.name || null : null;
              return (instName || teamName) ? (
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {instName && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      <Building2 className="w-3 h-3 shrink-0" />
                      {instName}
                    </span>
                  )}
                  {teamName && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-foreground/10 text-foreground text-xs font-medium">
                      <Users className="w-3 h-3 shrink-0" />
                      {teamName}
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            {typeof job.place === "object" && (job.place as any)?.name && (
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {(job.place as any).name}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 ml-5">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{dayjs(job.startDateTime).format("DD MMM YYYY")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{dayjs(job.startDateTime).format("HH:mm")}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 ml-5">
              {job.modality && (
                <Chip variant="blue" size="sm">
                  {typeof job.modality === "object"
                    ? (job.modality as any).name
                    : job.modality}
                </Chip>
              )}
              {job.clinicalArea && (
                <Chip variant="purple" size="sm">
                  {typeof job.clinicalArea === "object"
                    ? (job.clinicalArea as any).name
                    : job.clinicalArea}
                </Chip>
              )}
              {job.durationInHours && (
                <Chip variant="default" size="sm">
                  {job.durationInHours}h
                </Chip>
              )}
              {job.priceInCents != null && job.priceInCents > 0 && (
                <Chip variant="default" size="sm">
                  {formatCurrency(job.priceInCents / 100)}
                </Chip>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              Solicitação enviada em{" "}
              {dayjs(application.createdAt).format("DD MMM YYYY [às] HH:mm")}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- EmptyState ---
function EmptyState({ activeTab }: { activeTab: TabType }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-dashed border-border">
      <div className="w-16 h-16 rounded-full bg-foreground/30 flex items-center justify-center mb-4">
        <ArrowLeftRight className="w-8 h-8 text-primary opacity-50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {activeTab === "received"
          ? "Nenhuma solicitação recebida"
          : "Nenhuma solicitação enviada"}
      </h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        {activeTab === "received"
          ? "Você ainda não recebeu solicitações de outros profissionais para suas ofertas."
          : "Você ainda não enviou solicitações para as ofertas disponíveis."}
      </p>
    </div>
  );
}

function ApplicationsContent() {
  const { user } = useAuthContext();
  const { institutions } = useInstitutionalContext();
  const [activeTab, setActiveTab] = useState<TabType>("received");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterInstId, setFilterInstId] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [filterTeams, setFilterTeams] = useState<TeamItem[]>([]);

  useEffect(() => {
    if (!filterInstId) { setFilterTeams([]); setFilterTeamId(""); return; }
    institutionalService.listTeams(filterInstId).then(setFilterTeams).catch(() => {});
  }, [filterInstId]);

  // Confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<
    JobApplication | undefined
  >();
  const [isDeleting, setIsDeleting] = useState(false);

  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [applicationToAccept, setApplicationToAccept] = useState<
    JobApplication | undefined
  >();
  const [isAccepting, setIsAccepting] = useState(false);

  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [applicationToReject, setApplicationToReject] = useState<
    JobApplication | undefined
  >();
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState<string | undefined>();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Edit/Delete job from modal
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | undefined>();
  const [jobToDeleteFromModal, setJobToDeleteFromModal] = useState<Job | undefined>();
  const [deleteJobConfirmOpen, setDeleteJobConfirmOpen] = useState(false);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [initialHasApplied, setInitialHasApplied] = useState<
    boolean | undefined
  >();
  const [initialApplicationsCount, setInitialApplicationsCount] = useState<
    number | undefined
  >();

  const handleOpenDetails = async (id: string, applicationStatus?: string) => {
    setSelectedApplicationStatus(applicationStatus);
    setIsLoadingDetails(true);
    try {
      const fetchedJob = await jobService.getJob(id);
      setSelectedJob(fetchedJob);

      if (fetchedJob && user) {
        const isOwner =
          fetchedJob.from &&
          typeof fetchedJob.from === "object" &&
          fetchedJob.from.id === user.id;
        const isOffer = fetchedJob.visibility !== "PRIVATE";

        const [applied, apps] = await Promise.all([
          jobApplicationService.hasUserAppliedForJob(fetchedJob.id, user.id),
          isOwner && isOffer
            ? jobApplicationService.getApplicationsForJob(fetchedJob.id)
            : Promise.resolve(null),
        ]);

        setInitialHasApplied(applied);
        if (apps) {
          setInitialApplicationsCount(apps.totalDocs);
        } else {
          setInitialApplicationsCount(0);
        }
      }

      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching job details:", err);
      toast.error("Erro ao carregar detalhes da oferta.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditFromModal = (job: Job) => {
    setJobToEdit(job);
    setShowDetailsModal(false);
    setShowNewOfferModal(true);
  };

  const handleDeleteFromModal = (job: Job) => {
    setJobToDeleteFromModal(job);
    setShowDetailsModal(false);
    setDeleteJobConfirmOpen(true);
  };

  const handleDeleteJobConfirmed = async () => {
    if (!jobToDeleteFromModal) return;
    setIsDeletingJob(true);
    try {
      await jobService.deleteJob(jobToDeleteFromModal.id);
      toast.success("Oferta excluída com sucesso.");
      setApplications((prev) =>
        prev.filter((app) => {
          const jobId = typeof app.job === "object" ? (app.job as any).id : app.job;
          return jobId !== jobToDeleteFromModal.id;
        }),
      );
    } catch {
      toast.error("Erro ao excluir oferta. Tente novamente.");
    } finally {
      setIsDeletingJob(false);
      setDeleteJobConfirmOpen(false);
      setJobToDeleteFromModal(undefined);
    }
  };

  const loadApplications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const filter =
        activeTab === "received"
          ? { publisher: { equals: user.id } }
          : { applicant: { equals: user.id } };

      const response = await jobApplicationService.getJobApplications({
        where: filter,
        page: 1,
        limit: 100,
        sort: "-createdAt",
        depth: 2,
      });

      const now = new Date();
      const validApplications = response.docs.filter((app) => {
        // Enviadas: mostrar todas sem restrição de data
        if (activeTab === "sent") return true;

        // Recebidas: ocultar rejeitadas
        if (app.status === "REJECTED") return false;

        // Recebidas: ocultar aplicações do próprio usuário
        const applicantId = typeof app.applicant === "object" ? (app.applicant as { id?: string })?.id : app.applicant;
        if (applicantId === user?.id) return false;

        // Se job não populado, exibir mesmo assim (não temos a data para checar)
        const job =
          typeof app.job === "object" ? (app.job as unknown as Job) : null;
        if (!job?.startDateTime) return true;

        // Ocultar jobs com data passada
        return new Date(job.startDateTime) > now;
      });

      setApplications(validApplications);
    } catch (err) {
      console.error("[Solicitacoes] Error loading:", err);
      setError("Não foi possível carregar as solicitações.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleDelete = (application: JobApplication) => {
    setApplicationToDelete(application);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!applicationToDelete) return;
    setIsDeleting(true);

    try {
      const jobId =
        typeof applicationToDelete.job === "object"
          ? (applicationToDelete.job as any).id
          : applicationToDelete.job;
      if (!jobId) return;

      const success = await jobApplicationService.cancelJobApplication(
        jobId,
        user?.id || "",
      );

      if (success) {
        toast.success("Solicitação excluída com sucesso.");
        setApplications((prev) =>
          prev.filter((app) => app.id !== applicationToDelete.id),
        );
      } else {
        // Fallback for direct deletion if cancel fails (e.g. if it's already rejected)
        await jobApplicationService.deleteJobApplication(
          applicationToDelete.id,
        );
        toast.success("Solicitação excluída com sucesso.");
        setApplications((prev) =>
          prev.filter((app) => app.id !== applicationToDelete.id),
        );
      }
    } catch (err) {
      console.error("[Solicitacoes] Error deleting:", err);
      toast.error("Erro ao excluir solicitação.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setApplicationToDelete(undefined);
    }
  };

  const handleAccept = (application: JobApplication) => {
    setApplicationToAccept(application);
    setAcceptConfirmOpen(true);
  };

  const handleAcceptConfirmed = async () => {
    if (!applicationToAccept) return;
    setIsAccepting(true);

    try {
      const jobId =
        typeof applicationToAccept.job === "object"
          ? (applicationToAccept.job as any).id
          : applicationToAccept.job;
      if (!jobId) return;

      await jobService.transferJob(jobId, applicationToAccept.id);
      toast.success("Solicitação aceita! A oferta foi transferida.");

      // Atualizar localmente
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationToAccept.id
            ? { ...app, status: "ACCEPTED" as any }
            : app,
        ),
      );
    } catch (err) {
      console.error("[Solicitacoes] Error accepting:", err);
      toast.error("Erro ao aceitar solicitação.");
    } finally {
      setIsAccepting(false);
      setAcceptConfirmOpen(false);
      setApplicationToAccept(undefined);
    }
  };

  const handleReject = (application: JobApplication) => {
    setApplicationToReject(application);
    setRejectConfirmOpen(true);
  };

  const handleRejectConfirmed = async () => {
    if (!applicationToReject) return;
    setIsRejecting(true);

    try {
      await jobApplicationService.updateJobApplicationStatus(
        applicationToReject.id,
        "REJECTED",
      );
      toast.success("Solicitação rejeitada.");

      // Remover da lista se for 'received' (para bater com o filtro da mobile)
      setApplications((prev) =>
        prev.filter((app) => app.id !== applicationToReject.id),
      );
    } catch (err) {
      console.error("[Solicitacoes] Error rejecting:", err);
      toast.error("Erro ao rejeitar solicitação.");
    } finally {
      setIsRejecting(false);
      setRejectConfirmOpen(false);
      setApplicationToReject(undefined);
    }
  };

  const selectCls = "h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1";

  // Filtro client-side por instituição/time
  const filteredApplications = applications.filter((app) => {
    const job = typeof app.job === "object" ? (app.job as any) : null;
    if (!job) return true;
    if (filterInstId) {
      const instId = typeof job.institution === "object" ? job.institution?.id : job.institution;
      if (instId !== filterInstId) return false;
    }
    if (filterTeamId) {
      const teamId = typeof job.team === "object" ? job.team?.id : job.team;
      if (teamId !== filterTeamId) return false;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="page-header mb-8">
        <h1 className="page-title">Solicitações</h1>
        <p className="page-subtitle">
          Gerencie suas transferências e pedidos de ofertas
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md mx-auto">
          <TabsTrigger value="received" className="flex items-center gap-2">
            Recebidas
            {activeTab === "received" &&
              !loading &&
              filteredApplications.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {filteredApplications.length}
                </span>
              )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            Enviadas
            {activeTab === "sent" && !loading && filteredApplications.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {filteredApplications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Filtros de instituição/time (apenas se houver instituições) */}
        {institutions.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-5">
            <div className="flex-1 min-w-[180px] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={filterInstId}
                onChange={(e) => { setFilterInstId(e.target.value); setFilterTeamId(""); }}
                className={selectCls}
              >
                <option value="">Todas as instituições</option>
                {institutions.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px] flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={filterTeamId}
                onChange={(e) => setFilterTeamId(e.target.value)}
                className={selectCls}
                disabled={!filterInstId}
              >
                <option value="">Todos os times</option>
                {filterTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-40" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Carregando solicitações...
              </p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-center border border-destructive/20">
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={loadApplications}
                className="mt-2 text-xs underline font-bold"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredApplications.length === 0 ? (
            <EmptyState activeTab={activeTab} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredApplications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    activeTab={activeTab}
                    onDelete={handleDelete}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onOpenDetails={handleOpenDetails}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Tabs>

      <OpportunityDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        job={selectedJob}
        initialHasApplied={initialHasApplied}
        initialApplicationsCount={initialApplicationsCount}
        onApplied={() => loadApplications()}
        onRefresh={() => loadApplications()}
        onEdit={handleEditFromModal}
        onDelete={handleDeleteFromModal}
        hideOwnerActions={activeTab === "sent" || selectedApplicationStatus === "ACCEPTED"}
        hideCancel={selectedApplicationStatus === "ACCEPTED"}
      />

      <NewOfferModal
        open={showNewOfferModal}
        jobToEdit={jobToEdit}
        institutionOptions={institutions.length > 0 ? institutions : undefined}
        onClose={() => { setShowNewOfferModal(false); setJobToEdit(undefined); }}
        onSuccess={() => { setShowNewOfferModal(false); setJobToEdit(undefined); loadApplications(); }}
      />

      {isLoadingDetails && (
        <div className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* AlertDialog: Excluir solicitação */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta solicitação?
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
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Aceitar solicitação */}
      <AlertDialog open={acceptConfirmOpen} onOpenChange={setAcceptConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aceitar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja aceitar esta solicitação? Isso transferirá a oferta para
              este profissional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAccepting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault();
                handleAcceptConfirmed();
              }}
              disabled={isAccepting}
            >
              {isAccepting ? "Processando..." : "Aceitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Rejeitar solicitação */}
      <AlertDialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja rejeitar esta solicitação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleRejectConfirmed();
              }}
              disabled={isRejecting}
            >
              {isRejecting ? "Rejeitando..." : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* AlertDialog: Excluir oferta (job) */}
      <AlertDialog open={deleteJobConfirmOpen} onOpenChange={setDeleteJobConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta oferta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingJob}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); handleDeleteJobConfirmed(); }}
              disabled={isDeletingJob}
            >
              {isDeletingJob ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Helper Functions ---
// cn is now imported from @/lib/utils

// --- Main Component ---
export default function Applications() {
  return (
    <MainLayout mobileTitle="Solicitações">
      <ApplicationsContent />
    </MainLayout>
  );
}
