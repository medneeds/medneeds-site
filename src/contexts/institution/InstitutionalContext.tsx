import React, { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/auth/useAuthContext';
import institutionalService, { type InstitutionOption } from '@/services/institution/InstitutionalService';
import { InstitutionalContext, type MyPermissions } from './useInstitutionalContext';

export function InstitutionalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const isInstitutional = user?.accountType === 'institutional';
  const isInstRegister = (user?.register as { type?: string } | undefined)?.type === 'institutional';

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [myPermissions, setMyPermissions] = useState<MyPermissions | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(isInstitutional);

  useEffect(() => {
    if (!isInstitutional) return;
    setPermissionsLoading(true);
    setInstitutionsLoading(true);
    institutionalService.getSelectOptions().then((opts) => {
      setInstitutions(opts);
      if (opts.length > 0) {
        setSelectedInstitutionId((prev) => prev ?? opts[0].value);
      } else {
        setPermissionsLoading(false);
      }
    }).catch(() => { setPermissionsLoading(false); }).finally(() => setInstitutionsLoading(false));
  }, [isInstitutional]);

  const loadPermissions = useCallback(async () => {
    if (!isInstitutional || !selectedInstitutionId || !user?.id) return;
    setPermissionsLoading(true);
    try {
      const members = await institutionalService.getParameters(selectedInstitutionId);
      const myEntry = members.find((m) => m.userId === user.id);
      if (myEntry) {
        const normalizePerms = (arr: any[]): string[] =>
          (arr ?? []).map((p) => (typeof p === 'string' ? p : p.permission));
        setMyPermissions({
          role: myEntry.role,
          memberId: myEntry.memberId,
          operationalPermissions: normalizePerms(myEntry.operationalPermissions),
          dashboardPermissions: normalizePerms(myEntry.dashboardPermissions),
        });
      } else {
        setMyPermissions(null);
      }
    } catch {
      setMyPermissions(null);
    } finally {
      setPermissionsLoading(false);
    }
  }, [isInstitutional, selectedInstitutionId, user?.id]);

  useEffect(() => {
    if (selectedInstitutionId) loadPermissions();
  }, [selectedInstitutionId, loadPermissions]);

  const hasOperationalPermission = useCallback((key: string): boolean => {
    if (isInstRegister) return true;
    if (!myPermissions) return false;
    if (myPermissions.role === 'institutional') return true;
    return myPermissions.operationalPermissions.some(
      (p) => (typeof p === 'string' ? p : (p as any).permission) === key
    );
  }, [isInstRegister, myPermissions]);

  const hasDashboardPermission = useCallback((key: string): boolean => {
    if (isInstRegister) return true;
    if (!myPermissions) return false;
    if (myPermissions.role === 'institutional') return true;
    return myPermissions.dashboardPermissions.some(
      (p) => (typeof p === 'string' ? p : (p as any).permission) === key
    );
  }, [isInstRegister, myPermissions]);

  return (
    <InstitutionalContext.Provider value={{
      institutions,
      institutionsLoading,
      selectedInstitutionId,
      setSelectedInstitutionId,
      myPermissions,
      permissionsLoading,
      hasOperationalPermission,
      hasDashboardPermission,
      reload: loadPermissions,
    }}>
      {children}
    </InstitutionalContext.Provider>
  );
}
