import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { Chip } from "@/components/ui/Chip.tsx";
import { Job } from "@/config/types.ts";
import { useJobsFeed } from "@/hooks/job/useJobsFeed.ts";
import { JobCardItem } from "@/services/jobs/utils/formatJob.ts";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { FeedFilters } from "@/components/jobs/Feed/FeedFilters.tsx";
import { OpportunityDetailsModal } from "@/components/jobs/JobDetails/JobDetailsModal.tsx";
import { NewOfferModal } from "@/components/offer/NewOfferModal/NewOfferModal.tsx";
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
import { jobService } from "@/config/app.ts";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import { useInstitutionalOffers } from "@/hooks/institution/useInstitutionalOffers.ts";
import { cn } from "@/lib/utils.ts";
import institutionalService from "@/services/institution/InstitutionalService.ts";
import type { InstitutionalJob, TeamItem } from "@/services/institution/InstitutionalService.ts";
import { useFiltersStore } from "@/services/filters/store/store.ts";
import { jobApplicationService } from "@/services/jobs/JobApplicationService.ts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Briefcase, Tag, Users, X } from "lucide-react";
import { toast } from "sonner";


dayjs.locale("pt-br");

function groupByDate(
  items: JobCardItem[],
): { dateKey: string; label: string; cards: JobCardItem[] }[] {
  const map = new Map<string, JobCardItem[]>();

  for (const item of items) {
    const key = dayjs(item.createdAt).format("YYYY-MM-DD");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // mais recente primeiro
    .map(([dateKey, cards]) => {
      const d = dayjs(dateKey);
      const today = dayjs().startOf("day");
      const yesterday = dayjs().subtract(1, "day").startOf("day");

      let label: string;
      if (d.isSame(today, "day")) {
        label = "Hoje";
      } else if (d.isSame(yesterday, "day")) {
        label = "Ontem";
      } else {
        label = d.format("dddd, DD [de] MMMM");
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      return { dateKey, label, cards };
    });
}

// ─── JobOfferCard ─────────────────────────────────────────────────────────────

function JobOfferCard({ item }: { item: JobCardItem }) {
  const avatars = item.avatars || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => item.onClick?.()}
      className="cursor-pointer bg-card border border-foreground/10 rounded-xl p-4 hover:border-foreground/40 hover:shadow-md transition-all"
    >
      {/* Ofertante + caption */}
      <div className="flex items-center gap-2 mb-3">
        {avatars.length > 0 ? (
          <div className="flex items-center -space-x-2">
            {avatars.map((avatar, idx) => (
              <img
                key={idx}
                src={avatar.uri}
                alt="Ofertante"
                className="w-6 h-6 rounded-full object-cover shrink-0 ring-2 ring-background relative"
                style={{ zIndex: avatars.length - idx }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary shrink-0 flex items-center justify-center ring-2 ring-background">
            <span className="text-xs text-muted-foreground font-semibold">
              ?
            </span>
          </div>
        )}

        {item.caption && (
          <p className="text-xs text-muted-foreground font-medium">
            {item.caption}
          </p>
        )}
      </div>

      {/* Título (local) */}
      <div className="flex items-start gap-2 mb-1.5">
        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
          {item.title}
        </h3>
      </div>

      {/* Cidade */}
      <p className="text-sm text-muted-foreground mb-3 ml-6">{item.subtitle}</p>

      {/* Horário */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 ml-6">
        <Clock className="w-3.5 h-3.5" />
        <span>{dayjs(item.createdAt).format("HH:mm")}</span>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 ml-6">
          {item.tags.map((tag, i) => {
            return (
              <Chip
                key={i}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                variant={tag.color}
              >
                {tag.label}
              </Chip>
            );
          })}
        </div>
      )}

      {/* Interessados */}
      {item.interestedCaption && (
        <p className="text-xs text-primary mt-2 ml-6 font-medium">
          {item.interestedCaption}
        </p>
      )}
    </motion.div>
  );
}

// ─── Timeline de um grupo de data ─────────────────────────────────────────────

function TimelineGroup({
  label,
  cards,
  index,
}: {
  label: string;
  cards: JobCardItem[];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="relative"
    >
      {/* Label da data */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {cards.length} oferta{cards.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {cards.map((item) => (
          <JobOfferCard key={item.id} item={item} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Card para oferta institucional ──────────────────────────────────────────

function InstOfferCard({
  job,
  teamName,
  currentUserId,
  onDelete,
  onApply,
  applying,
  applied,
}: {
  job: InstitutionalJob;
  teamName: string;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onApply?: () => void;
  applying?: boolean;
  applied?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOpen = !job.toProfileId;
  const isFuture = new Date(job.startDateTime) > new Date();
  const canDelete = !!currentUserId && job.fromProfileId === currentUserId && isOpen;
  const canApply = isOpen && isFuture && !!currentUserId && job.fromProfileId !== currentUserId;

  return (
    <div className="bg-card border border-foreground/10 rounded-xl p-4 hover:border-foreground/40 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
              isOpen ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                     : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400")}>
              {isOpen ? "Aberta" : "Atribuída"}
            </span>
            {teamName && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                <Users className="w-2.5 h-2.5" />{teamName}
              </span>
            )}
          </div>
          <p className="font-semibold text-sm text-foreground">
            {format(new Date(job.startDateTime), "EEE, d 'de' MMM", { locale: ptBR })}
          </p>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(job.startDateTime), "HH:mm")} · {job.durationInHours}h
            </span>
            {job.placeDisplayName && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.placeDisplayName}</span>
            )}
            {job.clinicalArea && (
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{job.clinicalArea}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {(job.priceInCents ?? 0) > 0 && (
            <p className="text-sm font-bold text-green-600">
              {(job.priceInCents! / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          )}
          {canDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  className="text-[10px] px-2 py-0.5 rounded bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90"
                  onClick={() => { setConfirmDelete(false); onDelete?.(job.id); }}
                >
                  Confirmar
                </button>
                <button
                  className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/70"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Excluir oferta"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
          {canApply && (
            applied ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Solicitado
              </span>
            ) : (
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                onClick={onApply}
                disabled={applying}
              >
                {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Solicitar
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Feed institucional (quando filtro ativo) ─────────────────────────────────

function InstitutionalFeed({
  institutionId,
  teamId,
  teams,
  currentUserId,
  filterOwner,
  onDelete,
}: {
  institutionId: string;
  teamId: string;
  teams: TeamItem[];
  currentUserId?: string;
  filterOwner?: string;
  onDelete?: (id: string) => void;
}) {
  const { jobs, loading, error } = useInstitutionalOffers({
    limit: 500,
    myJobs: !!filterOwner,
  });

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleApply = async (job: InstitutionalJob) => {
    if (!currentUserId || applyingId) return;
    setApplyingId(job.id);
    try {
      await jobApplicationService.createJobApplication({
        job: job.id,
        publisher: job.fromProfileId,
        applicant: currentUserId,
        status: "PENDING",
      });
      setAppliedIds((prev) => new Set(prev).add(job.id));
      toast.success("Solicitação enviada!");
    } catch {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setApplyingId(null);
    }
  };

  const now = new Date();
  const filtered = jobs.filter((j) => {
    if (new Date(j.startDateTime) < now) return false;
    if (j.toProfileId) return false;
    if (institutionId && j.institutionId !== institutionId) return false;
    if (teamId && j.teamId !== teamId) return false;
    return true;
  });

  const resolveTeam = (id: string) => teams.find((t) => t.id === id)?.name ?? "";

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  );
  if (error) return (
    <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">{error}</div>
  );

  const sorted = [...filtered].sort((a, b) =>
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        oferta{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
      </p>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-foreground/10">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" strokeWidth={1} />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma oferta encontrada</h3>
          <p className="text-muted-foreground text-sm">Sem ofertas para os filtros selecionados.</p>
        </div>
      ) : (
        sorted.map((job) => (
          <InstOfferCard
            key={job.id}
            job={job}
            teamName={resolveTeam(job.teamId)}
            currentUserId={currentUserId}
            onDelete={onDelete}
            onApply={() => handleApply(job)}
            applying={applyingId === job.id}
            applied={appliedIds.has(job.id)}
          />
        ))
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-foreground/10">
      <Calendar
        className="w-16 h-16 text-muted-foreground mb-4"
        strokeWidth={1}
      />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Nenhuma oferta encontrada
      </h3>
      <p className="text-muted-foreground text-sm">
        Não há ofertas disponíveis no momento.{'\n'} Tente novamente mais tarde.
      </p>
    </div>
  );
}

// ─── Conteúdo principal ────────────────────────────────────────────────────────

function JobsContent() {
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [jobToEdit, setJobToEdit] = useState<Job | undefined>();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [initialHasApplied, setInitialHasApplied] = useState<
    boolean | undefined
  >();
  const [initialApplicationsCount, setInitialApplicationsCount] = useState<
    number | undefined
  >();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false);
  const [jobToRevert, setJobToRevert] = useState<Job | undefined>();
  const [isReverting, setIsReverting] = useState(false);
  const [assumeConfirmOpen, setAssumeConfirmOpen] = useState(false);
  const [jobToAssume, setJobToAssume] = useState<Job | undefined>();
  const [isAssuming, setIsAssuming] = useState(false);

  const { user } = useAuthContext();
  const { institutions } = useInstitutionalContext();

  const [filterInstId, setFilterInstId] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [instTeams, setInstTeams] = useState<TeamItem[]>([]);
  const [allTeams, setAllTeams] = useState<TeamItem[]>([]);
  const [instRefreshKey, setInstRefreshKey] = useState(0);

  useEffect(() => {
    if (!filterInstId) { setInstTeams([]); setFilterTeamId(""); return; }
    institutionalService.listTeams(filterInstId).then(setInstTeams);
  }, [filterInstId]);

  useEffect(() => {
    if (!institutions.length) { setAllTeams([]); return; }
    Promise.all(institutions.map((i) => institutionalService.listTeams(i.value)))
      .then((results) => setAllTeams(results.flat()))
      .catch(() => {});
  }, [institutions.map((i) => i.value).join(",")]);

  const handleDeleteInstitutionalOffer = async (jobId: string) => {
    try {
      await institutionalService.deleteOffer(jobId);
      toast.success("Oferta excluída com sucesso");
      setInstRefreshKey((k) => k + 1);
    } catch {
      toast.error("Erro ao excluir oferta. Tente novamente.");
    }
  };

  const handleOpenDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const job = await jobService.getJob(id);
      setSelectedJob(job);

      // Pre-fetch details to avoid flickering
      if (job && user) {
        const isOwner =
          job.from && typeof job.from === "object" && job.from.id === user.id;
        const isOffer = job.visibility !== "PRIVATE";

        const [applied, apps] = await Promise.all([
          jobApplicationService.hasUserAppliedForJob(job.id, user.id),
          isOwner && isOffer
            ? jobApplicationService.getApplicationsForJob(job.id)
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
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditOffer = (job: Job) => {
    setJobToEdit(job);
    setShowDetailsModal(false);
    setShowNewOfferModal(true);
  };

  const handleDeleteFromOffer = (job: Job) => {
    setJobToDelete(job);
    setShowDetailsModal(false);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      await jobService.deleteJob(jobToDelete.id);
      toast.success("Oferta excluída com sucesso");
      setShowDetailsModal(false);
      refresh();
    } catch (error) {
      console.error("Erro ao excluir oferta:", error);
      toast.error("Erro ao excluir oferta. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setJobToDelete(undefined);
    }
  };

  const handleRevertToOffer = (job: Job) => {
    setJobToRevert(job);
    setShowDetailsModal(false);
    setRevertConfirmOpen(true);
  };

  const handleRevertConfirmed = async () => {
    if (!jobToRevert) return;
    setIsReverting(true);
    try {
      await jobService.updateJob(jobToRevert.id, {
        to: null,
        transferredAt: null,
        visibility:
          jobToRevert.visibility === "PRIVATE"
            ? "PUBLIC"
            : jobToRevert.visibility,
      });
      toast.success("Agendamento retornado para oferta");
      setShowDetailsModal(false);
      refresh();
    } catch (error) {
      console.error("Erro ao retornar para oferta:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsReverting(false);
      setRevertConfirmOpen(false);
      setJobToRevert(undefined);
    }
  };

  const handleAssumeOffer = (job: Job) => {
    setJobToAssume(job);
    setShowDetailsModal(false);
    setAssumeConfirmOpen(true);
  };

  const handleAssumeConfirmed = async () => {
    if (!jobToAssume || !user) return;
    setIsAssuming(true);
    try {
      const publisherId =
        typeof jobToAssume.from === "object"
          ? jobToAssume.from.id
          : jobToAssume.from;

      // Criar aplicação, aceitar, transferir, e limpar
      const application = await jobApplicationService.createJobApplication({
        job: jobToAssume.id,
        publisher: publisherId,
        applicant: user.id,
        status: "PENDING",
      });

      await jobApplicationService.updateJobApplicationStatus(
        application.id,
        "ACCEPTED",
      );

      await jobService.updateJob(jobToAssume.id, {
        to: user.id as any,
        transferredAt: new Date().toISOString(),
      });

      // Deletar aplicação para zerar solicitações
      try {
        await jobApplicationService.deleteJobApplication(application.id);
      } catch (deleteErr) {
        console.warn("Erro ao deletar aplicação após assumir:", deleteErr);
      }

      toast.success("Oferta assumida com sucesso!");
      setShowDetailsModal(false);
      refresh();
    } catch (error) {
      console.error("Erro ao assumir oferta:", error);
      toast.error("Erro ao assumir oferta. Tente novamente.");
    } finally {
      setIsAssuming(false);
      setAssumeConfirmOpen(false);
      setJobToAssume(undefined);
    }
  };

  const {
    futureCards,
    pastCards,
    isLoading,
    isLoadingMore,
    isRefreshing,
    showOnlyFuture,
    setShowOnlyFuture,
    loadMore,
    refresh,
  } = useJobsFeed();

  const { activeFilter } = useFiltersStore();

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        loadMore();
      }
    },
    [loadMore, isLoadingMore],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const {
    filters,
    activeFilter: currentActiveFilter,
    setActiveFilter,
  } = useFiltersStore();

  useEffect(() => {
    if (!currentActiveFilter && filters.length > 0) {
      // O onboarding/Para você sempre é ordenado como o primeiro pela store (FiltersService)
      setActiveFilter(filters[0]);
    }
  }, [filters, currentActiveFilter, setActiveFilter]);

  // Todos os cards combinados (futuros + passados) e agrupados por data
  const isAvailableJobsFilter = activeFilter?.id === "available-jobs";
  const allCards =
    showOnlyFuture || isAvailableJobsFilter
      ? futureCards
      : [...futureCards, ...pastCards];

  // Injetar handleOpenDetails nos cards
  const cardsWithClick = allCards.map((card) => ({
    ...card,
    onClick: () => handleOpenDetails(card.id),
  }));

  const groups = groupByDate(cardsWithClick);
  const totalCards = allCards.length;

  return (
    <div className="page-container">
      {/* Cabeçalho */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="page-header mb-0">
            <h1 className="page-title">Ofertas</h1>
            <p className="page-subtitle">Oportunidades disponíveis para você</p>
          </div>

          {/* Versão Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Toggle "Somente disponíveis" */}
            {(!activeFilter || activeFilter.id !== "available-jobs") && (
              <label className="flex items-center gap-2 cursor-pointer select-none bg-card px-3 py-1.5 rounded-2xl border border-foreground/10">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Somente disponíveis
                </span>
                <button
                  role="switch"
                  aria-checked={showOnlyFuture}
                  onClick={() => setShowOnlyFuture((v) => !v)}
                  className={`relative inline-flex h-4 w-8 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring  ${
                    showOnlyFuture ? "bg-success" : "bg-muted"
                  }`}
                >
                  <span   
                    className={`pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform mt-0.5 ${
                      showOnlyFuture ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            )}

            {/* Botão refresh */}
            <button
              onClick={refresh}
              disabled={isRefreshing || isLoading}
              title="Atualizar ofertas"
              className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 border border-foreground/10"
            >
              <RefreshCw
                className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            {/* Botão nova oferta */}
            <button
              onClick={() => setShowNewOfferModal(true)}
              title="Publicar nova oferta"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Oferta
            </button>
          </div>

          {/* Versão Mobile */}
          <div
            className="flex md:hidden items-center gap-3"
            style={{ flexWrap: "wrap" }}
          >
            {(!activeFilter || activeFilter.id !== "available-jobs") && (
              <label
                className="flex items-center gap-2 cursor-pointer select-none bg-card px-3 py-1.5 rounded-2xl border border-foreground/10"
                style={{ flex: 1 }}
              >
                <span
                  className="text-xs text-muted-foreground whitespace-nowrap"
                  style={{ flex: 1 }}
                >
                  Somente disponíveis
                </span>
                <button
                  role="switch"
                  aria-checked={showOnlyFuture}
                  onClick={() => setShowOnlyFuture((v) => !v)}
                  className={`relative inline-flex h-4 w-8 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-gray ${showOnlyFuture ? "bg-success" : "bg-foreground"}`}
                >
                  <span
                    className={`pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform mt-0.5 ${showOnlyFuture ? "translate-x-3.5" : "translate-x-0.5"}`}
                  />
                </button>
              </label>
            )}

            <button
              onClick={refresh}
              disabled={isRefreshing || isLoading}
              title="Atualizar ofertas"
              className="p-2 rounded-lg hover:bg-on-accent transition-colors disabled:opacity-50 border border-foreground/10"
            >
              <RefreshCw
                className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            <button
              onClick={() => setShowNewOfferModal(true)}
              title="Publicar nova oferta"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              style={{
                fontSize: "12px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus className="w-4 h-4" />
              Nova Oferta
            </button>
          </div>
        </div>

        {/* Filtros de Tags */}
        <FeedFilters />

        {/* Filtros institucionais */}
        {institutions.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            {institutions.map((inst) => (
              <button
                key={inst.value}
                onClick={() => {
                  setFilterInstId((v) => v === inst.value ? "" : inst.value);
                  setFilterTeamId("");
                }}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all",
                  filterInstId === inst.value
                    ? "bg-accent text-accent-foreground border-accent font-semibold"
                    : "bg-card text-muted-foreground border-foreground/10 hover:border-foreground/30"
                )}
              >
                {filterInstId === inst.value && <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); setFilterInstId(""); setFilterTeamId(""); }} />}
                {inst.label}
              </button>
            ))}
            {filterInstId && instTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => setFilterTeamId((v) => v === team.id ? "" : team.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all",
                  filterTeamId === team.id
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-card text-muted-foreground border-foreground/10 hover:border-foreground/30"
                )}
              >
                <Users className="w-3 h-3" />
                {filterTeamId === team.id && <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); setFilterTeamId(""); }} />}
                {team.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contador — só para o feed regular (sem institucional) */}
      {!institutions.length && !isLoading && totalCards > 0 && (
        <p className="text-sm text-muted-foreground mb-6">
          <span className="font-semibold text-foreground">{totalCards}</span>{" "}
          oferta{totalCards !== 1 ? "s" : ""} encontrada
          {totalCards !== 1 ? "s" : ""}
        </p>
      )}

      {/* Conteúdo */}
      {institutions.length > 0 ? (
        <InstitutionalFeed
          key={`${instRefreshKey}-${activeFilter?.id === "my-jobs" ? "mine" : "all"}`}
          institutionId={filterInstId}
          teamId={filterTeamId}
          teams={allTeams}
          currentUserId={user?.id}
          filterOwner={activeFilter?.id === "my-jobs" ? user?.id : undefined}
          onDelete={handleDeleteInstitutionalOffer}
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : totalCards === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8 pb-2">
          {groups.map((group, i) => (
            <TimelineGroup
              key={i}
              label={group.label}
              cards={group.cards}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Sentinel paginação — só no feed regular */}
      {!institutions.length && <div ref={sentinelRef} className="h-8 mt-4" />}

      {/* Loading more */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Modal de nova oferta */}
      <NewOfferModal
        open={showNewOfferModal}
        jobToEdit={jobToEdit}
        institutionOptions={institutions.length > 0 ? institutions : undefined}
        onClose={() => {
          setShowNewOfferModal(false);
          setJobToEdit(undefined);
        }}
        onSuccess={() => {
          setShowNewOfferModal(false);
          setJobToEdit(undefined);
          refresh();
          if (institutions.length > 0) setInstRefreshKey((k) => k + 1);
        }}
      />

      <OpportunityDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        job={selectedJob}
        onEdit={handleEditOffer}
        onDelete={handleDeleteFromOffer}
        onRevertToOffer={handleRevertToOffer}
        onAssumeOffer={handleAssumeOffer}
        initialHasApplied={initialHasApplied}
        initialApplicationsCount={initialApplicationsCount}
        onApplied={() => refresh()}
        onRefresh={refresh}
      />

      {isLoadingDetails && (
        <div className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Dialog de confirmação: Excluir */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta oferta? Esta ação não pode ser
              desfeita.
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

      {/* Dialog de confirmação: Tornar oferta */}
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

      {/* Dialog de confirmação: Assumir oferta */}
      <AlertDialog open={assumeConfirmOpen} onOpenChange={setAssumeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assumir oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja assumir esta oferta e transformá-la em um agendamento
              pessoal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssuming}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault();
                handleAssumeConfirmed();
              }}
              disabled={isAssuming}
            >
              {isAssuming ? "Processando..." : "Assumir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export default function Jobs() {
  return (
    <MainLayout mobileTitle="Ofertas">
      <JobsContent />
    </MainLayout>
  );
}
