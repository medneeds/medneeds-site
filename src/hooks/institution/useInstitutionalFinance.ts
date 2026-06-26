import { useState, useEffect, useCallback } from 'react';
import institutionalService, { FinanceSummary } from '@/services/institution/InstitutionalService';

interface UseInstitutionalFinanceOptions {
  from?: string;
  to?: string;
  team?: string;
  institution?: string | null;
}

export function useInstitutionalFinance(opts?: UseInstitutionalFinanceOptions) {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await institutionalService.getFinanceSummary(opts);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao carregar financeiro');
    } finally {
      setLoading(false);
    }
  }, [opts?.from, opts?.to, opts?.team, opts?.institution]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
