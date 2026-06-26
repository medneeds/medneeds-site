import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { DollarSign, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { PAYMENT_TYPES } from "../constants.ts";
import { PaymentMethod } from "../types.ts";

interface PaymentSectionProps {
    price: string;
    onPriceChange: (val: string) => void;
    paymentMethod: PaymentMethod;
    onPaymentMethodChange: (val: PaymentMethod) => void;
    showPaymentPicker: boolean;
    onTogglePaymentPicker: () => void;
    errorMessage?: string;
}

export function PaymentSection({
    price,
    onPriceChange,
    paymentMethod,
    onPaymentMethodChange,
    showPaymentPicker,
    onTogglePaymentPicker,
    errorMessage,
}: PaymentSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <div className="flex-1">
                    <Label className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-accent" />
                        Valor
                    </Label>
                    <Input
                        value={price}
                        onChange={(e) => onPriceChange(e.target.value)}
                        placeholder="R$ 0,00"
                        className={cn("text-base font-medium", errorMessage && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errorMessage && <span className="text-xs text-destructive mt-1 block">{errorMessage}</span>}
                </div>
                <div className="flex-1">
                    <Label className="mb-2 block">Pagamento</Label>
                    <button
                        type="button"
                        onClick={onTogglePaymentPicker}
                        className="w-full bg-accent text-accent-foreground rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 font-medium text-sm"
                    >
                        {PAYMENT_TYPES.find(p => p.value === paymentMethod)?.label}
                        <ChevronRight className={cn("w-4 h-4 transition-transform", showPaymentPicker && "rotate-90")} />
                    </button>
                </div>
            </div>

            {showPaymentPicker && (
                <div className="bg-card rounded-lg border border-border p-2 space-y-1">
                    {PAYMENT_TYPES.map((pt) => (
                        <button
                            key={pt.value}
                            type="button"
                            onClick={() => onPaymentMethodChange(pt.value)}
                            className={cn(
                                "w-full px-3 py-2.5 rounded-lg text-left transition-all",
                                paymentMethod === pt.value
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-muted"
                            )}
                        >
                            <div className="font-medium text-sm">{pt.label} ({pt.value})</div>
                            <div className="text-xs opacity-80">{pt.description}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
