import { MainLayout } from "@/components/layout/MainLayout.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/contexts/auth/useAuthContext";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import { useUserMode } from "@/contexts/user/UserModeContext";
import { useInstitutionalKpis } from "@/hooks/institution/useInstitutionalKpis";
import { useInstitutionalMembers } from "@/hooks/institution/useInstitutionalMembers";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import institutionalService, { TeamItem, DashboardKpiType } from "@/services/institution/InstitutionalService";
import type {
  DashboardKpiOverview,
  DashboardKpiFinancial,
  DashboardKpiOperational,
  DashboardKpiPeople,
  DashboardKpiShifts,
} from "@/services/institution/InstitutionalService";
import { formatCurrency } from "@/utils/numberFormatter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Loader2,
  Lock,
  ShieldOff,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Tipos de dashboard ───────────────────────────────────────────────────────

interface DashboardTypeConfig {
  key: DashboardKpiType;
  label: string;
  icon: React.ReactNode;
  permissions: string[];
}

const DASHBOARD_TYPES: DashboardTypeConfig[] = [
  {
    key: "overview",
    label: "Visão Geral",
    icon: <BarChart3 className="w-4 h-4" />,
    permissions: ["view_dashboard_overview", "view_dashboard_kpis"],
  },
  {
    key: "financial",
    label: "Financeiro",
    icon: <DollarSign className="w-4 h-4" />,
    permissions: ["view_dashboard_financial"],
  },
  {
    key: "operational",
    label: "Operacional",
    icon: <Zap className="w-4 h-4" />,
    permissions: ["view_dashboard_operational"],
  },
  {
    key: "people",
    label: "Pessoas",
    icon: <Users className="w-4 h-4" />,
    permissions: ["view_dashboard_people"],
  },
  {
    key: "shifts",
    label: "Plantões",
    icon: <Calendar className="w-4 h-4" />,
    permissions: ["view_dashboard_shifts"],
  },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  sub?: string;
  alert?: boolean;
  loading?: boolean;
}

function KpiCard({
  label,
  value,
  icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  sub,
  alert,
  loading,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl p-4 shadow-card flex items-start gap-3 border border-transparent",
        alert && "border-red-500/30 bg-red-500/5"
      )}
    >
      {icon && (
        <div className={cn("rounded-lg p-2 flex-shrink-0 mt-0.5", iconBg, iconColor)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground leading-tight mb-1">{label}</p>
        {loading ? (
          <div className="h-7 flex items-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <p className={cn("text-xl font-bold", alert ? "text-red-500" : "text-foreground")}>
            {value}
          </p>
        )}
        {sub && !loading && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function KpiSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

// ─── ChipSelect simples (single) ──────────────────────────────────────────────

function ChipSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Todos",
}: {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      {label && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 rounded-xl border-border bg-card text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Multi-select com chips ───────────────────────────────────────────────────

function ChipMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Todos",
}: {
  label?: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
      )}
      <div
        className="flex flex-wrap gap-1.5 min-h-9 items-center bg-card border border-border rounded-xl px-3 py-1.5 cursor-pointer hover:border-accent/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {selected.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        ) : (
          selected.map((id) => {
            const opt = options.find((o) => o.value === id);
            return (
              <span
                key={id}
                className="flex items-center gap-1 bg-accent/15 text-accent text-xs px-2 py-0.5 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(id);
                }}
              >
                {opt?.label ?? id}
                <span className="text-accent/60 hover:text-accent">×</span>
              </span>
            );
          })
        )}
        <span className="ml-auto text-muted-foreground/50 text-xs">▾</span>
      </div>
      {open && options.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-xl shadow-lg max-h-56 overflow-auto">
          {options.map((o) => (
            <div
              key={o.value}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                selected.includes(o.value) && "bg-accent/10"
              )}
              onClick={() => toggle(o.value)}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center text-xs",
                  selected.includes(o.value)
                    ? "bg-accent border-accent text-white"
                    : "border-border"
                )}
              >
                {selected.includes(o.value) && "✓"}
              </span>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Views por tipo de dashboard ──────────────────────────────────────────────

function OverviewView({ data, loading }: { data: DashboardKpiOverview | null; loading: boolean }) {
  const kpis = data?.kpis;
  return (
    <div className="space-y-6">
      <KpiSection title="Operação de hoje">
        <KpiCard
          label="Plantões hoje"
          value={kpis?.today.totalShifts ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          label="Plantões críticos"
          value={kpis?.today.criticalShifts ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          alert={(kpis?.today.criticalShifts ?? 0) > 0}
          sub="próximas 12h sem médico"
          loading={loading}
        />
      </KpiSection>

      <KpiSection title="Período selecionado">
        <KpiCard
          label="Total de plantões"
          value={kpis?.period.totalShifts ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          label="Plantões preenchidos"
          value={kpis?.period.filledShifts ?? 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          loading={loading}
        />
        <KpiCard
          label="Plantões em aberto"
          value={kpis?.period.openShifts ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          alert={(kpis?.period.openShifts ?? 0) > 0}
          loading={loading}
        />
        <KpiCard
          label="Taxa de cobertura"
          value={kpis ? `${kpis.period.fillRate}%` : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          loading={loading}
        />
        <KpiCard
          label="Médicos ativos"
          value={kpis?.period.activeDoctors ?? 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
          loading={loading}
        />
        <KpiCard
          label="Plantões cancelados"
          value={kpis?.period.cancelledShifts ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
          sub={kpis ? `${kpis.period.cancellationRate}% do total` : undefined}
          loading={loading}
        />
        <KpiCard
          label="Solicitações pendentes"
          value={kpis?.period.pendingApplications ?? 0}
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-500"
          alert={(kpis?.period.pendingApplications ?? 0) > 0}
          loading={loading}
        />
      </KpiSection>
    </div>
  );
}

function FinancialView({ data, loading }: { data: DashboardKpiFinancial | null; loading: boolean }) {
  const kpis = data?.kpis;
  return (
    <div className="space-y-6">
      <KpiSection title="Totais do período">
        <KpiCard
          label="Valor total"
          value={kpis ? formatCurrency(kpis.totalValueCents / 100) : "—"}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          sub={kpis ? `${kpis.jobsCount} plantões` : undefined}
          loading={loading}
        />
        <KpiCard
          label="Valor pago"
          value={kpis ? formatCurrency(kpis.paidValueCents / 100) : "—"}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          loading={loading}
        />
        <KpiCard
          label="Valor recebido"
          value={kpis ? formatCurrency(kpis.receivedValueCents / 100) : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          sub={kpis ? `${kpis.receiptRate}% do total` : undefined}
          loading={loading}
        />
        <KpiCard
          label="A pagar"
          value={kpis ? formatCurrency(kpis.pendingPaymentCents / 100) : "—"}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          alert={(kpis?.pendingPaymentCents ?? 0) > 0}
          loading={loading}
        />
      </KpiSection>

      <KpiSection title="Médias">
        <KpiCard
          label="Ticket médio"
          value={kpis ? formatCurrency(kpis.ticketMedioCents / 100) : "—"}
          icon={<BarChart3 className="w-5 h-5" />}
          sub="por plantão"
          loading={loading}
        />
        <KpiCard
          label="A receber"
          value={kpis ? formatCurrency(kpis.pendingReceiptCents / 100) : "—"}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-500"
          sub="pago, aguardando repasse"
          loading={loading}
        />
        <KpiCard
          label="Taxa de recebimento"
          value={kpis ? `${kpis.receiptRate}%` : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          loading={loading}
        />
        <KpiCard
          label="Plantões com valor"
          value={kpis?.jobsCount ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          loading={loading}
        />
      </KpiSection>
    </div>
  );
}

function OperationalView({ data, loading }: { data: DashboardKpiOperational | null; loading: boolean }) {
  const kpis = data?.kpis;
  return (
    <div className="space-y-6">
      <KpiSection title="Eficiência operacional">
        <KpiCard
          label="Taxa de cobertura"
          value={kpis ? `${kpis.fillRate}%` : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          loading={loading}
        />
        <KpiCard
          label="Taxa de cancelamento"
          value={kpis ? `${kpis.cancellationRate}%` : "—"}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          alert={(kpis?.cancellationRate ?? 0) > 10}
          loading={loading}
        />
        <KpiCard
          label="Plantões em aberto"
          value={kpis?.openShifts ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          alert={(kpis?.openShifts ?? 0) > 0}
          loading={loading}
        />
        <KpiCard
          label="Plantões críticos"
          value={kpis?.criticalShifts ?? 0}
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          alert={(kpis?.criticalShifts ?? 0) > 0}
          sub="próximas 12h"
          loading={loading}
        />
      </KpiSection>

      <KpiSection title="Solicitações">
        <KpiCard
          label="Pendentes"
          value={kpis?.pendingApplications ?? 0}
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-500"
          alert={(kpis?.pendingApplications ?? 0) > 0}
          loading={loading}
        />
        <KpiCard
          label="Aprovadas"
          value={kpis?.approvedApplications ?? 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          loading={loading}
        />
        <KpiCard
          label="Recusadas"
          value={kpis?.rejectedApplications ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
          loading={loading}
        />
        <KpiCard
          label="Médicos ativos"
          value={kpis?.activeDoctors ?? 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
          loading={loading}
        />
      </KpiSection>

      <KpiSection title="Volume de plantões">
        <KpiCard
          label="Total"
          value={kpis?.totalShifts ?? 0}
          loading={loading}
        />
        <KpiCard
          label="Preenchidos"
          value={kpis?.filledShifts ?? 0}
          loading={loading}
        />
        <KpiCard
          label="Em aberto"
          value={kpis?.openShifts ?? 0}
          loading={loading}
        />
        <KpiCard
          label="Cancelados"
          value={kpis?.cancelledShifts ?? 0}
          loading={loading}
        />
      </KpiSection>
    </div>
  );
}

function PeopleView({ data, loading }: { data: DashboardKpiPeople | null; loading: boolean }) {
  const kpis = data?.kpis;

  const roleLabels: Record<string, string> = {
    institutional: "Institucional",
    administrative: "Administrativo",
    scheduler: "Escalista",
    responsible: "Responsável",
    CRM: "Médico",
    unknown: "Sem papel",
  };

  return (
    <div className="space-y-6">
      <KpiSection title="Profissionais">
        <KpiCard
          label="Médicos ativos no período"
          value={kpis?.activeDoctors ?? 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
          loading={loading}
        />
        <KpiCard
          label="Total de membros"
          value={kpis?.totalMembers ?? 0}
          icon={<Users className="w-5 h-5" />}
          loading={loading}
        />
      </KpiSection>

      <KpiSection title="Times">
        <KpiCard
          label="Times ativos"
          value={kpis?.activeTeams ?? 0}
          icon={<Building2 className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          loading={loading}
        />
        <KpiCard
          label="Total de times"
          value={kpis?.totalTeams ?? 0}
          icon={<Building2 className="w-5 h-5" />}
          loading={loading}
        />
      </KpiSection>

      {kpis?.membersByRole && Object.keys(kpis.membersByRole).length > 0 && !loading && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Membros por papel
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(kpis.membersByRole).map(([role, count]) => (
              <KpiCard
                key={role}
                label={roleLabels[role] ?? role}
                value={count}
                loading={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ShiftsView({ data, loading }: { data: DashboardKpiShifts | null; loading: boolean }) {
  const kpis = data?.kpis;
  return (
    <div className="space-y-6">
      <KpiSection title="Situação hoje">
        <KpiCard
          label="Plantões hoje"
          value={kpis?.todayShifts ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          label="Plantões críticos"
          value={kpis?.criticalShifts ?? 0}
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          alert={(kpis?.criticalShifts ?? 0) > 0}
          sub="próximas 12h sem médico"
          loading={loading}
        />
      </KpiSection>

      <KpiSection title="Período selecionado">
        <KpiCard
          label="Total de plantões"
          value={kpis?.totalShifts ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          label="Preenchidos"
          value={kpis?.filledShifts ?? 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          loading={loading}
        />
        <KpiCard
          label="Em aberto"
          value={kpis?.openShifts ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          alert={(kpis?.openShifts ?? 0) > 0}
          loading={loading}
        />
        <KpiCard
          label="Cancelados"
          value={kpis?.cancelledShifts ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
          loading={loading}
        />
        <KpiCard
          label="Taxa de cobertura"
          value={kpis ? `${kpis.fillRate}%` : "—"}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          loading={loading}
        />
        <KpiCard
          label="Taxa de cancelamento"
          value={kpis ? `${kpis.cancellationRate}%` : "—"}
          icon={<BarChart3 className="w-5 h-5" />}
          loading={loading}
        />
      </KpiSection>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuthContext();
  const { medicoModeActive } = useUserMode();
  const {
    institutions,
    institutionsLoading,
    selectedInstitutionId,
    hasDashboardPermission,
    permissionsLoading,
  } = useInstitutionalContext();

  // Tipos permitidos
  const allowedTypes = DASHBOARD_TYPES.filter((t) =>
    t.permissions.some((p) => hasDashboardPermission(p))
  );

  // Estado dos filtros
  const [selectedType, setSelectedType] = useState<DashboardKpiType | null>(null);
  const [filterInstitution, setFilterInstitution] = useState<string>("__all__");
  const [filterTeam, setFilterTeam] = useState<string>("__all__");
  const [filterMedicos, setFilterMedicos] = useState<string[]>([]);
  const [monthDate, setMonthDate] = useState(new Date());
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Seleciona primeiro tipo disponível automaticamente
  useEffect(() => {
    if (!permissionsLoading && allowedTypes.length > 0 && selectedType === null) {
      setSelectedType(allowedTypes[0].key);
    }
  }, [permissionsLoading, allowedTypes, selectedType]);

  // Carrega times quando a instituição muda
  const activeInstitutionId =
    filterInstitution !== "__all__" ? filterInstitution : selectedInstitutionId;

  useEffect(() => {
    if (!activeInstitutionId) return;
    setTeamsLoading(true);
    institutionalService
      .listTeams(activeInstitutionId)
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setTeamsLoading(false));
  }, [activeInstitutionId]);

  // Membros para o select de médico
  const { members } = useInstitutionalMembers(activeInstitutionId ?? undefined);
  const medicoOptions = members.map((m) => ({ value: m.userId, label: m.profileName }));

  // Período
  const from = startOfMonth(monthDate).toISOString();
  const to = endOfMonth(monthDate).toISOString();
  const monthLabel = format(monthDate, "MMMM 'de' yyyy", { locale: ptBR });

  // Parâmetros para o hook de KPIs
  const profileFilter = medicoModeActive
    ? (user?.id ?? null)
    : filterMedicos.length === 1
    ? filterMedicos[0]
    : null;

  const { data, loading, error } = useInstitutionalKpis({
    type: selectedType ?? "overview",
    institution: filterInstitution !== "__all__" ? filterInstitution : selectedInstitutionId,
    team: filterTeam !== "__all__" ? filterTeam : null,
    profile: profileFilter,
    from,
    to,
  });

  // ── Sem acesso ──────────────────────────────────────────────────────────────
  if (!permissionsLoading && allowedTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="bg-muted rounded-full p-5">
          <ShieldOff className="w-10 h-10 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">Sem acesso ao Dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">
            Você não tem permissão para visualizar nenhum painel. Solicite acesso ao administrador
            da sua instituição.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/60">
          <Lock className="w-3 h-3" />
          Permissões: view_dashboard_*
        </div>
      </div>
    );
  }

  const institutionOptions = institutions.map((i) => ({ value: i.value, label: i.label }));
  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  return (
    <div className="space-y-5">
      {/* ── Seletor de tipo de dashboard ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-card rounded-xl border border-border p-1 flex gap-1 flex-wrap">
          {permissionsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 w-24 rounded-lg bg-muted/50 animate-pulse" />
              ))
            : allowedTypes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedType(t.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedType === t.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
        </div>
      </motion.div>

      {/* ── Barra de filtros ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-xl border border-border px-4 py-3 flex flex-wrap gap-4 items-end"
      >
        {/* Período */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Período
          </p>
          <div className="flex items-center gap-1 h-9">
            <button
              type="button"
              onClick={() => setMonthDate((d) => subMonths(d, 1))}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[140px] text-center capitalize">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => setMonthDate((d) => addMonths(d, 1))}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instituição */}
        {!institutionsLoading && institutions.length > 1 && (
          <ChipSelect
            label="Instituição"
            options={institutionOptions}
            value={filterInstitution}
            onChange={(v) => {
              setFilterInstitution(v);
              setFilterTeam("__all__");
            }}
            placeholder="Todas as instituições"
          />
        )}

        {/* Time */}
        {!teamsLoading && teamOptions.length > 0 && (
          <ChipSelect
            label="Time"
            options={teamOptions}
            value={filterTeam}
            onChange={setFilterTeam}
            placeholder="Todos os times"
          />
        )}

        {/* Médico (oculto no modo médico) */}
        {!medicoModeActive && medicoOptions.length > 0 && (
          <div className="flex-1 min-w-[160px] max-w-[260px]">
            <ChipMultiSelect
              label="Médico"
              options={medicoOptions}
              selected={filterMedicos}
              onChange={setFilterMedicos}
              placeholder="Todos os médicos"
            />
          </div>
        )}

        {/* Modo médico ativo: aviso */}
        {medicoModeActive && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/10 px-3 py-2 rounded-lg">
            <Users className="w-3.5 h-3.5 text-accent" />
            Exibindo apenas seus dados
          </div>
        )}
      </motion.div>

      {/* ── Erro ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPIs por tipo ── */}
      <motion.div
        key={selectedType}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        {selectedType === "overview" && (
          <OverviewView
            data={data?.type === "overview" ? (data as DashboardKpiOverview) : null}
            loading={loading}
          />
        )}
        {selectedType === "financial" && (
          <FinancialView
            data={data?.type === "financial" ? (data as DashboardKpiFinancial) : null}
            loading={loading}
          />
        )}
        {selectedType === "operational" && (
          <OperationalView
            data={data?.type === "operational" ? (data as DashboardKpiOperational) : null}
            loading={loading}
          />
        )}
        {selectedType === "people" && (
          <PeopleView
            data={data?.type === "people" ? (data as DashboardKpiPeople) : null}
            loading={loading}
          />
        )}
        {selectedType === "shifts" && (
          <ShiftsView
            data={data?.type === "shifts" ? (data as DashboardKpiShifts) : null}
            loading={loading}
          />
        )}
      </motion.div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function InstitutionalDashboard() {
  const isMobile = useIsMobile();
  const { permissionsLoading } = useInstitutionalContext();

  return (
    <MainLayout mobileTitle="Dashboard">
      {permissionsLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className={cn(isMobile ? "pb-4 px-4 pt-4 space-y-4" : "page-container space-y-6")}>
          <DashboardContent />
        </div>
      )}
    </MainLayout>
  );
}
