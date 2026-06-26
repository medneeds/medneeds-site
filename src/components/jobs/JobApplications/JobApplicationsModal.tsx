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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Job } from "@/config/types.ts";
import type { JobApplication } from "@/types/api.types.ts";
import { getAvatarUrl } from "@/utils/avatar.ts";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

export interface Applicant {
  name: string;
  avatarUrl?: string | null;
  requestedAt?: Date;
  id: string;
  dateContext?: string;
  application?: JobApplication;
}

interface JobApplicationsModalProps {
  open: boolean;
  onClose: () => void;
  applicants: Applicant[];
  applicationsCount: number;
  job: Job;
  onTransferConfirm: (applicant: Applicant) => Promise<void>;
  loadingTransfer?: boolean;
}

export function JobApplicationsModal({
  open,
  onClose,
  applicants,
  applicationsCount,
  job,
  onTransferConfirm,
  loadingTransfer,
}: JobApplicationsModalProps) {
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null,
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleTransferClick = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
  };

  const confirmTransfer = async () => {
    if (selectedApplicant) {
      await onTransferConfirm(selectedApplicant);
      setSelectedApplicant(null);
    }
  };

  const getAvatarSource = (applicant: Applicant) => {
    // Se a lógica do JobDetailsModal já preencheu corretamente:
    if (applicant.avatarUrl && typeof applicant.avatarUrl === "string") {
      return getAvatarUrl(applicant.avatarUrl);
    }

    // Fallback: tentar extrair direto do payload original da requisição
    const appUser = applicant.application?.applicant as Record<string, unknown>;
    if (appUser) {
      const picture =
        appUser.profilePicture ||
        appUser.avatar_url ||
        appUser.avatarUrl ||
        appUser.photo;
      let url = undefined;

      if (typeof picture === "string") {
        url = picture;
      } else if (
        picture &&
        typeof picture === "object" &&
        "url" in picture &&
        typeof (picture as Record<string, unknown>).url === "string"
      ) {
        url = (picture as Record<string, unknown>).url as string;
      }

      return getAvatarUrl(url);
    }

    return undefined;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Solicitações</DialogTitle>
            <DialogDescription>
              {applicationsCount === 1
                ? "1 pessoa solicitou esta oferta"
                : `${applicationsCount} pessoas solicitaram esta oferta`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="mt-4 max-h-[60vh] pr-4">
            <div className="flex flex-col gap-3">
              {applicants.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma solicitação encontrada
                </div>
              ) : (
                applicants.map((applicant, index) => (
                  <div
                    key={`${applicant.id}-${index}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-muted/50 transition-colors border border-border/50 cursor-pointer group"
                    onClick={() => handleTransferClick(applicant)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarImage src={getAvatarSource(applicant)} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(applicant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-none mb-1">
                          {applicant.name}
                        </span>
                        {applicant.dateContext && (
                          <span className="text-[11px] text-foreground font-medium mb-0.5">
                            Para: {applicant.dateContext}
                          </span>
                        )}
                        {applicant.requestedAt && (
                          <span className="text-[11px] text-muted-foreground">
                            Solicitou {dayjs(applicant.requestedAt).fromNow()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-background rounded-full p-2 shadow-sm text-muted-foreground group-hover:text-primary transition-colors border border-border/50">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!selectedApplicant}
        onOpenChange={(isOpen) => !isOpen && setSelectedApplicant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Transferência</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a transferir{" "}
              {job.singlePaymentForMutipleDates || false
                ? "o bloco de ofertas de"
                : "a oferta"}{" "}
              para{" "}
              <strong className="text-foreground">
                {selectedApplicant?.name}
              </strong>
              . Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingTransfer}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="btn-lime gap-2"
              onClick={(e) => {
                e.preventDefault();
                confirmTransfer();
              }}
              disabled={loadingTransfer}
            >
              {loadingTransfer ? (
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
    </>
  );
}
