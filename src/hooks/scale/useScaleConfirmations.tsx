import { useQuery } from "@tanstack/react-query";
// TODO: Verificar sobre esse serviço quando for implementar gestão
// import { scaleService } from "@/services/scaleService";

export interface ConfirmationStatus {
  assignmentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  sector?: string;
  status: "draft" | "published" | "confirmed" | "declined";
}

export interface ConfirmationsSummary {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  confirmations: ConfirmationStatus[];
}

export function useScaleConfirmations(scaleId: string | undefined) {
  return useQuery({
    queryKey: ["scale-confirmations", scaleId],
    queryFn: async (): Promise<ConfirmationsSummary> => {
      if (!scaleId) {
        return { total: 0, confirmed: 0, declined: 0, pending: 0, confirmations: [] };
      }
      // TODO: Verificar sobre esse serviço quando for implementar gestão
      // const data = await scaleService.getScaleConfirmations(scaleId);
      return {} as ConfirmationsSummary;
    },
    enabled: !!scaleId,
    staleTime: 30000,
  });
}
