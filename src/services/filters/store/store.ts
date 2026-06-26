import { create } from 'zustand';
import { CoreJobFilter } from '@/services/jobs';
import { filtersService } from '../FiltersService.ts';
import { getScopedItem, USER_SCOPED_KEYS } from '@/services/filters/utils/userPrefs.ts';
import { authService } from '@/services/auth/AuthService.ts';

// Função utilitária para validar condições - garantir que showPastJobs esteja definido
const validateConditions = (conditions: any[]) => {
  return conditions.map((condition, index) => {
    // Verificar se é JobBlockFilter (que tem showPastJobs)
    if ('showPastJobs' in condition) {
      const originalValue = condition.showPastJobs;
      const correctedValue = condition.showPastJobs !== undefined ? condition.showPastJobs : false;
      
      if (originalValue === undefined) {
        console.log(`=== CORREÇÃO AUTOMÁTICA ===`);
        console.log(`Condição ${index}: showPastJobs estava undefined, corrigido para ${correctedValue}`);
      }
      
      return {
        ...condition,
        showPastJobs: correctedValue
      };
    }
    // Se for JobFilter, retornar como está
    return condition;
  });
};

interface FiltersState {
  filters: CoreJobFilter[];
  activeFilter?: CoreJobFilter;
  isLoading: boolean;
  error?: string;
  lastSavedFilter?: string; // ID do último filtro salvo
  shouldRefreshFeed: boolean; // Flag para indicar que o Feed deve ser atualizado
  
  // Actions
  loadFilters: () => Promise<void>;
  saveFilter: (filter: CoreJobFilter) => Promise<CoreJobFilter>;
  removeFilter: (id: string) => Promise<void>;
  setActiveFilter: (filter?: CoreJobFilter) => void;
  clearFilters: () => Promise<void>;
  isImmutableFilter: (title: string) => boolean;
  clearRefreshFlag: () => void; // Limpar a flag de refresh
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: [],
  activeFilter: undefined,
  isLoading: false,
  error: undefined,
  lastSavedFilter: undefined,
  shouldRefreshFeed: false,

  loadFilters: async () => {
    set({ isLoading: true, error: undefined });
    try {
      let filters = await filtersService.getAll();
      
      // Validar e corrigir filtros existentes - garantir que todas as condições tenham showPastJobs
      let validatedFilters = filters.map(filter => ({
        ...filter,
        conditions: validateConditions(filter.conditions)
      }));

      // Unicidade de onboarding em runtime: se vier mais de um, manter o primeiro
      const seenOnboarding = new Set<string>(['para você','para voce']);
      const result: CoreJobFilter[] = [];
      let onboardingIncluded = false;
      for (const f of validatedFilters) {
        const isOnb = (f.type === 'onboarding') || seenOnboarding.has((f.title || '').toLowerCase());
        if (isOnb) {
          if (onboardingIncluded) continue;
          onboardingIncluded = true;
        }
        result.push(f);
      }
      validatedFilters = result;

      // Regra: o filtro de onboarding deve vir primeiro (preferindo o que vier do servidor)
      const raw = authService.user?.filters;
      let serverOnboardingId: string | undefined;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Formato atual: { onboarding: {...}, feeds: [...] }
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            serverOnboardingId = parsed.onboarding?.id;
          }
        } catch (error) {
          console.error('Erro ao parsear filtros do servidor:', error);
        }
      }
      const onboardingId = serverOnboardingId || await getScopedItem(USER_SCOPED_KEYS.ONBOARDING_FILTER_ID);
      if (onboardingId) {
        const indexOnboarding = validatedFilters.findIndex(f => f.id === onboardingId);
        if (indexOnboarding > 0) {
          const [onboardingFilter] = validatedFilters.splice(indexOnboarding, 1);
          validatedFilters = [onboardingFilter, ...validatedFilters];
        }
      }
      
      // logs removidos
      
      // Ordenar: onboarding primeiro (type 'onboarding' ou título 'Para você')
      const ordered = [...validatedFilters].sort((a, b) => {
        const isOnb = (x: CoreJobFilter) => (x.type === 'onboarding') || ((x.title || '').toLowerCase() === 'para você' || (x.title || '').toLowerCase() === 'para voce');
        if (isOnb(a) && !isOnb(b)) return -1;
        if (!isOnb(a) && isOnb(b)) return 1;
        return 0;
      });
      
      set({ filters: ordered, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load filters',
        isLoading: false 
      });
    }
  },

  saveFilter: async (filter: CoreJobFilter): Promise<CoreJobFilter> => {
    // salvando filtro
    
    set({ isLoading: true, error: undefined });
    try {
      // Validar e corrigir o filtro antes de salvar
      const validatedFilter = {
        ...filter,
        conditions: validateConditions(filter.conditions)
      };
      
      // filtro validado
      
      const savedFilter = await filtersService.save(validatedFilter);
      // Recarregar filtros usando o método loadFilters para manter a ordenação
      await get().loadFilters();
      
      set({ 
        // Se o filtro salvo era o ativo, atualiza ele também
        activeFilter: get().activeFilter?.id === savedFilter.id ? savedFilter : get().activeFilter,
        lastSavedFilter: savedFilter.id,
        shouldRefreshFeed: true, // Marcar que o Feed deve ser atualizado
        isLoading: false 
      });
      
      // store atualizada
      return savedFilter;
    } catch (error) {
      console.error('Erro ao salvar filtro (modo runtime):', error);
      // Modo runtime: manter no estado local sem persistir
      const current = get().filters;
      const validatedFilter = {
        ...filter,
        conditions: validateConditions(filter.conditions)
      };
      const ephemeralId = validatedFilter.id || `temp-${Date.now().toString(36)}`;
      validatedFilter.id = ephemeralId;
      const existingIndex = current.findIndex(f => f.id === validatedFilter.id);
      const nextFilters = [...current];
      if (existingIndex >= 0) {
        nextFilters[existingIndex] = validatedFilter;
      } else {
        nextFilters.unshift(validatedFilter);
      }

      // Ordenar colocando onboarding/"Para você" primeiro
      const ordered = [...nextFilters].sort((a, b) => {
        const isOnb = (x: CoreJobFilter) => (x.type === 'onboarding') || ((x.title || '').toLowerCase() === 'para você' || (x.title || '').toLowerCase() === 'para voce');
        if (isOnb(a) && !isOnb(b)) return -1;
        if (!isOnb(a) && isOnb(b)) return 1;
        return 0;
      });

      set({ 
        filters: ordered,
        activeFilter: get().activeFilter?.id === ephemeralId ? validatedFilter : get().activeFilter,
        lastSavedFilter: ephemeralId,
        shouldRefreshFeed: true,
        isLoading: false,
        error: undefined,
      });
      return validatedFilter;
    }
  },

  removeFilter: async (id: string) => {
    // removendo filtro
    
    set({ isLoading: true, error: undefined });
    try {
      await filtersService.remove(id);
      // Verificar se o filtro removido era o ativo
      const wasActiveFilter = get().activeFilter?.id === id;
      // filtro removido era ativo?
      
      // Recarregar filtros usando o método loadFilters para manter a ordenação
      await get().loadFilters();
      
      set({ 
        // Se o filtro removido era o ativo, limpa ele
        activeFilter: wasActiveFilter ? undefined : get().activeFilter,
        shouldRefreshFeed: true, // Marcar que o Feed deve ser atualizado
        lastSavedFilter: wasActiveFilter ? 'REMOVED' : undefined, // Indicar que foi removido
        isLoading: false 
      });
      
      // store atualizada após remoção
    } catch (error) {
      console.error('Erro ao remover filtro:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove filter',
        isLoading: false 
      });
    }
  },

  setActiveFilter: (filter?: CoreJobFilter) => {
    set({ activeFilter: filter });
  },

  clearFilters: async () => {
    set({ isLoading: true, error: undefined });
    try {
      await filtersService.clear();
      set({ 
        filters: [],
        activeFilter: undefined,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to clear filters',
        isLoading: false 
      });
    }
  },

  isImmutableFilter: (title: string) => {
    return filtersService.isImmutableFilter(title);
  },

  clearRefreshFlag: () => {
    // limpando flags de refresh
    set({ shouldRefreshFeed: false, lastSavedFilter: undefined });
    // flags limpas
  },
})); 