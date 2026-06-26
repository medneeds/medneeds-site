import { useState, useEffect, useCallback } from 'react';
import institutionalService, {
  InstitutionMemberParameter,
  SaveParametersPayload,
} from '@/services/institution/InstitutionalService';

export function useInstitutionalMembers(institutionId?: string) {
  const [members, setMembers] = useState<InstitutionMemberParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await institutionalService.getParameters(institutionId);
      setMembers(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  const savePermissions = useCallback(async (payload: SaveParametersPayload) => {
    setSaving(true);
    try {
      await institutionalService.saveParameters(payload);
      await load();
    } finally {
      setSaving(false);
    }
  }, [load]);

  const syncMembers = useCallback(async () => {
    setSaving(true);
    try {
      await institutionalService.syncMembers(institutionId);
      await load();
    } finally {
      setSaving(false);
    }
  }, [institutionId, load]);

  const toggleMemberStatus = useCallback(async (memberId: string, currentStatus: string) => {
    const next = currentStatus === 'active' ? 'suspended' : 'active';
    setSaving(true);
    try {
      await institutionalService.updateMemberStatus(memberId, next);
      await load();
    } finally {
      setSaving(false);
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return { members, loading, saving, error, reload: load, savePermissions, syncMembers, toggleMemberStatus };
}
