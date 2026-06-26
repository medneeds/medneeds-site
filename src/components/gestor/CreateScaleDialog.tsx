import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Copy, 
  LayoutTemplate, 
  CalendarDays,
  Sparkles,
  Loader2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateScaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: Date;
  hasPreviousMonth: boolean;
  hasTeamTemplate: boolean;
  onCreateFromPrevious: () => void;
  onCreateFromTemplate: () => void;
  onCreateEmpty: () => void;
  isCreating: boolean;
}

type TemplateOption = "previous" | "template" | "empty" | "ai";

const templateOptions = [
  {
    id: "previous" as const,
    icon: Copy,
    title: "Copiar mês anterior",
    description: "Usa a escala do mês passado como base",
    available: true,
  },
  {
    id: "template" as const,
    icon: LayoutTemplate,
    title: "Template da equipe",
    description: "Aplica o template padrão salvo",
    available: true,
  },
  {
    id: "empty" as const,
    icon: CalendarDays,
    title: "Começar do zero",
    description: "Gera dias vazios para você preencher",
    available: true,
  },
  {
    id: "ai" as const,
    icon: Sparkles,
    title: "Sugestão com IA",
    description: "Analisa padrões e sugere distribuição",
    available: false, // Coming soon
  },
];

export function CreateScaleDialog({
  open,
  onOpenChange,
  selectedMonth,
  hasPreviousMonth,
  hasTeamTemplate,
  onCreateFromPrevious,
  onCreateFromTemplate,
  onCreateEmpty,
  isCreating,
}: CreateScaleDialogProps) {
  const [selectedOption, setSelectedOption] = useState<TemplateOption>("empty");

  const handleCreate = () => {
    switch (selectedOption) {
      case "previous":
        onCreateFromPrevious();
        break;
      case "template":
        onCreateFromTemplate();
        break;
      case "empty":
      default:
        onCreateEmpty();
        break;
    }
  };

  const isOptionDisabled = (optionId: TemplateOption) => {
    if (optionId === "previous") return !hasPreviousMonth;
    if (optionId === "template") return !hasTeamTemplate;
    if (optionId === "ai") return true; // Coming soon
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Escala</DialogTitle>
          <DialogDescription>
            Escolha como iniciar a escala de{" "}
            <span className="font-medium text-foreground capitalize">
              {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedOption}
          onValueChange={(v) => setSelectedOption(v as TemplateOption)}
          className="grid gap-3 py-4"
        >
          {templateOptions.map((option) => {
            const Icon = option.icon;
            const disabled = isOptionDisabled(option.id);
            
            return (
              <label
                key={option.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                  selectedOption === option.id
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground/30",
                  disabled && "opacity-50 cursor-not-allowed hover:border-border"
                )}
              >
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  disabled={disabled}
                  className="sr-only"
                />
                <div className={cn(
                  "p-2.5 rounded-lg",
                  selectedOption === option.id ? "bg-accent/20" : "bg-secondary"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    selectedOption === option.id ? "text-accent" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      selectedOption === option.id ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.title}
                    </span>
                    {option.id === "ai" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium">
                        Em breve
                      </span>
                    )}
                    {option.id === "previous" && !hasPreviousMonth && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Sem dados
                      </span>
                    )}
                    {option.id === "template" && !hasTeamTemplate && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Não configurado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {selectedOption === option.id && !disabled && (
                  <ArrowRight className="w-4 h-4 text-accent" />
                )}
              </label>
            );
          })}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="btn-lime" 
            onClick={handleCreate}
            disabled={isCreating || isOptionDisabled(selectedOption)}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Escala"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
