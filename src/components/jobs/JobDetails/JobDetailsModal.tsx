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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Chip } from "@/components/ui/Chip.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Job } from "@/config/types.ts";
import {
  ModalAction,
  useJobDetailsModal,
} from "@/hooks/job/useJobDetailsModal.ts";
import {
  PAYMENT_METHOD_VARIANTS
} from "@/ui/themes/constants.ts";
import { formatPaymentMethod } from "@/utils/job.helper.ts";
import { formatCurrency } from "@/utils/numberFormatter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Link,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  Repeat,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  JobApplicationsModal,
  type Applicant,
} from "../JobApplications/JobApplicationsModal.tsx";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

const getPaymentMethodVariant = (method: string | undefined | null) => {
  if (!method) return "lime";
  return (
    PAYMENT_METHOD_VARIANTS[method as keyof typeof PAYMENT_METHOD_VARIANTS] ||
    "lime"
  );
};

interface OpportunityDetailsModalProps {
  open: boolean;
  onClose: () => void;
  job: Job | undefined;
  onEdit?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onRevertToOffer?: (job: Job) => void;
  onAssumeOffer?: (job: Job) => void;
  onApplied?: () => void;
  onRefresh?: () => void;
  initialHasApplied?: boolean;
  initialApplicationsCount?: number;
  hideOwnerActions?: boolean;
  hideCancel?: boolean;
}

export function OpportunityDetailsModal({
  open,
  onClose,
  job,
  onEdit,
  onDelete,
  onRevertToOffer,
  onAssumeOffer,
  onApplied,
  onRefresh,
  initialHasApplied,
  initialApplicationsCount,
  hideOwnerActions,
  hideCancel,
}: OpportunityDetailsModalProps) {
  const [showAllDates, setShowAllDates] = useState(false);
  const [showApplications, setShowApplications] = useState(false);

  const {
    isOwner,
    isOffer,
    canAssumeOffer,
    canShare,
    canRevertToOffer,
    applicationsCount,
    mainAction,
    secondaryAction,
    hasMultipleDates,
    hasSinglePayment,
    hasApplied,
    relatedJobs,
    loadingRelatedJobs,
    allApplications,
    loadingAllApplications,
    hasUserAppliedToJob,
    handleConfirmTransfer,
    handleApplyToJob,
    handleCancelApplicationForJob,
    isTransferring,
    isTransferredToUser,
    isApplying,
    isCancelling,
    isApplyingToAll,
    applicationRequestedAt,
    // Confirmation dialogs
    showConfirmApply,
    showConfirmCancel,
    confirmApply,
    confirmCancel,
    dismissConfirmApply,
    dismissConfirmCancel,
    isTransferred,
  } = useJobDetailsModal({
    open,
    job,
    initialHasApplied,
    initialApplicationsCount,
    onEdit: hideOwnerActions ? undefined : onEdit,
    onDelete: hideOwnerActions ? undefined : onDelete,
    hideCancel,

    onRevertToOffer,
    onAssumeOffer,
    onApplied,
    onRefresh,
  });


  const handleCopyLink = () => {
    if (!job) return;
    const baseUrl = import.meta.env.VITE_APP_WEB_URL;
    if (!baseUrl) {
      toast.error("Erro ao copiar link");
      return;
    }
    const link = `${baseUrl}/oferta/${job.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const applicants = useMemo<Applicant[]>(() => {
    return allApplications
      .map((app) => {
        let name = "";
        let avatarUrl = null;
        let requestedAt;
        let id = "";
        const applicant = app.application.applicant;
        if (applicant && typeof applicant === "object") {
          const appRecord = applicant as Record<string, unknown>;
          name = "name" in appRecord ? (appRecord.name as string) || "" : "";
          id = "id" in appRecord ? (appRecord.id as string) || "" : "";
          if ("profilePicture" in appRecord) {
            const picture = appRecord.profilePicture;
            if (typeof picture === "string") {
              avatarUrl = picture;
            } else if (picture && typeof picture === "object") {
              avatarUrl =
                ((picture as Record<string, unknown>).url as string) || null;
            }
          }
        }
        if (app.application.createdAt) {
          requestedAt = new Date(app.application.createdAt);
        }
        return {
          name,
          avatarUrl,
          requestedAt,
          id,
          dateContext: app.dateContext,
          application: app.application,
        };
      })
      .filter(
        (a, index, self) =>
          a.name && self.findIndex((b) => b.id === a.id) === index,
      );
  }, [allApplications]);

  if (!job) return null;

  const startDate = new Date(job.startDateTime);
  const dayName = format(startDate, "EEEE", { locale: ptBR });
  const formattedDate = format(startDate, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const startTime = dayjs(job.startDateTime).format("HH:mm");
  const endTime = dayjs(job.startDateTime)
    .add(job.durationInHours, "hour")
    .format("HH:mm");

  const price = job.priceInCents
    ? formatCurrency(job.priceInCents / 100)
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between space-y-0 gap-4">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold text-foreground">
                {isOffer ? "Detalhes da oferta" : "Detalhes do agendamento"}
              </DialogTitle>
              {canShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                  onClick={handleCopyLink}
                  title="Copiar link da oferta"
                >
                  <Link className="w-4 h-4" />
                </Button>
              )}
            </div>
            {canAssumeOffer && onAssumeOffer && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors gap-2 px-2 mr-3"
                onClick={() => onAssumeOffer(job)}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Assumir
                </span>
              </Button>
            )}
            {canRevertToOffer && onRevertToOffer && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors gap-2 px-2 mr-3"
                onClick={() => onRevertToOffer(job)}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Tornar oferta
                </span>
              </Button>
            )}
          </DialogHeader>

          <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Localização */}
            {(job.place?.name || job.place?.formattedAddress || job.city?.label) && (
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {job.place?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {job.place?.formattedAddress || job.city?.label}
                  </p>
                </div>
              </div>
            )}

            {/* Instituição e Time */}
            {(() => {
              const j = job as any;
              const instName = typeof j.institution === "object" && j.institution
                ? j.institution.tradeName || j.institution.legalName || null
                : null;
              const teamName = typeof j.team === "object" && j.team
                ? j.team.name || null
                : null;
              if (!instName && !teamName) return null;
              return (
                <div className="flex items-center gap-2 flex-wrap -mt-2">
                  {instName && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                      <Building2 className="w-4 h-4 shrink-0" />
                      {instName}
                    </span>
                  )}
                  {teamName && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/10 text-foreground text-sm font-medium">
                      <Users className="w-4 h-4 shrink-0" />
                      {teamName}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Data e Hora */}
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground capitalize">
                  {dayName}, {formattedDate}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {startTime} - {endTime} ({job.durationInHours}h)
                  </span>
                </div>
              </div>
            </div>

            {/* Múltiplas Datas */}
            {hasMultipleDates && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                {loadingRelatedJobs || loadingAllApplications ? (
                  <div className="flex flex-col gap-2">
                    <div className="h-6 w-1/3 animate-pulse bg-background rounded-md mb-2 opacity-60" />
                    <div className="h-4 w-1/4 animate-pulse bg-background rounded-md mb-4 opacity-60" />
                    {hasSinglePayment ? (
                      <div className="flex gap-3">
                        <div className="h-[72px] w-16 animate-pulse bg-background rounded-xl opacity-60" />
                        <div className="h-[72px] w-16 animate-pulse bg-background rounded-xl opacity-60" />
                        <div className="h-[72px] w-16 animate-pulse bg-background rounded-xl opacity-60" />
                      </div>
                    ) : (
                      <>
                        <div className="h-16 w-full animate-pulse bg-background rounded-xl opacity-60" />
                        <div className="h-16 w-full animate-pulse bg-background rounded-xl opacity-60" />
                      </>
                    )}
                  </div>
                ) : relatedJobs.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[15px] font-bold text-foreground">
                        {(() => {
                          const jobsToCount =
                            job.visibility === "PRIVATE"
                              ? relatedJobs
                              : [job, ...relatedJobs];
                          const totalDates = jobsToCount.length;
                          const totalApps = jobsToCount.filter((j) =>
                            hasUserAppliedToJob(j.id),
                          ).length;

                          if (job.visibility === "PRIVATE")
                            return totalDates > 1
                              ? `${totalDates} datas replicadas`
                              : "data replicada";
                          if (hasSinglePayment) return "Cronograma";
                          if (isTransferredToUser)
                            return totalDates > 1
                              ? `${totalDates} datas`
                              : "1 data";
                          if (totalApps === 0)
                            return `${totalDates} datas disponíveis`;
                          if (totalApps === 1)
                            return "Você solicitou esta oferta";
                          return `Você solicitou ${totalApps} datas desta oferta`;
                        })()}
                      </span>
                    </div>

                    {job.visibility !== "PRIVATE" && (
                      <p className="text-[13px] text-muted-foreground mb-4 leading-none">
                        {hasSinglePayment
                          ? "Oferta em bloco: solicitação única para todas as datas."
                          : "Série: solicitação por data."}
                      </p>
                    )}

                    {hasSinglePayment ? (
                      <div className="flex overflow-x-auto gap-3 pb-4 snap-x -mx-6 px-6">
                        {(() => {
                          const allJobs = [
                            { id: job.id, startDateTime: job.startDateTime },
                            ...job
                              .additionalDates!.filter((d) => d.date)
                              .map((d, i) => ({
                                id: `additional-${i}`,
                                startDateTime: d.date!,
                              })),
                          ].sort(
                            (a, b) =>
                              dayjs(a.startDateTime).valueOf() -
                              dayjs(b.startDateTime).valueOf(),
                          );
                          const parentUnavailable =
                            !job.startDateTime ||
                            dayjs(job.startDateTime).isBefore(dayjs()) ||
                            !!job.to ||
                            !!job.transferredAt;
                          return allJobs.map((jobItem) => (
                            <div
                              key={jobItem.id}
                              className={`flex flex-col items-center justify-center bg-background rounded-xl w-14 min-h-[90px] shrink-0 snap-start ${
                                parentUnavailable ? "opacity-60" : ""
                              }`}
                            >
                              <div className="bg-background/50 w-full rounded-t-xl text-center py-1">
                                <span className="text-[10px] font-bold text-primary dark:text-foreground uppercase">
                                  {dayjs(jobItem.startDateTime)
                                    .format("ddd")
                                    .replace(".", "")}
                                </span>
                              </div>
                              <div className="flex-1 flex flex-col items-center justify-center leading-none mt-1">
                                <span className="text-lg font-bold text-foreground">
                                  {dayjs(jobItem.startDateTime).format("D")}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70">
                                  {dayjs(jobItem.startDateTime)
                                    .format("MMM")
                                    .replace(".", "")}
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {(() => {
                          // Usar relatedJobs reais para ter IDs válidos nas ações por data
                          const allJobs = (
                            job.visibility === "PRIVATE"
                              ? relatedJobs
                              : [job, ...relatedJobs]
                          ).sort(
                            (a, b) =>
                              dayjs(a.startDateTime).valueOf() -
                              dayjs(b.startDateTime).valueOf(),
                          );
                          const shouldShowToggle = allJobs.length > 2;
                          const jobsToShow =
                            shouldShowToggle && !showAllDates
                              ? allJobs.slice(0, 2)
                              : allJobs;

                          return (
                            <>
                              {jobsToShow.map((jobItem) => {
                                const isExpiredItem = dayjs(
                                  jobItem.startDateTime,
                                ).isBefore(dayjs());
                                const hasAppliedToThisDate =
                                  hasUserAppliedToJob(jobItem.id);

                                let statusText = "";
                                if (isExpiredItem) {
                                  statusText = isOwner
                                    ? "Oferta expirada para esta data"
                                    : "Oferta expirada";
                                } else if (
                                  job.visibility === "PRIVATE" &&
                                  isOwner
                                ) {
                                  statusText = "Seu agendamento";
                                } else if (hasAppliedToThisDate) {
                                  statusText = "Data solicitada";
                                } else {
                                  statusText = "Disponível";
                                }

                                const showDateActions =
                                  !isOwner &&
                                  !isExpiredItem &&
                                  job.visibility !== "PRIVATE";

                                return (
                                  <div
                                    key={jobItem.id}
                                    className={`flex items-center justify-between p-3 rounded-2xl border border-border/50 ${
                                      hasAppliedToThisDate && !isExpiredItem
                                        ? "bg-primary/5 border-primary/20"
                                        : "bg-background border-none"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center justify-center min-w-[3rem]">
                                        <span className="text-xl font-bold leading-none text-foreground">
                                          {dayjs(jobItem.startDateTime).format(
                                            "D",
                                          )}
                                        </span>
                                        <span className="text-[11px] font-medium text-muted-foreground uppercase mt-0.5">
                                          {dayjs(jobItem.startDateTime)
                                            .format("MMM")
                                            .replace(".", "")}
                                        </span>
                                      </div>
                                      <div className="w-px h-8 bg-border/60 mx-1" />
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground capitalize">
                                          {dayjs(jobItem.startDateTime).format(
                                            "dddd",
                                          )}
                                        </span>
                                        {statusText && (
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            {hasAppliedToThisDate &&
                                              !isExpiredItem && (
                                                <Clock className="w-3.5 h-3.5 text-primary" />
                                              )}
                                            <span
                                              className={`text-[13px] ${
                                                hasAppliedToThisDate &&
                                                !isExpiredItem
                                                  ? "text-primary font-medium"
                                                  : "text-muted-foreground"
                                              }`}
                                            >
                                              {statusText}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {showDateActions && (
                                      <div className="ml-2">
                                        {hasAppliedToThisDate ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() =>
                                              handleCancelApplicationForJob(
                                                jobItem.id,
                                              )
                                            }
                                            disabled={isCancelling}
                                          >
                                            {isCancelling ? (
                                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                            ) : null}
                                            Cancelar
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            className="h-8 text-xs btn-lime"
                                            onClick={() =>
                                              handleApplyToJob(jobItem.id)
                                            }
                                            disabled={isApplying}
                                          >
                                            {isApplying ? (
                                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                            ) : null}
                                            Solicitar
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {shouldShowToggle && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 h-9 text-xs font-semibold text-muted-foreground hover:bg-background gap-1.5 w-full justify-center rounded-xl"
                                  onClick={() => setShowAllDates(!showAllDates)}
                                >
                                  {showAllDates ? (
                                    <>
                                      Esconder <ChevronUp className="w-4 h-4" />
                                    </>
                                  ) : (
                                    <>
                                      Mostrar outras {allJobs.length - 2} datas{" "}
                                      <ChevronDown className="w-4 h-4" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            {/* Informações Adicionais */}
            {(typeof job.clinicalArea === "object" || price) && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {typeof job.clinicalArea === "object" && job.clinicalArea && (
              <div className="bg-muted p-3 rounded-xl border-none shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Atuação</span>
                </div>
                <Chip variant="green" className="mt-2">
                  {(job.clinicalArea as any).name}
                </Chip>
              </div>
              )}

              {price && (
                <div className="bg-muted p-3 rounded-xl border-none shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Valor</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {price}
                  </p>
                  <Chip
                      className="text-xs rounded-full font-xs"
                      variant={getPaymentMethodVariant(job.paymentMethod)}
                    >
                      {formatPaymentMethod(job.paymentMethod)}
                    </Chip>
                </div>
              )}
            </div>
            )}

            {/* Card de status da aplicação */}
            {hasApplied &&
              !isOwner &&
              !job.to &&
              !job.transferredAt &&
              applicationRequestedAt && (
                <div className="rounded-xl overflow-hidden border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="bg-primary/80 px-4 py-1.5 text-center">
                    <span className="text-xs font-semibold text-primary-foreground">
                      Oferta solicitada{" "}
                      {dayjs(applicationRequestedAt).fromNow()}
                    </span>
                  </div>
                  <div className="p-4 bg-muted">
                    <p className="text-sm font-semibold text-foreground">
                      Aguarde a confirmação de{" "}
                      {typeof job.from === "object"
                        ? job.from?.name?.split(" ")[0]
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você receberá uma notificação caso{" "}
                      {typeof job.from === "object"
                        ? job.from?.name?.split(" ")[0]
                        : "o responsável"}{" "}
                      confirme a transferência
                    </p>
                  </div>
                </div>
              )}

            {/* Card: Você assumiu esta oferta */}
            {isTransferredToUser && (
              <div className="flex justify-center p-4 rounded-xl bg-background animate-in fade-in duration-300">
                <span className="text-sm text-center text-muted-foreground">
                  Você assumiu esta oferta
                </span>
              </div>
            )}

            {/* Card: Transferência concluída (para o dono) */}
            {isOwner &&
              job.transferredAt &&
              job.to &&
              typeof job.to === "object" &&
              !isTransferredToUser && (
                <div className="rounded-xl bg-background p-4 shadow-[var(--shadow-card)] animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-border/50">
                        {typeof job.from === "object" &&
                          job.from?.profilePicture && (
                            <AvatarImage
                              src={
                                typeof job.from.profilePicture === "object"
                                  ? (
                                      job.from.profilePicture as {
                                        url?: string;
                                      }
                                    ).url
                                  : job.from.profilePicture
                              }
                            />
                          )}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {typeof job.from === "object"
                            ? job.from?.name?.[0]?.toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Avatar className="h-8 w-8 border border-border/50">
                        {job.to.profilePicture && (
                          <AvatarImage
                            src={
                              typeof job.to.profilePicture === "object"
                                ? (job.to.profilePicture as { url?: string })
                                    .url
                                : job.to.profilePicture
                            }
                          />
                        )}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {job.to.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-sm font-medium text-foreground ml-1">
                      Transferida para {job.to.name?.split(" ")[0]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transferida em{" "}
                    {dayjs(job.transferredAt).format("DD [de] MMMM [de] YYYY")}
                  </p>
                </div>
              )}

            {/* Descrição */}
            {job.description && (
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Descrição</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed bg-background/50 p-3 rounded-lg border-none italic">
                  "{job.description}"
                </p>
              </div>
            )}

            {/* Criado por e Candidatos */}
            <div className="flex flex-col gap-3 pt-2">
              {job.from && typeof job.from === "object" && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 rounded-full">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-muted-foreground">
                    {isOwner
                      ? "Criado por você"
                      : `Criado por ${job.from?.name}`}
                  </span>
                </div>
              )}

              {isOwner && isOffer && (
                <button
                  type="button"
                  className="flex items-center gap-3 text-sm text-left hover:opacity-80 transition-opacity bg-transparent p-0 m-0 border-none outline-none cursor-pointer disabled:cursor-default disabled:opacity-100"
                  onClick={() =>
                    applicationsCount > 0 && setShowApplications(true)
                  }
                  disabled={applicationsCount === 0}
                >
                  <div className="p-1.5 rounded-full">
                    <Users className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-foreground font-medium underline underline-offset-2">
                    {applicationsCount === 0
                      ? "Nenhum candidato interessado"
                      : applicationsCount === 1
                        ? "1 candidato interessado"
                        : `${applicationsCount} candidatos interessados`}
                  </span>
                  {applicationsCount > 0 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  )}
                </button>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 bg-card">
            <div className="flex w-full gap-3 mt-4 sm:mt-0">
              <ActionButtons
                mainAction={mainAction}
                secondaryAction={secondaryAction}
                onClose={onClose}
              />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <JobApplicationsModal
        open={showApplications}
        onClose={() => setShowApplications(false)}
        applicants={applicants}
        applicationsCount={applicationsCount}
        job={job}
        onTransferConfirm={async (app) => {
          await handleConfirmTransfer(app.id);
          setShowApplications(false);
        }}
        loadingTransfer={isTransferring}
      />

      {/* AlertDialog: Confirmar Solicitação */}
      <AlertDialog open={showConfirmApply} onOpenChange={dismissConfirmApply}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja solicitar esta oferta? O responsável será notificado da sua
              solicitação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplying || isApplyingToAll}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="btn-lime gap-2"
              onClick={(e) => {
                e.preventDefault();
                confirmApply();
              }}
              disabled={isApplying || isApplyingToAll}
            >
              {isApplying || isApplyingToAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Confirmar Cancelamento */}
      <AlertDialog open={showConfirmCancel} onOpenChange={dismissConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua solicitação? Você poderá
              solicitar novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmCancel();
              }}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Cancelar solicitação"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Componente de botões de ação ──────────────────────────────────────────────

function ActionButtons({
  mainAction,
  secondaryAction,
  onClose,
}: {
  mainAction: ModalAction;
  secondaryAction: ModalAction;
  onClose: () => void;
}) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "pencil":
        return <Pencil className="w-4 h-4 mr-2" />;
      case "trash":
        return <Trash2 className="w-4 h-4 mr-2" />;
      case "repeat":
        return <Repeat className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  };

  const getButtonClass = (action: NonNullable<ModalAction>) => {
    if (action.variant === "destructive") {
      return "flex-1 transition-colors border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive";
    }
    return "flex-1 btn-lime";
  };

  // Sem ações - mostrar apenas fechar
  if (!mainAction && !secondaryAction) {
    return (
      <Button variant="" className="flex-1" onClick={onClose}>
        Fechar
      </Button>
    );
  }

  return (
    <>
      {mainAction && (
        <Button
          variant={mainAction.variant === "destructive" ? "outline" : "default"}
          className={getButtonClass(mainAction)}
          onClick={mainAction.onPress}
          disabled={mainAction.disabled}
        >
          {mainAction.loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              {getIcon(mainAction.icon)}
              {mainAction.label}
            </>
          )}
        </Button>
      )}
      {secondaryAction && (
        <Button
          className={`${mainAction ? "flex-[2]" : "flex-1"} btn-lime`}
          onClick={secondaryAction.onPress}
          disabled={secondaryAction.disabled}
        >
          {secondaryAction.loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              {getIcon(secondaryAction.icon)}
              {secondaryAction.label}
            </>
          )}
        </Button>
      )}
    </>
  );
}

// ─── Auxiliar Stethoscope ───────────────────────────────────────────────────────

function Stethoscope({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.8 2.8C3.5 1.5 1.3 1.5 0 2.8L2.8 5.6C4.1 6.9 6.3 6.9 7.6 5.6L4.8 2.8Z" />
      <path d="M2.8 4.8L5.6 7.6" />
      <path d="M7 11c0 3 2.5 5 5 5s5-2 5-5V5" />
      <path d="M7 5H5v6c0 4 3 7 7 7s7-3 7-7V5h-2" />
      <circle cx="12" cy="21" r="3" />
    </svg>
  );
}
