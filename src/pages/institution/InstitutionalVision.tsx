import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, subMonths, format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Info,
  TrendingDown,
  TrendingUp,
  Users,
  Calendar,
  ShieldAlert,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOwnerKpis } from '@/hooks/institution/useOwnerKpis';
import type {
  InstitutionOwnerStats,
  OwnerAlert,
  OwnerConsolidated,
  HealthStatus,
} from '@/services/institution/InstitutionalService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

const HEALTH_CONFIG: Record<
  HealthStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  healthy:   { label: 'Saudável', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  attention: { label: 'Atenção',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  risk:      { label: 'Risco',    color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20'  },
  critical:  { label: 'Crítica',  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
};

function HealthBadge({ status, score }: { status: HealthStatus; score: number }) {
  const cfg = HEALTH_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {score.toFixed(0)}
    </span>
  );
}

function HealthBar({ score, status }: { score: number; status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    healthy: 'bg-emerald-500',
    attention: 'bg-amber-500',
    risk: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-1">
      <div
        className={`h-2 rounded-full transition-all ${colors[status]}`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                {title}
              </p>
              <p className={`text-2xl font-bold ${accent ?? 'text-foreground'}`}>{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Period Selector ──────────────────────────────────────────────────────────

function PeriodSelector({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
      <button
        onClick={() => onChange(subMonths(value, 1))}
        className="p-0.5 hover:text-foreground text-muted-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium w-32 text-center">
        {format(value, 'MMMM yyyy', { locale: ptBR })}
      </span>
      <button
        onClick={() => onChange(addMonths(value, 1))}
        className="p-0.5 hover:text-foreground text-muted-foreground"
        disabled={value >= new Date()}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: OwnerAlert }) {
  const cfg = {
    critical: { icon: AlertCircle,  cls: 'text-red-400    bg-red-500/10    border-red-500/20'    },
    warning:  { icon: AlertTriangle, cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
    info:     { icon: Info,          cls: 'text-blue-400   bg-blue-500/10   border-blue-500/20'   },
  }[alert.severity];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.cls}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">{alert.institutionName}</p>
        <p className="text-xs mt-0.5">{alert.message}</p>
      </div>
    </div>
  );
}

// ─── Tab: Visão Geral ─────────────────────────────────────────────────────────

function VisaoGeralTab({
  consolidated,
  institutions,
  alerts,
  loading,
}: {
  consolidated: OwnerConsolidated | undefined;
  institutions: InstitutionOwnerStats[];
  alerts: OwnerAlert[];
  loading: boolean;
}) {
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const otherAlerts = alerts.filter((a) => a.severity !== 'critical');

  return (
    <div className="space-y-6">
      {/* KPIs consolidados */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Consolidado — Todas as Instituições
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            title="Plantões"
            value={consolidated?.totalShifts ?? 0}
            icon={Calendar}
            loading={loading}
          />
          <KpiCard
            title="Cobertura"
            value={formatPct(consolidated?.fillRate ?? 0)}
            subtitle={`${consolidated?.filledShifts ?? 0} preenchidos`}
            icon={CheckCircle2}
            accent="text-emerald-400"
            loading={loading}
          />
          <KpiCard
            title="Em Aberto"
            value={consolidated?.openShifts ?? 0}
            subtitle={`${consolidated?.criticalShifts ?? 0} críticos`}
            icon={Clock}
            accent={(consolidated?.criticalShifts ?? 0) > 0 ? 'text-red-400' : undefined}
            loading={loading}
          />
          <KpiCard
            title="Cancelamentos"
            value={formatPct(consolidated?.cancellationRate ?? 0)}
            subtitle={`${consolidated?.cancelledShifts ?? 0} cancelados`}
            icon={XCircle}
            accent={(consolidated?.cancellationRate ?? 0) > 20 ? 'text-red-400' : undefined}
            loading={loading}
          />
          <KpiCard
            title="Pendentes"
            value={consolidated?.pendingApplications ?? 0}
            subtitle="solicitações"
            icon={Users}
            loading={loading}
          />
        </div>
      </div>

      {/* Financeiro resumido */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Resumo Financeiro
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            title="Valor Total"
            value={formatCurrency(consolidated?.totalValueCents ?? 0)}
            icon={DollarSign}
            loading={loading}
          />
          <KpiCard
            title="Valor Pago"
            value={formatCurrency(consolidated?.paidValueCents ?? 0)}
            icon={TrendingUp}
            accent="text-emerald-400"
            loading={loading}
          />
          <KpiCard
            title="Valor Recebido"
            value={formatCurrency(consolidated?.receivedValueCents ?? 0)}
            icon={TrendingUp}
            accent="text-blue-400"
            loading={loading}
          />
          <KpiCard
            title="A Receber"
            value={formatCurrency(consolidated?.pendingReceiptCents ?? 0)}
            icon={TrendingDown}
            accent={(consolidated?.pendingReceiptCents ?? 0) > 0 ? 'text-amber-400' : undefined}
            loading={loading}
          />
        </div>
      </div>

      {/* Saúde por instituição */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Índice de Saúde por Instituição
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma instituição encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {institutions.map((inst) => {
              const cfg = HEALTH_CONFIG[inst.healthStatus];
              return (
                <div
                  key={inst.institutionId}
                  className={`p-4 rounded-lg border ${cfg.border} ${cfg.bg}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                      <p className={`text-sm font-semibold truncate ${cfg.color}`}>
                        {inst.institutionName}
                      </p>
                    </div>
                    <HealthBadge status={inst.healthStatus} score={inst.healthScore} />
                  </div>
                  <HealthBar score={inst.healthScore} status={inst.healthStatus} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Cobertura</p>
                      <p className="text-sm font-bold">{formatPct(inst.fillRate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Críticos</p>
                      <p className={`text-sm font-bold ${inst.criticalShifts > 0 ? 'text-red-400' : ''}`}>
                        {inst.criticalShifts}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cancelam.</p>
                      <p className="text-sm font-bold">{formatPct(inst.cancellationRate)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alertas */}
      {(criticalAlerts.length > 0 || otherAlerts.length > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Alertas
          </h3>
          <div className="space-y-2">
            {criticalAlerts.map((a, i) => (
              <AlertRow key={i} alert={a} />
            ))}
            {otherAlerts.map((a, i) => (
              <AlertRow key={i} alert={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Comparativo ─────────────────────────────────────────────────────────

type SortKey = keyof Pick<
  InstitutionOwnerStats,
  | 'institutionName'
  | 'healthScore'
  | 'totalShifts'
  | 'fillRate'
  | 'openShifts'
  | 'criticalShifts'
  | 'totalValueCents'
  | 'cancellationRate'
>;

function ComparativoTab({
  institutions,
  loading,
}: {
  institutions: InstitutionOwnerStats[];
  loading: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('healthScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(() => {
    return [...institutions].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(String(bVal)) : Number(aVal) - Number(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [institutions, sortKey, sortDir]);

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground whitespace-nowrap"
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <ArrowUpDown className={`w-3 h-3 ${active ? 'text-primary' : 'opacity-40'}`} />
        </span>
      </th>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (institutions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma instituição encontrada.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <SortHeader col="institutionName" label="Instituição" />
            <SortHeader col="healthScore" label="Saúde" />
            <SortHeader col="totalShifts" label="Plantões" />
            <SortHeader col="fillRate" label="Cobertura" />
            <SortHeader col="openShifts" label="Em Aberto" />
            <SortHeader col="criticalShifts" label="Críticos" />
            <SortHeader col="totalValueCents" label="Custo" />
            <SortHeader col="cancellationRate" label="Cancelam." />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((inst) => (
            <tr key={inst.institutionId} className="hover:bg-muted/30">
              <td className="px-3 py-3 font-medium">{inst.institutionName}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <HealthBadge status={inst.healthStatus} score={inst.healthScore} />
                  <span className={`text-xs ${HEALTH_CONFIG[inst.healthStatus].color}`}>
                    {HEALTH_CONFIG[inst.healthStatus].label}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3">{inst.totalShifts}</td>
              <td className="px-3 py-3">
                <span
                  className={
                    inst.fillRate >= 80
                      ? 'text-emerald-400 font-semibold'
                      : inst.fillRate >= 60
                        ? 'text-amber-400 font-semibold'
                        : 'text-red-400 font-semibold'
                  }
                >
                  {formatPct(inst.fillRate)}
                </span>
              </td>
              <td className="px-3 py-3">{inst.openShifts}</td>
              <td className="px-3 py-3">
                {inst.criticalShifts > 0 ? (
                  <span className="text-red-400 font-bold">{inst.criticalShifts}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(inst.totalValueCents)}</td>
              <td className="px-3 py-3">
                <span
                  className={
                    inst.cancellationRate > 20
                      ? 'text-red-400 font-semibold'
                      : inst.cancellationRate > 10
                        ? 'text-amber-400'
                        : ''
                  }
                >
                  {formatPct(inst.cancellationRate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab: Riscos ──────────────────────────────────────────────────────────────

function RiscosTab({
  institutions,
  alerts,
  loading,
}: {
  institutions: InstitutionOwnerStats[];
  alerts: OwnerAlert[];
  loading: boolean;
}) {
  const instByRisk = useMemo(
    () => [...institutions].sort((a, b) => a.healthScore - b.healthScore),
    [institutions],
  );
  const critical = alerts.filter((a) => a.severity === 'critical');
  const warning = alerts.filter((a) => a.severity === 'warning');
  const info = alerts.filter((a) => a.severity === 'info');

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plantões críticos próximas 24h/48h */}
      {institutions.some((i) => i.openNext48h > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Plantões Sem Cobertura — Próximas 48h
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {institutions
              .filter((i) => i.openNext48h > 0)
              .sort((a, b) => b.openNext24h - a.openNext24h)
              .map((inst) => (
                <div
                  key={inst.institutionId}
                  className="p-4 rounded-lg border border-red-500/20 bg-red-500/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-400 truncate">
                      {inst.institutionName}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Próx. 24h</p>
                      <p className="text-xl font-bold text-red-400">{inst.openNext24h}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Próx. 48h</p>
                      <p className="text-xl font-bold text-orange-400">{inst.openNext48h}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Ranking por risco */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Ranking por Risco Operacional
        </h3>
        <div className="space-y-2">
          {instByRisk.map((inst, idx) => {
            const cfg = HEALTH_CONFIG[inst.healthStatus];
            return (
              <div
                key={inst.institutionId}
                className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.border} ${cfg.bg}`}
              >
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                  {idx + 1}
                </span>
                <Building2 className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${cfg.color}`}>
                    {inst.institutionName}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Cobertura: <strong>{formatPct(inst.fillRate)}</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Críticos: <strong>{inst.criticalShifts}</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Cancelam.: <strong>{formatPct(inst.cancellationRate)}</strong>
                    </span>
                  </div>
                </div>
                <HealthBadge status={inst.healthStatus} score={inst.healthScore} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas detalhados */}
      {alerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Alertas Ativos
          </h3>
          {critical.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-400 uppercase mb-1.5">Crítico</p>
              <div className="space-y-1.5">
                {critical.map((a, i) => <AlertRow key={i} alert={a} />)}
              </div>
            </div>
          )}
          {warning.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-amber-400 uppercase mb-1.5">Atenção</p>
              <div className="space-y-1.5">
                {warning.map((a, i) => <AlertRow key={i} alert={a} />)}
              </div>
            </div>
          )}
          {info.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase mb-1.5">Informativo</p>
              <div className="space-y-1.5">
                {info.map((a, i) => <AlertRow key={i} alert={a} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {alerts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
          <p className="text-sm font-semibold text-emerald-400">Sem alertas ativos</p>
          <p className="text-xs text-muted-foreground mt-1">Todas as instituições estão operando normalmente.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Financeiro ──────────────────────────────────────────────────────────

function FinanceiroTab({
  consolidated,
  institutions,
  loading,
}: {
  consolidated: OwnerConsolidated | undefined;
  institutions: InstitutionOwnerStats[];
  loading: boolean;
}) {
  const sorted = useMemo(
    () => [...institutions].sort((a, b) => b.totalValueCents - a.totalValueCents),
    [institutions],
  );

  return (
    <div className="space-y-6">
      {/* Cards financeiros consolidados */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Consolidado Financeiro
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            title="Valor Total"
            value={formatCurrency(consolidated?.totalValueCents ?? 0)}
            icon={DollarSign}
            loading={loading}
          />
          <KpiCard
            title="Pago"
            value={formatCurrency(consolidated?.paidValueCents ?? 0)}
            icon={CheckCircle2}
            accent="text-emerald-400"
            loading={loading}
          />
          <KpiCard
            title="Recebido"
            value={formatCurrency(consolidated?.receivedValueCents ?? 0)}
            icon={TrendingUp}
            accent="text-blue-400"
            loading={loading}
          />
          <KpiCard
            title="A Pagar"
            value={formatCurrency(consolidated?.pendingPaymentCents ?? 0)}
            icon={Clock}
            accent={(consolidated?.pendingPaymentCents ?? 0) > 0 ? 'text-amber-400' : undefined}
            loading={loading}
          />
          <KpiCard
            title="A Receber"
            value={formatCurrency(consolidated?.pendingReceiptCents ?? 0)}
            icon={TrendingDown}
            accent={(consolidated?.pendingReceiptCents ?? 0) > 0 ? 'text-orange-400' : undefined}
            loading={loading}
          />
        </div>
      </div>

      {/* Tabela por instituição */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Por Instituição
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Instituição
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Valor Total
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Pago
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Recebido
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    A Pagar
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    A Receber
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Plantões
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((inst) => (
                  <tr key={inst.institutionId} className="hover:bg-muted/30">
                    <td className="px-3 py-3 font-medium">{inst.institutionName}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap font-semibold">
                      {formatCurrency(inst.totalValueCents)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-emerald-400">
                      {formatCurrency(inst.paidValueCents)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-blue-400">
                      {formatCurrency(inst.receivedValueCents)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-amber-400">
                      {inst.pendingPaymentCents > 0 ? formatCurrency(inst.pendingPaymentCents) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-orange-400">
                      {inst.pendingReceiptCents > 0 ? formatCurrency(inst.pendingReceiptCents) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right">{inst.totalShifts}</td>
                  </tr>
                ))}
                {/* Totais */}
                {sorted.length > 1 && consolidated && (
                  <tr className="bg-muted/40 font-semibold">
                    <td className="px-3 py-3 text-xs uppercase tracking-wide">Total</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {formatCurrency(consolidated.totalValueCents)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-emerald-400">
                      {formatCurrency(consolidated.paidValueCents)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-blue-400">
                      {formatCurrency(consolidated.receivedValueCents)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-amber-400">
                      {formatCurrency(consolidated.pendingPaymentCents)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-orange-400">
                      {formatCurrency(consolidated.pendingReceiptCents)}
                    </td>
                    <td className="px-3 py-3 text-right">{consolidated.totalShifts}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstitutionalVision() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('all');

  const from = startOfMonth(monthDate).toISOString();
  const to = endOfMonth(monthDate).toISOString();

  const { data, loading, error, reload } = useOwnerKpis({ from, to });

  const allInstitutions = data?.institutions ?? [];

  const institutions = selectedInstitutionId === 'all'
    ? allInstitutions
    : allInstitutions.filter((i) => i.institutionId === selectedInstitutionId);

  const consolidated = useMemo(() => {
    if (selectedInstitutionId === 'all') return data?.consolidated;
    const inst = allInstitutions.find((i) => i.institutionId === selectedInstitutionId);
    if (!inst) return data?.consolidated;
    return {
      totalShifts: inst.totalShifts,
      filledShifts: inst.filledShifts,
      openShifts: inst.openShifts,
      cancelledShifts: inst.cancelledShifts,
      criticalShifts: inst.criticalShifts,
      openNext24h: inst.openNext24h,
      openNext48h: inst.openNext48h,
      pendingApplications: inst.pendingApplications,
      totalValueCents: inst.totalValueCents,
      paidValueCents: inst.paidValueCents,
      receivedValueCents: inst.receivedValueCents,
      pendingPaymentCents: inst.pendingPaymentCents,
      pendingReceiptCents: inst.pendingReceiptCents,
      totalTeams: inst.totalTeams,
      activeTeams: inst.activeTeams,
      fillRate: inst.fillRate,
      cancellationRate: inst.cancellationRate,
      institutionCount: 1,
    };
  }, [selectedInstitutionId, allInstitutions, data?.consolidated]);

  const alerts = selectedInstitutionId === 'all'
    ? (data?.alerts ?? [])
    : (data?.alerts ?? []).filter((a) => a.institutionId === selectedInstitutionId);

  return (
    <MainLayout mobileTitle="Visão Institucional">
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Visão Institucional
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão estratégica consolidada de todas as instituições
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {allInstitutions.length > 1 && (
            <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
              <SelectTrigger className="w-48 h-9 text-sm">
                <SelectValue placeholder="Todas as instituições" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as instituições</SelectItem>
                {allInstitutions.map((inst) => (
                  <SelectItem key={inst.institutionId} value={inst.institutionId}>
                    {inst.institutionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <PeriodSelector value={monthDate} onChange={setMonthDate} />
          <button
            onClick={reload}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Alertas críticos no topo */}
      {!loading && alerts.filter((a) => a.severity === 'critical').length > 0 && (
        <div className="space-y-1.5">
          {alerts
            .filter((a) => a.severity === 'critical')
            .map((a, i) => (
              <AlertRow key={i} alert={a} />
            ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="comparative">Comparativo</TabsTrigger>
          <TabsTrigger value="risks">
            Riscos
            {!loading && alerts.filter((a) => a.severity === 'critical').length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {alerts.filter((a) => a.severity === 'critical').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <VisaoGeralTab
            consolidated={consolidated}
            institutions={institutions}
            alerts={alerts}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="comparative" className="mt-6">
          <ComparativoTab institutions={institutions} loading={loading} />
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <RiscosTab institutions={institutions} alerts={alerts} loading={loading} />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <FinanceiroTab
            consolidated={consolidated}
            institutions={institutions}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
    </MainLayout>
  );
}
