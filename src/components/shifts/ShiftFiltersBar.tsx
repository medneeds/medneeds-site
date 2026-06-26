import { Filter, X, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShiftFilters, useShiftFilterOptions } from "@/hooks/useShifts";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ShiftFiltersBarProps {
  filters: ShiftFilters;
  onFiltersChange: (filters: ShiftFilters) => void;
  isMobile?: boolean;
}

const categories = [
  "UTI Adulto",
  "UTI Neonatal",
  "UTI Pediátrica",
  "Emergência",
  "Pronto Socorro",
  "Clínica Médica",
  "Cirurgia",
  "Obstetrícia",
  "Pediatria",
  "Cardiologia",
  "Ortopedia",
  "Neurologia",
  "Anestesiologia",
  "Outro",
];

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", 
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", 
  "SP", "SE", "TO"
];

const paymentTypes = [
  { value: "NR", label: "No Recebimento" },
  { value: "AC", label: "A Combinar" },
  { value: "AV", label: "À Vista" },
];

export function ShiftFiltersBar({ filters, onFiltersChange, isMobile }: ShiftFiltersBarProps) {
  const { cities } = useShiftFilterOptions();
  const [open, setOpen] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof ShiftFilters, value: string | number | boolean | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value ?? undefined,
    });
  };

  const FilterContent = () => (
    <div className={cn(
      "space-y-4",
      isMobile ? "p-4" : ""
    )}>
      {/* Scale Holes Only Toggle */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <Label htmlFor="scale-holes" className="text-sm font-medium cursor-pointer">
              Furos de escala
            </Label>
          </div>
          <Switch
            id="scale-holes"
            checked={filters.scaleHolesOnly || false}
            onCheckedChange={(checked) => updateFilter("scaleHolesOnly", checked ? true : undefined)}
          />
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Vagas exclusivas para membros das suas equipes. Só aparecem plantões dos grupos em que você participa.
        </p>
      </div>

      {/* My Offers Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-accent" />
          <Label htmlFor="my-offers" className="text-sm font-medium cursor-pointer">
            Suas ofertas
          </Label>
        </div>
        <Switch
          id="my-offers"
          checked={filters.myOffers || false}
          onCheckedChange={(checked) => updateFilter("myOffers", checked ? true : undefined)}
        />
      </div>

      {/* State Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Estado (UF)</label>
        <Select
          value={filters.state || "all"}
          onValueChange={(value) => updateFilter("state", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {brazilianStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Cidade</label>
        <Select
          value={filters.city || "all"}
          onValueChange={(value) => updateFilter("city", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Especialidade/Setor</label>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) => updateFilter("category", value as any)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as especialidades</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min Value Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Valor mínimo (R$)</label>
        <Input
          type="number"
          placeholder="Ex: 1000"
          value={filters.minValue || ""}
          onChange={(e) => updateFilter("minValue", e.target.value ? Number(e.target.value) : undefined)}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">Filtra plantões acima deste valor</p>
      </div>

      {/* Payment Type Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Forma de pagamento</label>
        <Select
          value={filters.paymentType || "all"}
          onValueChange={(value) => updateFilter("paymentType", value as any)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as formas</SelectItem>
            {paymentTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label} ({pt.value})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full mt-2"
        >
          <X className="w-4 h-4 mr-1" />
          Limpar todos os filtros
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filtrar ofertas</SheetTitle>
          </SheetHeader>
          <FilterContent />
          <div className="p-4 pt-0">
            <Button className="w-full btn-lime" onClick={() => setOpen(false)}>
              Aplicar filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filtros</span>
        {activeFiltersCount > 0 && (
          <span className="text-xs text-muted-foreground">
            ({activeFiltersCount} ativo{activeFiltersCount > 1 ? "s" : ""})
          </span>
        )}
      </div>
      <FilterContent />
    </div>
  );
}
