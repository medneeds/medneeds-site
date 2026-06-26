export type TransferFinanceStatus = "paid" | "pending";

export const statusLabels: Record<TransferFinanceStatus, string> = {
  paid: "Pago",
  pending: "Não pago",
};

export const statusColors: Record<TransferFinanceStatus, string> = {
  paid: "text-emerald-700 bg-emerald-50",
  pending: "text-amber-600 bg-amber-50",
};
