import { Label } from "@/components/ui/label";
import {Earth, EyeOff, Lock} from "lucide-react";
import { cn } from "@/lib/utils";

export type VisibilityType = "PUBLIC" | "PRIVATE";

interface VisibilitySectionProps {
    value: VisibilityType;
    onChange: (value: VisibilityType) => void;
}

const options = [
    {
        id: "PRIVATE",
        label: "Agenda pessoal",
        description: "Visível apenas na sua agenda",
        icon: Lock,
    },
    {
        id: "PUBLIC",
        label: "Pública",
        description: "Visível para todos os usuários",
        icon: Earth,
    },
    {
        id: 'UNLISTED',
        label: 'Não listada',
        description: 'Acessível por compartilhamento de link',
        icon: EyeOff
    }
] as const;

export function VisibilitySection({ value, onChange }: VisibilitySectionProps) {
    return (
        <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Visibilidade</Label>
            <div className="grid grid-cols-2 gap-3">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isSelected = value === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onChange(option.id as VisibilityType)}
                            className={cn(
                                "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left gap-2",
                                isSelected
                                    ? "border-accent bg-accent/5"
                                    : "border-border hover:border-muted-foreground/20 bg-background"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4")} />
                                <span className={cn("font-semibold text-sm")}>
                                    {option.label}
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground leading-tight">
                                {option.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
