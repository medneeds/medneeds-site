import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils.ts";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useMemo, useState } from "react";

interface DateTimeSectionProps {
    date: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
    startTime: string;
    onStartTimeChange: (val: string) => void;
    duration: number;
    onDurationChange: (val: number) => void;
}

export function DateTimeSection({
    date,
    onDateChange,
    startTime,
    onStartTimeChange,
    duration,
    onDurationChange,
}: DateTimeSectionProps) {
    const durations = useMemo(() => {
        const durations = [];
        for (let i = 1; i <= 18; i++) {
            durations.push({ id: (i * 4).toString(), label: `${i * 4} horas` });
            if (i == 1) durations.push({ id: '6', label: '6 horas' });
        }
        return durations;
    }, []);

    const [isCustomMode, setIsCustomMode] = useState(() => !durations.find(d => d.id === duration.toString()));

    const handleDurationChange = (val: string) => {
        if (val === "custom") {
            setIsCustomMode(true);
        } else {
            setIsCustomMode(false);
            onDurationChange(parseInt(val));
        }
    };

    return (
        <div className="bg-card rounded-lg border border-border p-3">
            <Label className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4 text-accent" />
                Data e Horário
            </Label>

            {/* Date Picker */}
            <div className="mb-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={onDateChange}
                            initialFocus
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Time and Duration */}
            <div className="flex gap-3 pt-3 border-t border-border">
                <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => onStartTimeChange(e.target.value)}
                        className="mt-1"
                    />
                </div>
                <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                        Duração {isCustomMode && <span className="text-muted-foreground/70 font-normal">(horas)</span>}
                    </Label>
                    {!isCustomMode ? (
                        <Select
                            value={duration.toString()}
                            onValueChange={handleDurationChange}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {durations.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id.toString()}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom">Personalizado...</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                type="number"
                                min={1}
                                max={72}
                                value={duration || ""}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value) || 0;
                                    if (val > 72) val = 72;
                                    onDurationChange(val);
                                }}
                                className="flex-1"
                                placeholder="Horas"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={() => {
                                    setIsCustomMode(false);
                                    if (!durations.find(d => d.id === duration.toString())) {
                                        onDurationChange(12);
                                    }
                                }}
                            >
                                <X className="w-4 h-4 cursor-pointer" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
