import { createContext, useContext } from 'react';
import type { InstitutionOption } from '@/services/institution/InstitutionalService';

export interface MyPermissions {
  role: string;
  memberId: string;
  operationalPermissions: string[];
  dashboardPermissions: string[];
}

export interface InstitutionalContextValue {
  institutions: InstitutionOption[];
  institutionsLoading: boolean;
  selectedInstitutionId: string | null;
  setSelectedInstitutionId: (id: string) => void;
  myPermissions: MyPermissions | null;
  permissionsLoading: boolean;
  hasOperationalPermission: (key: string) => boolean;
  hasDashboardPermission: (key: string) => boolean;
  reload: () => void;
}

export const InstitutionalContext = createContext<InstitutionalContextValue>({
  institutions: [],
  institutionsLoading: false,
  selectedInstitutionId: null,
  setSelectedInstitutionId: () => {},
  myPermissions: null,
  permissionsLoading: false,
  hasOperationalPermission: () => false,
  hasDashboardPermission: () => false,
  reload: () => {},
});

export function useInstitutionalContext() {
  return useContext(InstitutionalContext);
}
