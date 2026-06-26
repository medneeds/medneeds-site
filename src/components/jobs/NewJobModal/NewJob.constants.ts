import { PaymentMethod } from "./NewJob.types.ts";

export const PAYMENT_TYPES: { value: PaymentMethod; label: string; description: string }[] = [
    { value: "AV", label: "À Vista", description: "Pagamento imediato" },
    { value: "NR", label: "No Recebimento", description: "Pagamento no mês referente" },
    { value: "AC", label: "A Combinar", description: "Acordo entre as partes" },
];
