import type { Job } from "@/types/api.types";

export const formatPaymentMethod = (method: string) => {
  switch (method) {
    case "AV":
      return "À vista (AV)";
    case "NR":
      return "No recebimento (NR)";
    case "AC":
      return "A combinar (AC)";
  }
};

// Aceita qualquer objeto com startDateTime — compatível com Job de @/config/types e @/types/api.types
export function getJobDateInfo(job: { startDateTime?: string | Date }): Date {
  return new Date(job.startDateTime ?? "");
}

