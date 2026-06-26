import { useState, useEffect, useCallback } from 'react';
import institutionalService, {
  DashboardKpiParams,
  DashboardKpiResult,
} from '@/services/institution/InstitutionalService';

export function useInstitutionalKpis(params: DashboardKpiParams) {
  const [data, setData] = useState<DashboardKpiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await institutionalService.getInstitutionalKpis(params);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao carregar KPIs');
    } finally {
      setLoading(false);
    }
  }, [
    params.type,
    params.institution,
    params.team,
    params.profile,
    params.from,
    params.to,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
