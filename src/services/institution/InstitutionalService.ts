import api from '@/lib/api';

// ─── Select Options ──────────────────────────────────────────────────────────

export interface InstitutionOption {
  label: string;
  value: string;
}

// ─── Parameters / Members ────────────────────────────────────────────────────

export interface InstitutionMemberParameter {
  memberId: string;
  userId: string;
  institutionId: string;
  profileName: string;
  role: string;
  status: string;
  permissionId: string | null;
  operationalPermissions: string[];
  dashboardPermissions: string[];
}

export interface SaveParametersPayload {
  memberId: string;
  role: string;
  operationalPermissions?: string[];
  dashboardPermissions?: string[];
}

export interface MemberProfileRegister {
  type: string;
  number: number | null;
  uf: string;
  verified: boolean;
}

export interface MemberProfile {
  memberId: string;
  userId: string;
  institutionId: string;
  profileName: string;
  role: string;
  status: string;
  invitedAt: string | null;
  email: string;
  cpf: string;
  phoneNumber: string;
  whatsappNumber: string;
  about: string;
  displayNamePrefix: string;
  register: MemberProfileRegister | null;
  clinicalAreas: string[];
  graduationYear: number | null;
  allRequiredInfoFilled: boolean;
}

export interface UpdateMemberProfilePayload {
  memberId: string;
  profileName?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  about?: string;
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export type DashboardKpiType = 'overview' | 'financial' | 'operational' | 'people' | 'shifts'

export interface DashboardKpiParams {
  type: DashboardKpiType
  institution?: string | null
  team?: string | null
  profile?: string | null
  from?: string
  to?: string
}

export interface DashboardKpiOverview {
  type: 'overview'
  period: { from: string | null; to: string | null }
  kpis: {
    period: {
      totalShifts: number
      filledShifts: number
      openShifts: number
      cancelledShifts: number
      fillRate: number
      cancellationRate: number
      activeDoctors: number
      pendingApplications: number
    }
    today: {
      totalShifts: number
      criticalShifts: number
    }
  }
}

export interface DashboardKpiFinancial {
  type: 'financial'
  period: { from: string | null; to: string | null }
  kpis: {
    totalValueCents: number
    paidValueCents: number
    receivedValueCents: number
    pendingPaymentCents: number
    pendingReceiptCents: number
    jobsCount: number
    ticketMedioCents: number
    receiptRate: number
    byTeam: { teamId: string; count: number; grossValue: number; paidValue: number; receivedValue: number }[]
    byInstitution: { institutionId: string; count: number; grossValue: number; paidValue: number; receivedValue: number }[]
  }
}

export interface DashboardKpiOperational {
  type: 'operational'
  period: { from: string | null; to: string | null }
  kpis: {
    totalShifts: number
    filledShifts: number
    openShifts: number
    cancelledShifts: number
    criticalShifts: number
    fillRate: number
    cancellationRate: number
    activeDoctors: number
    pendingApplications: number
    approvedApplications: number
    rejectedApplications: number
  }
}

export interface DashboardKpiPeople {
  type: 'people'
  period: { from: string | null; to: string | null }
  kpis: {
    activeDoctors: number
    totalMembers: number
    activeTeams: number
    totalTeams: number
    membersByRole: Record<string, number>
  }
}

export interface DashboardKpiShifts {
  type: 'shifts'
  period: { from: string | null; to: string | null }
  kpis: {
    totalShifts: number
    filledShifts: number
    openShifts: number
    cancelledShifts: number
    criticalShifts: number
    todayShifts: number
    fillRate: number
    cancellationRate: number
  }
}

export type DashboardKpiResult =
  | DashboardKpiOverview
  | DashboardKpiFinancial
  | DashboardKpiOperational
  | DashboardKpiPeople
  | DashboardKpiShifts

// ─── Owner KPIs ──────────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'attention' | 'risk' | 'critical'

export interface InstitutionOwnerStats {
  institutionId: string
  institutionName: string
  totalShifts: number
  filledShifts: number
  openShifts: number
  cancelledShifts: number
  criticalShifts: number
  openNext24h: number
  openNext48h: number
  fillRate: number
  cancellationRate: number
  pendingApplications: number
  totalValueCents: number
  paidValueCents: number
  receivedValueCents: number
  pendingPaymentCents: number
  pendingReceiptCents: number
  jobsWithValueCount: number
  totalTeams: number
  activeTeams: number
  healthScore: number
  healthStatus: HealthStatus
}

export interface OwnerConsolidated {
  totalShifts: number
  filledShifts: number
  openShifts: number
  cancelledShifts: number
  criticalShifts: number
  openNext24h: number
  openNext48h: number
  pendingApplications: number
  totalValueCents: number
  paidValueCents: number
  receivedValueCents: number
  pendingPaymentCents: number
  pendingReceiptCents: number
  totalTeams: number
  activeTeams: number
  fillRate: number
  cancellationRate: number
  institutionCount: number
}

export interface OwnerAlert {
  severity: 'critical' | 'warning' | 'info'
  type: string
  institutionId: string
  institutionName: string
  message: string
  value: number
}

export interface OwnerKpiResult {
  period: { from: string | null; to: string | null }
  consolidated: OwnerConsolidated
  institutions: InstitutionOwnerStats[]
  alerts: OwnerAlert[]
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export interface FinanceTotals {
  jobsCount: number;
  grossValue: number;
  paidValue: number;
  receivedValue: number;
  pendingPaymentValue: number;
  pendingReceiptValue: number;
  paidJobsCount: number;
  receivedJobsCount: number;
}

export interface FinanceByEntity {
  institutionId?: string;
  teamId?: string;
  paymentMethod?: string;
  count: number;
  grossValue: number;
  paidValue: number;
  receivedValue: number;
}

export interface FinanceSummary {
  success: boolean;
  context: string;
  role: string;
  roleMode: string;
  institutionIds: string[];
  range: { from: string | null; to: string | null };
  teamId: string | null;
  totals: FinanceTotals;
  byInstitution: FinanceByEntity[];
  byTeam: FinanceByEntity[];
  byPaymentMethod: FinanceByEntity[];
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface InstitutionalJob {
  id: string;
  institutionId: string;
  institutionName?: string | null;
  teamId: string;
  teamName?: string | null;
  fromProfileId: string;
  toProfileId: string | null;
  modality: string;
  clinicalArea: string;
  startDateTime: string;
  endDateTime: string;
  durationInHours: number;
  visibility?: string;
  state: string;
  city: string;
  place: string;
  placeDisplayName: string;
  priceInCents?: number;
  paymentMethod?: string;
  executionControl?: string;
  parentRef?: string | null;
  paidAt?: string | null;
  receivedAt?: string | null;
}

export interface InstitutionalJobsResponse {
  success: boolean;
  context: string;
  role: string;
  roleMode: string;
  institutionIds: string[];
  total: number;
  page: number;
  totalPages: number;
  docs: InstitutionalJob[];
}

// ─── Applications (Solicitações) ─────────────────────────────────────────────

export interface InstitutionalApplication {
  id: string;
  jobId: string;
  jobStartDateTime: string | null;
  jobEndDateTime: string | null;
  jobDurationInHours: number | null;
  jobTeamId: string | null;
  jobInstitutionId: string | null;
  jobPlaceDisplayName: string | null;
  jobPriceInCents: number | null;
  applicantId: string;
  applicantName: string | null;
  publisherId: string;
  publisherName: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  homologationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  homologationNotes: string | null;
  swapSource: 'INTERNAL' | 'EXTERNAL' | null;
  swapJustification: string | null;
  substituteProfileId: string | null;
  homologatedAt: string | null;
  homologatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionalApplicationsResponse {
  success: boolean;
  institutionIds: string[];
  total: number;
  page: number;
  totalPages: number;
  docs: InstitutionalApplication[];
}

export interface ApplicationsParams extends PaginatedParams {
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  homologationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface TeamItem {
  id: string;
  name: string;
  area?: string | null;
  teamType?: 'assistential' | 'administrative' | 'operational' | 'other' | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  acceptsNewMembers?: boolean | null;
  active?: boolean | null;
  institution: string | { id: string; [key: string]: unknown };
  professionals?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamPayload {
  name: string;
  area?: string;
  teamType?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  acceptsNewMembers?: boolean;
  active?: boolean;
  professionals?: string[];
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export type InviteRole = 'institutional' | 'administrative' | 'scheduler' | 'responsible' | 'CRM';


export interface CreateInvitePayload {
  email: string;
  cpf: string;
  role: InviteRole;
  name?: string;
}

export interface InviteTokenPayload {
  institution?: string;
  cpf: string;
  token: string;
}

export interface CreatedInvite {
  success: boolean;
  inviteId: string;
  expiresAt: string;
}

export interface InviteListItem {
  id: string;
  email: string;
  cpf: string;
  role: string;
  status: 'pending' | 'used' | 'canceled';
  expiresAt: string;
  createdAt: string;
}

export interface ValidatedInvite {
  success: boolean;
  inviteId: string;
  institution: string;
  role: string;
  email: string;
  expiresAt: string;
}

export interface CompletedInvite {
  success: boolean;
  memberId: string;
  institution: string;
  role: string;
  profileId: string;
  userId: string;
  profileName: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type BackendNotificationEvent =
  | 'received:job-application'
  | 'approved:job-application'
  | 'pending:swap-homologation'
  | 'approved:swap-homologation'
  | 'rejected:swap-homologation'
  | 'alert:scheduler-action-required'
  | 'reminder:scheduler-action-required'
  | 'job:assigned'
  | 'job:unassigned'
  | 'job:cancelled'
  | 'job:modified'
  | 'job:created-in-team'
  | 'checkin:done'
  | 'checkout:done'
  | 'checkin:overdue'
  | 'absent:detected'
  | 'absent:critical'
  | 'absent:reverted'
  | 'scale:published'
  | 'scale:provisional'
  | 'offer:hole-published'
  | 'offer:rejected'

export interface BackendNotification {
  id: string
  event: BackendNotificationEvent
  title: string
  body: string
  read: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  roleTarget?: 'CRM' | 'scheduler' | 'responsible' | 'institutional'
  data?: Record<string, unknown>
  createdAt: string
  institution?: string | { id: string }
}

export interface NotificationsResponse {
  docs: BackendNotification[]
  totalDocs: number
  hasNextPage: boolean
}

// ─── Institution Profile ──────────────────────────────────────────────────────

export interface InstitutionProfile {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  institutionType: string;
  cnes: string;
  email: string;
  phone: string;
  zipCode: string;
  state: string;
  city: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  notes: string;
  active: boolean;
}

export interface UpdateInstitutionProfilePayload {
  institutionId?: string;
  tradeName?: string;
  institutionType?: string;
  cnes?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  state?: string;
  city?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  notes?: string;
}

// ─── Query params helpers ─────────────────────────────────────────────────────

interface DateRangeParams {
  from?: string;
  to?: string;
  team?: string;
  institution?: string | null;
  view?: 'mine' | 'institution';
}

interface PaginatedParams extends DateRangeParams {
  page?: number;
  limit?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

// ─── Service ─────────────────────────────────────────────────────────────────

class InstitutionalService {

  // Institution profile — dados cadastrais da instituição
  async getInstitutionProfile(institutionId?: string): Promise<InstitutionProfile> {
    const q = institutionId ? `?institution=${institutionId}` : '';
    const res = await api.get<{ success: boolean; institution: InstitutionProfile }>(
      `/institution/profile${q}`
    );
    return res.data.institution;
  }

  async updateInstitutionProfile(payload: UpdateInstitutionProfilePayload): Promise<InstitutionProfile> {
    const res = await api.patch<{ success: boolean; institution: InstitutionProfile }>(
      '/institution/profile',
      payload
    );
    return res.data.institution;
  }

  // Institutions select options (para o usuário logado)
  async getSelectOptions(): Promise<InstitutionOption[]> {
    const res = await api.get<{ success: boolean; docs: InstitutionOption[] }>(
      '/institution/select-options'
    );
    return res.data.docs ?? [];
  }

  // Parameters — lista membros com permissões
  async getParameters(institutionId?: string): Promise<InstitutionMemberParameter[]> {
    const q = institutionId ? `?institution=${institutionId}` : '';
    const res = await api.get<{ success: boolean; items: InstitutionMemberParameter[] }>(
      `/institution-parameters/list${q}`
    );
    return res.data.items ?? [];
  }

  // Parameters — salvar permissões de um membro
  async saveParameters(payload: SaveParametersPayload) {
    const res = await api.post('/institution-parameters/save', payload);
    return res.data;
  }

  // Parameters — sincronizar membros sem permissão
  async syncMembers(institutionId?: string) {
    const res = await api.post('/institution-parameters/sync-members', {
      institutionId,
    });
    return res.data;
  }

  // Parameters — desativar ou reativar membro
  async updateMemberStatus(memberId: string, status: 'active' | 'suspended' | 'inactive') {
    const res = await api.post('/institution-parameters/update-status', { memberId, status });
    return res.data;
  }

  // Colaboradores — lista com perfil completo
  async getMembersProfiles(institutionId?: string): Promise<MemberProfile[]> {
    const q = institutionId ? `?institution=${institutionId}` : '';
    const res = await api.get<{ success: boolean; items: MemberProfile[] }>(
      `/institution-parameters/members-profiles${q}`
    );
    return res.data.items ?? [];
  }

  // Colaboradores — atualizar campos editáveis do perfil
  async updateMemberProfile(payload: UpdateMemberProfilePayload) {
    const res = await api.post('/institution-parameters/update-member-profile', payload);
    return res.data;
  }

  // Colaboradores — criar perfil + vínculo direto (sem convite)
  async createDirectMember(params: {
    institutionId: string;
    name: string;
    email: string;
    cpf: string;
    password: string;
    role: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    registerType?: string;
    registerNumber?: string;
    registerUf?: string;
  }): Promise<void> {
    // 1. Cria o perfil
    const profilePayload: Record<string, unknown> = {
      name: params.name,
      email: params.email.trim().toLowerCase(),
      password: params.password,
      cpf: params.cpf.trim(),
      accountType: 'institutional',
      _verified: true,
    };
    if (params.phoneNumber?.trim()) profilePayload.phoneNumber = params.phoneNumber.trim();
    if (params.whatsappNumber?.trim()) profilePayload.whatsappNumber = params.whatsappNumber.trim();
    if (params.registerType && params.registerNumber?.trim()) {
      profilePayload.register = {
        type: params.registerType,
        number: parseInt(params.registerNumber, 10) || params.registerNumber.trim(),
        uf: params.registerUf ?? '',
      };
    }

    const profileResp = await api.post<{ doc?: { id: string }; id?: string }>('/profiles', profilePayload);
    const profileId: string = profileResp.data?.doc?.id ?? profileResp.data?.id ?? '';
    if (!profileId) throw new Error('Falha ao obter ID do perfil criado.');

    // 2. Vincula à instituição
    await api.post('/institution_members', {
      user: profileId,
      institution: params.institutionId,
      role: params.role,
      status: 'active',
      profileName: params.name.trim(),
    });
  }

  // Owner KPIs (visão consolidada do proprietário)
  async getOwnerKpis(params?: { from?: string; to?: string }): Promise<OwnerKpiResult> {
    const q = buildQuery(params as Record<string, string | undefined>)
    const res = await api.get<OwnerKpiResult>(`/dashboard/owner-kpis${q}`)
    return res.data
  }

  // Dashboard KPIs institucionais
  async getInstitutionalKpis(params: DashboardKpiParams): Promise<DashboardKpiResult> {
    const { type, institution, team, profile, from, to } = params
    const q = buildQuery({
      type,
      institution: institution ?? undefined,
      team: team ?? undefined,
      profile: profile ?? undefined,
      from,
      to,
    })
    const res = await api.get<DashboardKpiResult>(`/dashboard/institutional-kpis${q}`)
    return res.data
  }

  // Finance summary
  async getFinanceSummary(params?: DateRangeParams): Promise<FinanceSummary> {
    const q = buildQuery(params as Record<string, string | undefined>);
    const res = await api.get<FinanceSummary>(`/institution/finance/summary${q}`);
    return res.data;
  }

  // Jobs — ofertas disponíveis
  async getOffers(params?: PaginatedParams & { myJobs?: boolean }): Promise<InstitutionalJobsResponse> {
    const q = buildQuery({ ...params, myJobs: params?.myJobs ? 'true' : undefined } as Record<string, string | number | undefined>);
    const res = await api.get<InstitutionalJobsResponse>(`/institution/jobs/offers${q}`);
    return res.data;
  }

  // Jobs — agenda (plantões confirmados)
  async getAgenda(params?: PaginatedParams & { view?: 'mine' | 'institution' }): Promise<InstitutionalJobsResponse> {
    const q = buildQuery(params as Record<string, string | number | undefined>);
    const res = await api.get<InstitutionalJobsResponse>(`/institution/jobs/agenda${q}`);
    return res.data;
  }

  // Jobs (gestão institucional)
  async createJob(institutionId: string, payload: Record<string, unknown>) {
    const res = await api.post<any>('/jobs', {
      ...payload,
      institution: institutionId,
      visibility: 'PRIVATE',
    });
    return res.data?.doc ?? res.data;
  }

  async updateJob(id: string, payload: Record<string, unknown>) {
    const res = await api.patch<any>(`/jobs/${id}`, payload);
    return res.data?.doc ?? res.data;
  }

  async deleteJob(id: string) {
    await api.delete(`/jobs/${id}`);
  }

  // Teams
  async listTeams(institutionId: string): Promise<TeamItem[]> {
    const res = await api.get<{ docs: TeamItem[] }>(
      `/teams?where[institution][equals]=${institutionId}&depth=0&limit=100&sort=-createdAt`
    );
    return res.data.docs ?? [];
  }

  async createTeam(institutionId: string, payload: CreateTeamPayload): Promise<TeamItem> {
    const res = await api.post<any>('/teams', { ...payload, institution: institutionId });
    return res.data?.doc ?? res.data;
  }

  async updateTeam(id: string, payload: CreateTeamPayload): Promise<TeamItem> {
    const res = await api.patch<any>(`/teams/${id}`, payload);
    return res.data?.doc ?? res.data;
  }

  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  }

  // Invites — criar convite
  async listInvites(institutionId: string): Promise<InviteListItem[]> {
    const res = await api.get<{ success: boolean; docs: InviteListItem[] }>(
      `/institution/invites?institution=${institutionId}`
    );
    return res.data.docs ?? [];
  }

  async createInvite(institutionId: string, payload: CreateInvitePayload): Promise<CreatedInvite> {
    const res = await api.post<CreatedInvite>(
      `/institution/invites?institutions=${institutionId}&context=institutional`,
      payload
    );
    return res.data;
  }

  // Invites — validar token
  async validateInvite(payload: InviteTokenPayload): Promise<ValidatedInvite> {
    const res = await api.post<ValidatedInvite>('/institution/invites/validate', payload);
    return res.data;
  }

  // Invites — completar adesão
  async completeInvite(payload: InviteTokenPayload): Promise<CompletedInvite> {
    const res = await api.post<CompletedInvite>('/institution/invites/complete', payload);
    return res.data;
  }

  // Invites — cancelar
  async cancelInvite(id: string) {
    const res = await api.post(`/institution/invites/cancel?id=${id}`);
    return res.data;
  }

  // Invites — reenviar email
  async resendInvite(id: string) {
    const res = await api.post(`/institution/invites/resend?id=${id}`);
    return res.data;
  }

  // Notifications — buscar notificações do usuário logado
  async getNotifications(params?: { limit?: number; unreadOnly?: boolean }): Promise<NotificationsResponse> {
    const where = params?.unreadOnly ? '&where[read][equals]=false' : ''
    const limit = params?.limit ?? 30
    const res = await api.get<NotificationsResponse>(
      `/notifications?sort=-createdAt&limit=${limit}&depth=0${where}`
    )
    return res.data
  }

  // Notifications — marcar como lida (ack)
  async markNotificationRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/ack`)
  }

  // Notifications — marcar todas como lidas
  async markAllNotificationsRead(ids: string[]): Promise<void> {
    await Promise.allSettled(ids.map((id) => this.markNotificationRead(id)))
  }

  // Check-in — endpoint global com jobId no body
  async checkIn(jobId: string): Promise<void> {
    await api.post(`/institution/jobs/check-in`, { jobId })
  }

  // Check-out
  async checkOut(jobId: string): Promise<void> {
    await api.post(`/institution/jobs/check-out`, { jobId })
  }

  // Marcar falta — responsável / escalista / institutional
  async markAbsent(jobId: string): Promise<void> {
    await api.post(`/institution/jobs/absent`, { jobId })
  }

  // Reverter falta — responsável / escalista / institutional
  async revertAbsent(jobId: string): Promise<void> {
    await api.post(`/institution/jobs/revert-absent`, { jobId })
  }

  // Excluir oferta — apenas o criador, sem médico atribuído
  async deleteOffer(jobId: string): Promise<void> {
    await api.post(`/institution/jobs/delete`, { jobId })
  }

  // ── Solicitações (Applications) ──────────────────────────────────────────

  async getApplications(params?: ApplicationsParams): Promise<InstitutionalApplicationsResponse> {
    const q = buildQuery(params as Record<string, string | number | undefined>);
    const res = await api.get<InstitutionalApplicationsResponse>(`/institution/applications${q}`);
    return res.data;
  }

  async acceptApplication(applicationId: string): Promise<void> {
    await api.post(`/institution/applications/accept`, { applicationId });
  }

  async rejectApplication(applicationId: string, notes?: string): Promise<void> {
    await api.post(`/institution/applications/reject`, { applicationId, notes });
  }

  async homologateApplication(applicationId: string, action: 'APPROVED' | 'REJECTED', notes?: string): Promise<void> {
    await api.post(`/institution/applications/homologate`, { applicationId, action, notes });
  }

  // ── Pagamentos ────────────────────────────────────────────────────────────

  async markJobPaid(jobId: string, paidAt?: string): Promise<void> {
    await api.post(`/institution/jobs/mark-paid`, { jobId, paidAt });
  }

  async unmarkJobPaid(jobId: string): Promise<void> {
    await api.post(`/institution/jobs/unmark-paid`, { jobId });
  }

  async markJobReceived(jobId: string, receivedAt?: string): Promise<void> {
    await api.post(`/institution/jobs/mark-received`, { jobId, receivedAt });
  }

  async unmarkJobReceived(jobId: string): Promise<void> {
    await api.post(`/institution/jobs/unmark-received`, { jobId });
  }
}

export const institutionalService = new InstitutionalService();
export default institutionalService;
