import { useState, useEffect, useCallback } from 'react';
import institutionalService, { InstitutionalJob } from '@/services/institution/InstitutionalService';

interface UseInstitutionalOffersOptions {
  from?: string;
  to?: string;
  team?: string;
  institution?: string | null;
  page?: number;
  limit?: number;
  myJobs?: boolean;
}

export function useInstitutionalOffers(opts?: UseInstitutionalOffersOptions) {
  const [jobs, setJobs] = useState<InstitutionalJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await institutionalService.getOffers(opts);
      setJobs(result.docs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao carregar ofertas');
    } finally {
      setLoading(false);
    }
  }, [opts?.from, opts?.to, opts?.team, opts?.institution, opts?.page, opts?.limit, opts?.myJobs]);

  useEffect(() => { load(); }, [load]);

  return { jobs, total, totalPages, loading, error, reload: load };
}
