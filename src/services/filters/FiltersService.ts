import { CoreJobFilter, ALL_JOBS_FILTER, AVAILABLE_JOBS_FILTER, MY_JOBS_FILTER } from '@/services/jobs';
import { authService } from '@/services/auth/AuthService.ts';
import { setScopedItem, USER_SCOPED_KEYS } from '@/services/filters/utils/userPrefs.ts';
import { API_HOST } from '@/config/constants';

const STORAGE_KEY = '@medneeds:filters';

// Lista de filtros padrão que não podem ser sobrescritos
const IMMUTABLE_FILTERS = [
  // ALL_JOBS_FILTER,
  AVAILABLE_JOBS_FILTER,
  MY_JOBS_FILTER,
];

// Função para serializar filtros preservando objetos Date
const serializeFilter = (filter: CoreJobFilter): any => {
  const serializedFilter = {
    ...filter,
    conditions: filter.conditions.map(condition => {
      if ('betweenDates' in condition && condition.betweenDates) {
        return {
          ...condition,
          betweenDates: condition.betweenDates.map(date => date.toISOString())
        };
      }
      return condition;
    })
  };
  return serializedFilter;
};

// Função para deserializar filtros convertendo strings de data de volta para Date
const deserializeFilter = (filterData: any): CoreJobFilter => {
  return {
    ...filterData,
    conditions: filterData.conditions.map((condition: any) => {
      if (condition.betweenDates && Array.isArray(condition.betweenDates)) {
        return {
          ...condition,
          betweenDates: condition.betweenDates.map((dateStr: string) => new Date(dateStr))
        };
      }
      return condition;
    })
  };
};

class FiltersService {
  private static instance: FiltersService;

  private constructor() { }

  static getInstance(): FiltersService {
    if (!FiltersService.instance) {
      FiltersService.instance = new FiltersService();
    }
    return FiltersService.instance;
  }

  private async getUserScopedKey(): Promise<string | null> {
    const userId = authService.user?.id;
    if (!userId) return null;
    return `${STORAGE_KEY}:${userId}`;
  }

  // Método para resolver filtros com user ID dinâmico
  private resolveImmutableFilters(): CoreJobFilter[] {
    const userId = authService.user?.id || 'invalid';

    // Cria uma cópia dinâmica com o ID do usuário correto para evitar problema de startup
    const dynamicMyJobsFilter: CoreJobFilter = {
      ...MY_JOBS_FILTER,
      id: 'my-jobs',
      conditions: MY_JOBS_FILTER.conditions.map((c: any) => ({
        ...c,
        inFrom: c.inFrom?.map((id: string) => id === 'invalid' ? userId : id) || [userId]
      }))
    };

    return [
      AVAILABLE_JOBS_FILTER,
      dynamicMyJobsFilter,
    ];
  }

  async getAll(): Promise<CoreJobFilter[]> {
    try {
      const user = authService.user;
      // Sem usuário logado: apenas filtros imutáveis
      if (!user) return this.resolveImmutableFilters();

      // Lê filtros do servidor, armazenados no campo Profile.filters (JSON string)
      // Suporta dois formatos: legado (array) e novo (objeto)
      let raw = user.filters;

      try {
        const baseHeaders: HeadersInit = { 'Content-Type': 'application/json' };
        const auth = authService.getAuthHeader();
        const headers: HeadersInit = auth && (auth as any).Authorization
          ? { ...baseHeaders, Authorization: (auth as any).Authorization }
          : baseHeaders;
        const res = await fetch(`${API_HOST}/profiles/${user.id}`, { headers });
        if (res.ok) {
          const fresh = await res.json();
          raw = fresh?.filters ?? raw;
        }
      } catch { }

      const immutableFilters = this.resolveImmutableFilters();

      let feeds: CoreJobFilter[] = [];
      let payments: CoreJobFilter[] = [];
      let transfers: CoreJobFilter[] = [];
      let onboarding: CoreJobFilter | undefined;

      if (raw) {
        try {
          const parsed = JSON.parse(raw);

          // Formato atual: { onboarding: {...}, feeds: [...] }
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const de = (arr: any[]) => Array.isArray(arr) ? arr.map((x) => deserializeFilter(x)) : [];
            onboarding = parsed.onboarding ? deserializeFilter(parsed.onboarding) : undefined;
            feeds = de(parsed.feeds || []);
            payments = de(parsed.payments || []);
            transfers = de(parsed.transfers || []);
          }
        } catch (error) {
          console.error('Erro ao parsear filtros:', error);
        }
      }

      return [
        ...(onboarding ? [onboarding] : []),
        ...immutableFilters,
        ...feeds,
        ...payments,
        ...transfers,
      ];
    } catch (error) {
      console.error('Error loading filters:', error);
      return this.resolveImmutableFilters();
    }
  }

  async save(filter: CoreJobFilter): Promise<CoreJobFilter> {
    try {
      const user = authService.user;
      if (!user) throw new Error('Usuário não autenticado');
      // Verificar se não está tentando sobrescrever um filtro padrão
      const immutableTitles = this.resolveImmutableFilters().map(f => f.title);
      if (filter.id === undefined && immutableTitles.includes(filter.title)) {
        throw new Error(`Não é possível sobrescrever o filtro padrão "${filter.title}"`);
      }

      // Carregar filtros atuais do usuário (sempre tentando pegar a versão mais recente)
      let raw = user.filters;
      try {
        const baseHeaders: HeadersInit = { 'Content-Type': 'application/json' };
        const auth = authService.getAuthHeader();
        const headers: HeadersInit = auth && (auth as any).Authorization
          ? { ...baseHeaders, Authorization: (auth as any).Authorization }
          : baseHeaders;
        const res = await fetch(`${API_HOST}/profiles/${user.id}`, { headers });
        if (res.ok) {
          const fresh = await res.json();
          raw = fresh?.filters ?? raw;
        }
      } catch { }

      let filterToSave = { ...filter };

      // Preparar objeto de filtros (novo formato)
      let payloadObj: any = {};
      try { payloadObj = raw ? JSON.parse(raw) || {} : {}; } catch { payloadObj = {}; }
      const ensureArr = (a: any) => Array.isArray(a) ? a : [];
      payloadObj.feeds = ensureArr(payloadObj.feeds);
      payloadObj.payments = ensureArr(payloadObj.payments);
      payloadObj.transfers = ensureArr(payloadObj.transfers);

      // Mesclar por id (ou por título se id ausente)
      const keyOf = (f: CoreJobFilter) => f.id || (f.title || '').toLowerCase();
      if (!filterToSave.id) {
        filterToSave.id = Math.random().toString(36).substring(2, 9);
      }
      const serialized = serializeFilter(filterToSave);
      const upsertList = (listName: 'feeds' | 'payments' | 'transfers') => {
        const list = payloadObj[listName] as any[];
        const idx = list.findIndex((f: any) => keyOf(f as CoreJobFilter) === keyOf(filterToSave));
        if (idx >= 0) list[idx] = serialized; else list.push(serialized);
      };

      const isOnboarding = (f: CoreJobFilter) => f.type === 'onboarding' || ((f.title || '').toLowerCase() === 'para você' || (f.title || '').toLowerCase() === 'para voce');
      if (isOnboarding(filterToSave)) {
        payloadObj.onboarding = serialized;
      } else if (filterToSave.type === 'payments') {
        upsertList('payments');
      } else if (filterToSave.type === 'transfer') {
        upsertList('transfers');
      } else {
        upsertList('feeds');
        payloadObj.lastFeedFilterId = filterToSave.id;
      }

      const payload = JSON.stringify(payloadObj);
      try {
        await authService.updateProfile({ filters: payload });
        await authService.setFiltersLocally(payload);
        // Garantir estado sincronizado: recarregar usuário do servidor (best-effort)
        await authService.refreshUser().catch(() => { });
      } catch {
        // Mesmo que a API falhe, persistimos localmente para não perder durante a sessão
        await authService.setFiltersLocally(payload);
      }

      // Persistir ponteiro do onboarding localmente para ordenação estável
      if (isOnboarding(filterToSave) && filterToSave.id) {
        try { await setScopedItem(USER_SCOPED_KEYS.ONBOARDING_FILTER_ID, filterToSave.id); } catch { }
      }
      return filterToSave;
    } catch (error) {
      console.error('Error saving filter:', error);
      throw error instanceof Error ? error : new Error('Failed to save filter');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const user = authService.user;
      if (!user) throw new Error('Usuário não autenticado');
      // Ler objeto atual e remover por id em todas as coleções
      let raw = user.filters;
      try {
        const baseHeaders: HeadersInit = { 'Content-Type': 'application/json' };
        const auth = authService.getAuthHeader();
        const headers: HeadersInit = auth && (auth as any).Authorization
          ? { ...baseHeaders, Authorization: (auth as any).Authorization }
          : baseHeaders;
        const res = await fetch(`${API_HOST}/profiles/${user.id}`, { headers });
        if (res.ok) {
          const fresh = await res.json();
          raw = fresh?.filters ?? raw;
        }
      } catch { }
      let payloadObj: any = {};
      try { payloadObj = raw ? JSON.parse(raw) || {} : {}; } catch { payloadObj = {}; }
      const filterArr = (a: any[]) => Array.isArray(a) ? a.filter((f: any) => f?.id !== id) : [];
      if (payloadObj.onboarding && payloadObj.onboarding.id === id) delete payloadObj.onboarding;
      payloadObj.feeds = filterArr(payloadObj.feeds);
      payloadObj.payments = filterArr(payloadObj.payments);
      payloadObj.transfers = filterArr(payloadObj.transfers);
      const payload = JSON.stringify(payloadObj);
      try { await authService.updateProfile({ filters: payload }); await authService.setFiltersLocally(payload); } catch { await authService.setFiltersLocally(payload); }
    } catch (error) {
      console.error('Error removing filter:', error);
      throw error instanceof Error ? error : new Error('Failed to remove filter');
    }
  }

  async clear(): Promise<void> {
    try {
      const user = authService.user;
      if (!user) return;
      const emptyObj = JSON.stringify({});
      try { await authService.updateProfile({ filters: emptyObj }); await authService.setFiltersLocally(emptyObj); } catch { await authService.setFiltersLocally(emptyObj); }
    } catch (error) {
      console.error('Error clearing filters:', error);
      throw new Error('Failed to clear filters');
    }
  }

  // Método para verificar se um filtro é padrão
  isImmutableFilter(title: string): boolean {
    const immutableTitles = this.resolveImmutableFilters().map(f => f.title);
    return immutableTitles.includes(title);
  }
}

export const filtersService = FiltersService.getInstance(); 