import { useState, useEffect, useCallback } from 'react';
import institutionalService, { InstitutionOption } from '@/services/institution/InstitutionalService';

export function useInstitutionalSelectOptions() {
  const [options, setOptions] = useState<InstitutionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await institutionalService.getSelectOptions();
      setOptions(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao carregar instituições');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { options, loading, error, reload: load };
}
