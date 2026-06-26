import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { ReplicationCalendar } from "../../ReplicationCalendar.tsx";

interface ReplicationSectionProps {
    enableReplication: boolean;
    onEnableReplicationChange: (checked: boolean) => void;
    replicateDates: Date[];
    onReplicateDatesChange: (dates: Date[]) => void;
    startDate: Date;
    price: string;
    singlePaymentForMultipleDates: boolean | null;
    onSinglePaymentChange: (val: boolean) => void;
}

export function ReplicationSection({
    enableReplication,
    onEnableReplicationChange,
    replicateDates,
    onReplicateDatesChange,
    startDate,
    price,
    singlePaymentForMultipleDates,
    onSinglePaymentChange,
}: ReplicationSectionProps) {
    return (
        <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="replicate" className="font-medium">
                        Replicar em outras datas
                    </Label>
                </div>
                <Switch
                    id="replicate"
                    checked={enableReplication}
                    onCheckedChange={onEnableReplicationChange}
                />
            </div>

            {enableReplication && (
                <>
                    <ReplicationCalendar
                        selectedDates={replicateDates}
                        onDatesChange={onReplicateDatesChange}
                        baseDate={startDate}
                    />

                    {/* Single Payment for Multiple Dates */}
                    {replicateDates.length > 1 && price && (
                        <div className="mt-3 bg-background/50 rounded-lg p-3">
                            <Label className="text-sm font-medium mb-2 block">
                                Pagamento para múltiplas datas
                            </Label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => onSinglePaymentChange(true)}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        singlePaymentForMultipleDates === true
                                            ? "bg-accent text-accent-foreground"
                                            : "bg-card text-foreground border border-border"
                                    )}
                                >
                                    Pagamento único
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSinglePaymentChange(false)}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        singlePaymentForMultipleDates === false
                                            ? "bg-accent text-accent-foreground"
                                            : "bg-card text-foreground border border-border"
                                    )}
                                >
                                    Por diária
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
