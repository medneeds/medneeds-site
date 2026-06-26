export const formatCurrency = (value: number, hideValues?: boolean) => {
  if (hideValues) return "R$ ••••";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
