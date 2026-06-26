import { useState, useEffect, useCallback } from 'react';
import institutionalService, { OwnerKpiResult } from '@/services/institution/InstitutionalService';

export function useOwnerKpis(params?: { from?: string; to?: string }) {
  const [data, setData] = useState<OwnerKpiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await institutionalService.getOwnerKpis(params);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [params?.from, params?.to]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
