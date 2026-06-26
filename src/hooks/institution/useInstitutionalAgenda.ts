import { useState, useEffect, useCallback } from 'react';
import institutionalService, { InstitutionalJob } from '@/services/institution/InstitutionalService';

interface UseInstitutionalAgendaOptions {
  from?: string;
  to?: string;
  team?: string;
  institution?: string | null;
  view?: 'mine' | 'institution';
  page?: number;
  limit?: number;
}

export function useInstitutionalAgenda(opts?: UseInstitutionalAgendaOptions) {
  const [jobs, setJobs] = useState<InstitutionalJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await institutionalService.getAgenda(opts);
      setJobs(result.docs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  }, [opts?.from, opts?.to, opts?.team, opts?.institution, opts?.view, opts?.page, opts?.limit]);

  useEffect(() => { load(); }, [load]);

  return { jobs, total, totalPages, loading, error, reload: load };
}
