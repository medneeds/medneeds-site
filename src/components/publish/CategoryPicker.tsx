import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista expandida de categorias médicas em regime de plantão
export const MEDICAL_CATEGORIES = [
  // UTIs e Terapia Intensiva
  "UTI Adulto",
  "UTI Neonatal",
  "UTI Pediátrica",
  "UTI Coronariana",
  "UTI Cirúrgica",
  "UTI Neurológica",
  "UTI Queimados",
  
  // Emergência e Urgência
  "Emergência",
  "Pronto Socorro",
  "Pronto Atendimento",
  "SAMU",
  "UPA",
  "Sala de Trauma",
  "Sala Vermelha",
  
  // Especialidades Clínicas
  "Clínica Médica",
  "Cardiologia",
  "Pneumologia",
  "Gastroenterologia",
  "Nefrologia",
  "Endocrinologia",
  "Reumatologia",
  "Hematologia",
  "Oncologia",
  "Infectologia",
  "Dermatologia",
  "Geriatria",
  "Medicina Interna",
  
  // Especialidades Cirúrgicas
  "Cirurgia Geral",
  "Cirurgia Cardiovascular",
  "Cirurgia Torácica",
  "Cirurgia Vascular",
  "Cirurgia Plástica",
  "Cirurgia Pediátrica",
  "Cirurgia Oncológica",
  "Cirurgia Bariátrica",
  "Cirurgia de Cabeça e Pescoço",
  "Neurocirurgia",
  "Cirurgia Bucomaxilofacial",
  
  // Ortopedia e Trauma
  "Ortopedia",
  "Traumatologia",
  "Ortopedia Pediátrica",
  "Cirurgia de Mão",
  "Cirurgia de Coluna",
  "Ortopedia Oncológica",
  
  // Neurologia
  "Neurologia",
  "Neurologia Pediátrica",
  "Neurofisiologia",
  
  // Obstetrícia e Ginecologia
  "Obstetrícia",
  "Centro Obstétrico",
  "Maternidade",
  "Alto Risco Gestacional",
  "Ginecologia",
  "Reprodução Humana",
  
  // Pediatria
  "Pediatria",
  "Neonatologia",
  "Berçário",
  "Enfermaria Pediátrica",
  "Oncologia Pediátrica",
  "Cardiologia Pediátrica",
  
  // Anestesiologia
  "Anestesiologia",
  "Centro Cirúrgico",
  "Sala de Recuperação",
  "Anestesia Obstétrica",
  
  // Psiquiatria
  "Psiquiatria",
  "Psiquiatria de Emergência",
  "Psiquiatria Infantil",
  "Dependência Química",
  
  // Radiologia e Diagnóstico
  "Radiologia",
  "Tomografia",
  "Ressonância Magnética",
  "Ultrassonografia",
  "Medicina Nuclear",
  "Hemodinâmica",
  
  // Outras Especialidades
  "Oftalmologia",
  "Otorrinolaringologia",
  "Urologia",
  "Proctologia",
  "Medicina do Trabalho",
  "Medicina do Esporte",
  "Medicina Intensiva",
  "Medicina de Família",
  "Medicina Legal",
  "Medicina Hiperbárica",
  
  // Transplantes e Especialidades Avançadas
  "Transplante de Órgãos",
  "Transplante de Medula",
  "Cirurgia Robótica",
  "Eletrofisiologia",
  
  // Suporte e Terapias
  "Hemoterapia",
  "Hemodiálise",
  "Quimioterapia",
  "Radioterapia",
  "Medicina Paliativa",
  "Cuidados Paliativos",
  "Home Care",
  
  // Outros
  "Outro",
] as const;

export type MedicalCategory = typeof MEDICAL_CATEGORIES[number];

interface CategoryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (category: MedicalCategory) => void;
}

export function CategoryPicker({
  open,
  onOpenChange,
  value,
  onSelect,
}: CategoryPickerProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return MEDICAL_CATEGORIES;
    
    const searchLower = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return MEDICAL_CATEGORIES.filter((cat) => {
      const catNormalized = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return catNormalized.includes(searchLower);
    });
  }, [search]);

  const handleSelect = (category: MedicalCategory) => {
    onSelect(category);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-accent" />
            Selecionar Categoria
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories list with proper scroll */}
        <ScrollArea className="flex-1 max-h-[400px] -mx-6 px-6">
          <div className="grid grid-cols-1 gap-1 py-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma categoria encontrada</p>
                <p className="text-sm mt-1">Tente outro termo de busca</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleSelect(category)}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg text-left transition-all flex items-center justify-between",
                    value === category
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span>{category}</span>
                  {value === category && <Check className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          {filteredCategories.length} categorias disponíveis
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Versão mobile como bottom sheet
interface MobileCategoryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (category: MedicalCategory) => void;
}

export function MobileCategoryPicker({
  open,
  onOpenChange,
  value,
  onSelect,
}: MobileCategoryPickerProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return MEDICAL_CATEGORIES;
    
    const searchLower = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return MEDICAL_CATEGORIES.filter((cat) => {
      const catNormalized = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return catNormalized.includes(searchLower);
    });
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Selecionar Categoria</h2>
        <button
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Fechar
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma categoria encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredCategories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onSelect(category);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full px-4 py-4 text-left flex items-center justify-between",
                  value === category
                    ? "bg-lime-muted text-foreground font-medium"
                    : "text-foreground active:bg-muted"
                )}
              >
                <span>{category}</span>
                {value === category && <Check className="h-5 w-5 text-accent" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
        {filteredCategories.length} categorias
      </div>
    </div>
  );
}
