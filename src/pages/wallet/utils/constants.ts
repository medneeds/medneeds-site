export type FinanceStatus = "received" | "pending";

export const statusLabels: Record<FinanceStatus, string> = {
  received: "Pago",
  pending: "A Receber",
};

export const statusColors: Record<FinanceStatus, string> = {
  received: "text-emerald-600 bg-emerald-50",
  pending: "text-amber-600 bg-amber-50",
};
