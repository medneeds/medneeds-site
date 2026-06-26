import { create } from "zustand";
import { CoreJobFilter, JobBlockFilter, JobFilter } from "@/services/jobs";

interface FilterEditState {
  // Estado do filtro sendo editado
  id?: string;
  title: string;
  type: "feed" | "payments" | "transfer" | "onboarding" | undefined;
  conditions: JobBlockFilter[];

  // Estado de navegação
  currentStep: "name" | "type" | "conditions";

  // Actions
  setTitle: (title: string) => void;
  setType: (type: "feed" | "payments" | "transfer" | "onboarding") => void;
  setConditions: (conditions: JobBlockFilter[]) => void;
  updateCondition: (index: number, condition: JobBlockFilter) => void;
  addCondition: () => void;
  removeCondition: (index: number) => void;

  // Actions de navegação
  setCurrentStep: (step: "name" | "type" | "conditions") => void;

  // Actions de reset
  reset: () => void;
  loadFilterForEdit: (filter: CoreJobFilter) => void; // Para carregar filtro existente
}

export const useFilterEditStore = create<FilterEditState>((set, get) => ({
  // Estado inicial
  id: undefined,
  title: "",
  type: undefined,
  conditions: [],
  currentStep: "name",

  // Actions básicas do filtro
  setTitle: (title: string) => set({ title }),

  setType: (type: "feed" | "payments" | "transfer" | "onboarding") =>
    set({ type }),

  setConditions: (conditions: JobBlockFilter[]) => set({ conditions }),

  updateCondition: (index: number, condition: JobBlockFilter) => {
    const { conditions } = get();
    const newConditions = [...conditions];
    newConditions[index] = condition;
    set({ conditions: newConditions });
  },

  addCondition: () => {
    const { conditions } = get();
    // Evitar campos não renderizáveis no editor (showPastJobs é tratado fora do editor)
    const newCondition: JobBlockFilter = {} as any;
    set({ conditions: [...conditions, newCondition] });
  },

  removeCondition: (index: number) => {
    const { conditions } = get();
    const newConditions = conditions.filter((_, i) => i !== index);
    set({ conditions: newConditions });
  },

  // Actions de navegação
  setCurrentStep: (step: "name" | "type" | "conditions") =>
    set({ currentStep: step }),

  // Actions de reset
  reset: () =>
    set({
      id: undefined,
      title: "",
      type: undefined,
      conditions: [],
      currentStep: "name",
    }),

  // Carregar filtro existente para edição
  loadFilterForEdit: (filter: CoreJobFilter) => {
    console.log("=== DEBUG LOAD FILTER FOR EDIT ===");
    console.log("Carregando filtro para edição:", filter);
    console.log("Filtro conditions:", filter.conditions);

    // Assegura que apenas JobBlockFilter seja passado para o estado de edição
    const blockConditions = (filter.conditions || [])
      .filter(
        (c): c is JobBlockFilter =>
          typeof c === "object" && !("conjunction" in c),
      )
      .map((c) => {
        const { showPastJobs, ...rest } = c as any;
        return rest;
      });

    set({
      id: filter.id,
      title: filter.title || "",
      type: filter.type,
      conditions: blockConditions,
      currentStep: "conditions", // Sempre abrir na seção de condições
    });
  },
}));
