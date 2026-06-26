import { Button } from "@/components/ui/button.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
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
        <div className="rounded-lg p-3 rounded-lg border border-border">
            <Label className="flex items-center gap-2 mb-3 ">
                <CalendarIcon className="w-4 h-4 text-foreground" />
                Data e Horário
            </Label>

            {/* Date Picker */}
            <div className="mb-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full h-12 justify-start text-left font-normal rounded-xl px-4 bg-card",
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
            <div className="flex gap-3 pt-1">
                <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Início</Label>
                    <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => onStartTimeChange(e.target.value)}
                        className="h-12 mt-1 bg-background rounded-xl bg-card"
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
                            <SelectTrigger className="h-12 mt-1 rounded-xl bg-card">
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
                                className="h-12 flex-1 rounded-xl"
                                placeholder="Horas"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 shrink-0 rounded-xl"
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
