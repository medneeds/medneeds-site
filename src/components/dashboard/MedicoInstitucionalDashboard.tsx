import { useState, useEffect, useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Tag,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Chip } from '@/components/ui/Chip'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { formatCurrency } from '@/utils/numberFormatter'
import institutionalService, {
  type InstitutionOption,
  type TeamItem,
  type FinanceSummary,
  type InstitutionalJob,
} from '@/services/institution/InstitutionalService'
import { useNavigate } from 'react-router-dom'

const ALL_TEAMS = '__all__'

/** Resolve campos que o Payload pode retornar como string (ID) ou objeto populado */
function resolveName(field: unknown): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object' && 'name' in (field as object))
    return (field as { name: string }).name ?? ''
  return ''
}

/** Retorna vazio se o valor parecer um ObjectID do MongoDB (não exibir IDs crus) */
function safeText(val: string | undefined | null): string {
  if (!val) return ''
  return /^[0-9a-f]{24}$/i.test(val) ? '' : val
}

// ─── Card de plantão institucional ────────────────────────────────────────────

interface InstJobCardProps {
  job: InstitutionalJob
  institutionLabel: string
  teams: TeamItem[]
}

function InstJobCard({ job, institutionLabel, teams }: InstJobCardProps) {
  const navigate = useNavigate()
  const start = new Date(job.startDateTime)
  const teamName = job.teamName || teams.find((t) => t.id === job.teamId)?.name || ''

  const modality = resolveName(job.modality)
  const clinicalArea = resolveName(job.clinicalArea)
  const instName = job.institutionName || institutionLabel
  const displayName = safeText(job.placeDisplayName)
  const city = safeText(job.city)
  const state = safeText(job.state)
  const location = [displayName, city, state].filter(Boolean).join(', ')
  const value = (job.priceInCents ?? 0) / 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-md p-4 border border-border shadow-card cursor-pointer hover:shadow-elevated hover:border-accent/30 transition-all"
      onClick={() => navigate('/agenda')}
    >
      <div className="flex items-start gap-3">
        {/* Bloco de data */}
        <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            {format(start, 'MMM', { locale: ptBR })}
          </span>
          <span className="text-lg font-bold text-foreground leading-none">
            {format(start, 'dd')}
          </span>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Hora + instituição */}
          <div className="flex items-center gap-2 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              {format(start, 'HH:mm')}
            </span>
            {instName && (
              <span className="text-xs text-muted-foreground truncate">· {instName}</span>
            )}
          </div>

          {/* Time */}
          {teamName && (
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{teamName}</span>
            </div>
          )}

          {/* Localização (só exibe se tiver nome legível) */}
          {location && (
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{location}</span>
            </div>
          )}

          {/* Chips: modalidade + área clínica */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {modality && <Chip variant="purple" size="sm">{modality}</Chip>}
            {clinicalArea && <Chip variant="green" size="sm">{clinicalArea}</Chip>}
            <Chip variant="blue" size="sm">{job.durationInHours ?? 0}h</Chip>
          </div>
        </div>

        {/* Valor */}
        <div className="text-right shrink-0">
          <p className="font-bold text-sm text-foreground">
            {formatCurrency(value)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Card de oferta institucional ─────────────────────────────────────────────

function DashboardOfferCard({ job }: { job: InstitutionalJob }) {
  const navigate = useNavigate()
  const start = new Date(job.startDateTime)
  const isOpen = !job.toProfileId
  const teamName = job.teamName ?? ''
  const placeDisplay = safeText(job.placeDisplayName)
  const clinicalArea = resolveName(job.clinicalArea)
  const value = (job.priceInCents ?? 0) / 100

  return (
    <div
      className="bg-card rounded-xl px-4 py-3 border border-border hover:border-accent/30 transition-colors cursor-pointer"
      onClick={() => navigate('/ofertas')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Badges: status + time */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOpen ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
              {isOpen ? 'Aberta' : 'Atribuída'}
            </span>
            {teamName && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                <Users className="w-2.5 h-2.5" />
                {teamName}
              </span>
            )}
          </div>

          {/* Data */}
          <p className="font-medium text-sm text-foreground capitalize">
            {format(start, "EEE, d 'de' MMM", { locale: ptBR })}
          </p>

          {/* Hora · duração · local · área clínica */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(start, 'HH:mm')} · {job.durationInHours}h
            </span>
            {placeDisplay && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {placeDisplay}
              </span>
            )}
            {clinicalArea && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {clinicalArea}
              </span>
            )}
          </div>
        </div>

        {/* Preço */}
        {value > 0 && (
          <p className="text-sm font-bold text-green-500 shrink-0">{formatCurrency(value)}</p>
        )}
      </div>
    </div>
  )
}

// ─── Hook de dados ─────────────────────────────────────────────────────────────

function useMedicoInstitucionalData() {
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([])
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const [selectedTeam, setSelectedTeam] = useState<string>(ALL_TEAMS)
  const [loadingInstitutions, setLoadingInstitutions] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)

  const [todayJobs, setTodayJobs] = useState<InstitutionalJob[]>([])
  const [upcomingJobs, setUpcomingJobs] = useState<InstitutionalJob[]>([])
  const [offers, setOffers] = useState<InstitutionalJob[]>([])
  const [finance, setFinance] = useState<FinanceSummary | null>(null)

  const [todayLoading, setTodayLoading] = useState(false)
  const [upcomingLoading, setUpcomingLoading] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [loadingFinance, setLoadingFinance] = useState(false)
  const [financePeriod, setFinancePeriod] = useState<'month' | 'all'>('month')

  const teamParam = selectedTeam === ALL_TEAMS ? undefined : selectedTeam
  const institutionLabel = institutions.find((i) => i.value === selectedInstitution)?.label ?? ''

  // Carrega instituições uma única vez
  useEffect(() => {
    setLoadingInstitutions(true)
    institutionalService
      .getSelectOptions()
      .then((opts) => {
        setInstitutions(opts)
        if (opts.length > 0) setSelectedInstitution(opts[0].value)
      })
      .finally(() => setLoadingInstitutions(false))
  }, [])

  // Carrega times ao trocar instituição
  useEffect(() => {
    if (!selectedInstitution) { setTeams([]); setSelectedTeam(ALL_TEAMS); return }
    setLoadingTeams(true)
    setSelectedTeam(ALL_TEAMS)
    institutionalService.listTeams(selectedInstitution).then(setTeams).finally(() => setLoadingTeams(false))
  }, [selectedInstitution])

  const fetchToday = useCallback(() => {
    if (!selectedInstitution) return
    const today = dayjs()
    setTodayLoading(true)
    institutionalService
      .getAgenda({
        institution: selectedInstitution,
        team: teamParam,
        view: 'mine',
        from: today.startOf('day').toISOString(),
        to: today.endOf('day').toISOString(),
        limit: 10,
      })
      .then((res) => setTodayJobs(res.docs))
      .catch(() => setTodayJobs([]))
      .finally(() => setTodayLoading(false))
  }, [selectedInstitution, teamParam])

  const fetchUpcoming = useCallback(() => {
    if (!selectedInstitution) return
    const today = dayjs()
    setUpcomingLoading(true)
    institutionalService
      .getAgenda({
        institution: selectedInstitution,
        team: teamParam,
        view: 'mine',
        from: today.add(1, 'day').startOf('day').toISOString(),
        to: today.add(15, 'day').endOf('day').toISOString(),
        limit: 10,
      })
      .then((res) => setUpcomingJobs(res.docs))
      .catch(() => setUpcomingJobs([]))
      .finally(() => setUpcomingLoading(false))
  }, [selectedInstitution, teamParam])

  const fetchOffers = useCallback(() => {
    if (!selectedInstitution) return
    setLoadingOffers(true)
    institutionalService
      .getOffers({ institution: selectedInstitution, team: teamParam, limit: 20 })
      .then((res) => setOffers(res.docs.filter((j) => j.institutionId && j.teamId)))
      .catch(() => setOffers([]))
      .finally(() => setLoadingOffers(false))
  }, [selectedInstitution, teamParam])

  const financeRange = useMemo(() => {
    const now = dayjs()
    if (financePeriod === 'month') {
      return {
        from: now.startOf('month').format('YYYY-MM-DD'),
        to: now.endOf('month').format('YYYY-MM-DD'),
      }
    }
    // Total geral: tudo desde 2020 até 2 anos à frente
    return {
      from: '2020-01-01',
      to: now.add(2, 'year').format('YYYY-MM-DD'),
    }
  }, [financePeriod])

  const fetchFinance = useCallback(() => {
    if (!selectedInstitution) return
    setLoadingFinance(true)
    institutionalService
      .getAgenda({
        view: 'mine',
        institution: selectedInstitution,
        team: teamParam,
        from: financeRange.from,
        to: financeRange.to,
        limit: 500,
      })
      .then((res) => {
        const jobs = res.docs.filter((j) => (j.priceInCents ?? 0) > 0)
        const grossValue = jobs.reduce((s, j) => s + (j.priceInCents ?? 0) / 100, 0)
        const paidValue = jobs.filter((j) => j.paidAt).reduce((s, j) => s + (j.priceInCents ?? 0) / 100, 0)
        const receivedValue = jobs.filter((j) => j.receivedAt).reduce((s, j) => s + (j.priceInCents ?? 0) / 100, 0)
        setFinance({
          success: true,
          context: '',
          role: '',
          roleMode: '',
          institutionIds: [selectedInstitution],
          range: { from: financeRange.from, to: financeRange.to },
          teamId: teamParam ?? null,
          totals: {
            jobsCount: jobs.length,
            grossValue,
            paidValue,
            receivedValue,
            pendingPaymentValue: Math.max(grossValue - paidValue, 0),
            pendingReceiptValue: Math.max(paidValue - receivedValue, 0),
            paidJobsCount: jobs.filter((j) => j.paidAt).length,
            receivedJobsCount: jobs.filter((j) => j.receivedAt).length,
          },
          byInstitution: [],
          byTeam: [],
          byPaymentMethod: [],
        })
      })
      .catch(() => setFinance(null))
      .finally(() => setLoadingFinance(false))
  }, [selectedInstitution, teamParam, financeRange])

  useEffect(() => { fetchToday() }, [fetchToday])
  useEffect(() => { fetchUpcoming() }, [fetchUpcoming])
  useEffect(() => { fetchOffers() }, [fetchOffers])
  useEffect(() => { fetchFinance() }, [fetchFinance])

  return {
    institutions,
    teams,
    selectedInstitution,
    setSelectedInstitution,
    selectedTeam,
    setSelectedTeam,
    loadingInstitutions,
    loadingTeams,
    institutionLabel,
    todayJobs,
    upcomingJobs,
    offers,
    finance,
    todayLoading,
    upcomingLoading,
    loadingOffers,
    loadingFinance,
    financePeriod,
    setFinancePeriod,
  }
}

// ─── Filtros ───────────────────────────────────────────────────────────────────

function FilterBar({
  institutions,
  teams,
  selectedInstitution,
  selectedTeam,
  loadingInstitutions,
  loadingTeams,
  onInstitutionChange,
  onTeamChange,
}: {
  institutions: InstitutionOption[]
  teams: TeamItem[]
  selectedInstitution: string
  selectedTeam: string
  loadingInstitutions: boolean
  loadingTeams: boolean
  onInstitutionChange: (v: string) => void
  onTeamChange: (v: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row gap-3 mb-6 px-4 sm:px-0"
    >
      <div className="flex-1 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select
          value={selectedInstitution}
          onValueChange={onInstitutionChange}
          disabled={loadingInstitutions || institutions.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingInstitutions ? 'Carregando...' : 'Selecione uma instituição'} />
          </SelectTrigger>
          <SelectContent>
            {institutions.map((i) => (
              <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select
          value={selectedTeam}
          onValueChange={onTeamChange}
          disabled={!selectedInstitution || loadingTeams}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingTeams ? 'Carregando times...' : 'Todos os times'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TEAMS}>Todos os times</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  )
}

// ─── Card financeiro ───────────────────────────────────────────────────────────

function FinanceCard({
  finance,
  loading,
  period,
  onPeriodChange,
}: {
  finance: FinanceSummary | null
  loading: boolean
  period: 'month' | 'all'
  onPeriodChange: (p: 'month' | 'all') => void
}) {
  const navigate = useNavigate()
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-md p-6 shadow-card mx-4 sm:mx-0"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold text-lg text-foreground">Recebimentos e Transferências</h2>
        <div className="flex items-center gap-2">
          {/* Toggle período */}
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            <button
              className={`px-3 py-1 font-medium transition-colors ${period === 'month' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              onClick={() => onPeriodChange('month')}
            >
              Este mês
            </button>
            <button
              className={`px-3 py-1 font-medium transition-colors border-l border-border ${period === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              onClick={() => onPeriodChange('all')}
            >
              Total geral
            </button>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => navigate('/recebimentos')}>
            Ver detalhes <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : finance ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total bruto</p>
            <p className="font-semibold text-foreground text-sm">{formatCurrency(finance.totals.grossValue)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Recebido</p>
            <p className="font-semibold text-emerald-600 text-sm">{formatCurrency(finance.totals.receivedValue)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">A receber</p>
            <p className="font-semibold text-blue-600 text-sm">{formatCurrency(finance.totals.pendingReceiptValue)}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">A pagar</p>
            <p className="font-semibold text-amber-600 text-sm">{formatCurrency(finance.totals.pendingPaymentValue)}</p>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-muted-foreground">
          <p className="text-sm">Sem dados financeiros para esta seleção</p>
        </div>
      )}
    </motion.section>
  )
}

// ─── Seção de lista de plantões ────────────────────────────────────────────────

function JobSection({
  title,
  jobs,
  loading,
  institutionLabel,
  teams,
  emptyMessage,
  linkTo,
  linkLabel,
  delay,
  isOffers,
}: {
  title: string
  jobs: InstitutionalJob[]
  loading: boolean
  institutionLabel: string
  teams: TeamItem[]
  emptyMessage: string
  linkTo: string
  linkLabel: string
  delay: number
  isOffers?: boolean
}) {
  const navigate = useNavigate()
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-md p-6 shadow-card mx-4 sm:mx-0"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg text-foreground">{title}</h2>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => navigate(linkTo)}>
          {linkLabel} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) =>
            isOffers
              ? <DashboardOfferCard key={job.id} job={job} />
              : <InstJobCard key={job.id} job={job} institutionLabel={institutionLabel} teams={teams} />
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )}
    </motion.section>
  )
}

// ─── Dashboards exportados ─────────────────────────────────────────────────────

export function MedicoInstitucionalDesktopDashboard() {
  const data = useMedicoInstitucionalData()
  const isGlobalLoading = data.loadingInstitutions

  return (
    <div className="page-container">
      <FilterBar
        institutions={data.institutions}
        teams={data.teams}
        selectedInstitution={data.selectedInstitution}
        selectedTeam={data.selectedTeam}
        loadingInstitutions={data.loadingInstitutions}
        loadingTeams={data.loadingTeams}
        onInstitutionChange={data.setSelectedInstitution}
        onTeamChange={data.setSelectedTeam}
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <QuickActions />
      </motion.section>

      <div className="grid gap-6">
        <JobSection
          title="Compromissos de hoje"
          jobs={data.todayJobs}
          loading={isGlobalLoading || data.todayLoading}
          institutionLabel={data.institutionLabel}
          teams={data.teams}
          emptyMessage="Nenhum compromisso hoje nesta instituição"
          linkTo="/agenda"
          linkLabel="Ver agenda"
          delay={0.1}
        />
        <JobSection
          title="Próximos compromissos"
          jobs={data.upcomingJobs}
          loading={isGlobalLoading || data.upcomingLoading}
          institutionLabel={data.institutionLabel}
          teams={data.teams}
          emptyMessage="Nenhum compromisso agendado nesta instituição"
          linkTo="/agenda"
          linkLabel="Ver todos"
          delay={0.15}
        />
        <JobSection
          title="Ofertas disponíveis"
          jobs={data.offers}
          loading={isGlobalLoading || data.loadingOffers}
          institutionLabel={data.institutionLabel}
          teams={data.teams}
          emptyMessage="Nenhuma oferta disponível nesta instituição"
          linkTo="/ofertas"
          linkLabel="Ver todas"
          delay={0.2}
          isOffers
        />
        <FinanceCard
          finance={data.finance}
          loading={isGlobalLoading || data.loadingFinance}
          period={data.financePeriod}
          onPeriodChange={data.setFinancePeriod}
        />
      </div>
    </div>
  )
}

export function MedicoInstitucionalMobileDashboard() {
  const navigate = useNavigate()
  const data = useMedicoInstitucionalData()
  const isGlobalLoading = data.loadingInstitutions

  return (
    <div className="pb-4 space-y-4">
      <div className="pt-4">
        <FilterBar
          institutions={data.institutions}
          teams={data.teams}
          selectedInstitution={data.selectedInstitution}
          selectedTeam={data.selectedTeam}
          loadingInstitutions={data.loadingInstitutions}
          loadingTeams={data.loadingTeams}
          onInstitutionChange={data.setSelectedInstitution}
          onTeamChange={data.setSelectedTeam}
        />
      </div>

      {isGlobalLoading || data.todayLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : data.todayJobs.length > 0 ? (
        <section className="px-4 py-2">
          <h2 className="font-semibold text-foreground mb-3">Compromissos de hoje</h2>
          <div className="space-y-3">
            {data.todayJobs.map((job) => (
              <InstJobCard key={job.id} job={job} institutionLabel={data.institutionLabel} teams={data.teams} />
            ))}
          </div>
        </section>
      ) : null}

      {!isGlobalLoading && !data.upcomingLoading && data.upcomingJobs.length > 0 && (
        <section className="px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Próximos compromissos</h2>
            <button className="text-xs text-primary font-medium" onClick={() => navigate('/agenda')}>Ver todos</button>
          </div>
          <div className="space-y-3">
            {data.upcomingJobs.map((job) => (
              <InstJobCard key={job.id} job={job} institutionLabel={data.institutionLabel} teams={data.teams} />
            ))}
          </div>
        </section>
      )}

      {!isGlobalLoading && !data.loadingOffers && data.offers.length > 0 && (
        <section className="px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Ofertas disponíveis</h2>
            <button className="text-xs text-primary font-medium" onClick={() => navigate('/ofertas')}>Ver todas</button>
          </div>
          <div className="space-y-3">
            {data.offers.map((job) => (
              <InstJobCard key={job.id} job={job} institutionLabel={data.institutionLabel} teams={data.teams} />
            ))}
          </div>
        </section>
      )}

      <FinanceCard
        finance={data.finance}
        loading={isGlobalLoading || data.loadingFinance}
        period={data.financePeriod}
        onPeriodChange={data.setFinancePeriod}
      />

      <section className="pt-2">
        <QuickActions />
      </section>
    </div>
  )
}
