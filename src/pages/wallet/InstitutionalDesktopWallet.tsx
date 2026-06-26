import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext.ts";
import { cn } from "@/lib/utils";
import institutionalService, { type TeamItem } from "@/services/institution/InstitutionalService.ts";
import { formatPaymentMethod } from "@/utils/job.helper";
import { formatCurrency } from "@/utils/numberFormatter";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  RotateCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MonthTabs } from "../transfers/components/MonthTabs";
import {
  InstitutionalWalletDetailsModal,
  type InstitutionalJobWithReceivedAt,
} from "./InstitutionalWalletDetailsModal.tsx";
import { statusColors, statusLabels } from "./utils/constants.ts";

export default function InstitutionalDesktopWallet() {
  const { institutions } = useInstitutionalContext();

  const [allJobs, setAllJobs] = useState<InstitutionalJobWithReceivedAt[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedJob, setSelectedJob] = useState<InstitutionalJobWithReceivedAt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hideValues, setHideValues] = useState(true);

  const [filterInstId, setFilterInstId] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [filterTeams, setFilterTeams] = useState<TeamItem[]>([]);

  const now = new Date();
  const [monthFilter, setMonthFilter] = useState<{ month: number; year: number }>({
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  useEffect(() => {
    if (!filterInstId) { setFilterTeams([]); setFilterTeamId(""); return; }
    institutionalService.listTeams(filterInstId).then(setFilterTeams).catch(() => {});
  }, [filterInstId]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const from = dayjs(new Date(monthFilter.year, monthFilter.month, 1)).format("YYYY-MM-DD");
      const to = dayjs(new Date(monthFilter.year, monthFilter.month + 1, 0)).format("YYYY-MM-DD");
      const res = await institutionalService.getAgenda({
        from,
        to,
        view: 'mine',
        institution: filterInstId || undefined,
        team: filterTeamId || undefined,
        limit: 200,
      });
      setAllJobs(res.docs as InstitutionalJobWithReceivedAt[]);
    } catch (e) {
      console.error("[InstitutionalWallet] fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [monthFilter, filterInstId, filterTeamId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredItems = useMemo(() => {
    let result = allJobs.filter((item) => item.priceInCents && item.priceInCents > 0);

    if (statusFilter === "received") {
      result = result.filter((item) => !!item.receivedAt);
    } else if (statusFilter === "pending") {
      result = result.filter((item) => !item.receivedAt);
    }

    return [...result].sort(
      (a, b) =>
        new Date(a.startDateTime || 0).getTime() - new Date(b.startDateTime || 0).getTime(),
    );
  }, [allJobs, statusFilter]);

  const summary = useMemo(() => {
    const base = allJobs.filter((item) => item.priceInCents && item.priceInCents > 0);
    const totalReceived = base
      .filter((j) => j.receivedAt)
      .reduce((s, j) => s + (j.priceInCents ?? 0) / 100, 0);
    const totalPending = base
      .filter((j) => !j.receivedAt)
      .reduce((s, j) => s + (j.priceInCents ?? 0) / 100, 0);
    return {
      totalReceived,
      totalPending,
      countReceived: base.filter((j) => j.receivedAt).length,
      countPending: base.filter((j) => !j.receivedAt).length,
    };
  }, [allJobs]);

  const months = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = -12; i <= 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      result.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: dayjs(d).locale("pt-br").format("MMMM YYYY"),
        shortLabel: dayjs(d).locale("pt-br").format("MMM/YY").replace(/^\w/, (c) => c.toUpperCase()),
      });
    }
    return result;
  }, []);

  const currentMonthLabel = dayjs(new Date(monthFilter.year, monthFilter.month))
    .locale("pt-br")
    .format("MMMM [de] YYYY");

  const handleMarkReceived = async (jobId: string, date: string) => {
    await institutionalService.markJobReceived(jobId, date);
    setAllJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, receivedAt: date } : j)),
    );
  };

  const handleUnmarkReceived = async (jobId: string) => {
    await institutionalService.unmarkJobReceived(jobId);
    setAllJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, receivedAt: null } : j)),
    );
  };

  const selectCls =
    "h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]";

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div className="page-header mb-0">
          <h1 className="page-title">Recebimentos</h1>
          <p className="page-subtitle capitalize">{currentMonthLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button
            variant="default"
            className={cn("gap-2", !hideValues && "bg-muted")}
            onClick={() => setHideValues(!hideValues)}
          >
            {hideValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {hideValues ? "Mostrar Valores" : "Ocultar Valores"}
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-3 gap-4 mb-6"
      >
        <div className="bg-card rounded-md p-5 border border-border shadow-card hover:border-primary/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recebido</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.totalReceived, hideValues)}
              </p>
              <p className="text-sm text-muted-foreground">{summary.countReceived} itens</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-md p-5 border border-border shadow-card hover:border-primary/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A Receber</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(summary.totalPending, hideValues)}
              </p>
              <p className="text-sm text-muted-foreground">{summary.countPending} itens</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-md p-5 border border-border shadow-card hover:border-primary/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total do Mês</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalReceived + summary.totalPending, hideValues)}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.countReceived + summary.countPending} itens
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-foreground" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between mb-6 gap-4 overflow-hidden"
      >
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-4 w-full">
            <MonthTabs
              months={months}
              selectedMonth={monthFilter}
              onSelectMonth={(month, year) => setMonthFilter({ month, year })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {institutions.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <select
                    value={filterInstId}
                    onChange={(e) => { setFilterInstId(e.target.value); setFilterTeamId(""); }}
                    className={selectCls}
                  >
                    <option value="">Todas as instituições</option>
                    {institutions.map((i) => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                  <select
                    value={filterTeamId}
                    onChange={(e) => setFilterTeamId(e.target.value)}
                    className={selectCls}
                    disabled={!filterInstId}
                  >
                    <option value="">Todos os times</option>
                    {filterTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex-1">
              <div className="flex w-fit bg-card rounded-lg p-1 border border-border/50">
                <Button
                  variant="ghost" size="sm"
                  className={cn("px-4 font-medium", !statusFilter && "bg-background shadow-sm text-foreground")}
                  onClick={() => setStatusFilter(undefined)}
                >
                  Todos
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className={cn("px-4 font-medium", statusFilter === "received" && "bg-background shadow-sm text-emerald-600")}
                  onClick={() => setStatusFilter("received")}
                >
                  Recebidos
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className={cn("px-4 font-medium", statusFilter === "pending" && "bg-background shadow-sm text-amber-600")}
                  onClick={() => setStatusFilter("pending")}
                >
                  A Receber
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
            <span className="ml-3 text-muted-foreground font-medium">Carregando recebimentos...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-background/50 flex items-center justify-center mb-6">
              <DollarSign className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum recebimento encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Não há itens correspondentes aos filtros selecionados neste mês.
            </p>
            {statusFilter && (
              <Button variant="outline" size="sm" onClick={() => setStatusFilter(undefined)} className="gap-2">
                <RotateCw className="w-3.5 h-3.5" />
                Limpar filtro de status
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50 bg-background">
            <AnimatePresence>
              {filteredItems.map((item, index) => {
                const isReceived = !!item.receivedAt;
                const itemDate = item.startDateTime ? new Date(item.startDateTime) : new Date();
                const amount = item.priceInCents ? item.priceInCents / 100 : 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => { setSelectedJob(item); setIsModalOpen(true); }}
                    className="p-5 flex items-center justify-between transition-all cursor-pointer bg-card hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0",
                          isReceived ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                        )}
                      >
                        <span className="text-[11px] font-semibold uppercase opacity-80 mb-0.5">
                          {dayjs(itemDate).locale("pt-br").format("MMM")}
                        </span>
                        <span className="text-xl font-bold leading-none">
                          {dayjs(itemDate).format("DD")}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {item.institutionName && (
                            <span className="flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                              <Building2 className="w-3 h-3" />
                              {item.institutionName}
                            </span>
                          )}
                          {item.teamName && (
                            <span className="flex items-center gap-1 text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full">
                              <Users className="w-3 h-3" />
                              {item.teamName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                            {dayjs(itemDate).locale("pt-br").format("dddd, DD [de] MMMM")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <span
                        className={cn(
                          "px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider",
                          statusColors[isReceived ? "received" : "pending"],
                        )}
                      >
                        {statusLabels[isReceived ? "received" : "pending"]}
                      </span>

                      <div className="text-right min-w-[120px]">
                        <p className={cn("text-xl font-bold font-mono tracking-tight", isReceived ? "text-emerald-600" : "text-foreground")}>
                          {formatCurrency(amount, hideValues)}
                        </p>
                        {item.paymentMethod && (
                          <Chip
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            variant={
                              item.paymentMethod === "AV" ? "purple"
                                : item.paymentMethod === "NR" ? "green"
                                : "lime"
                            }
                          >
                            {formatPaymentMethod(item.paymentMethod)}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <InstitutionalWalletDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTimeout(() => setSelectedJob(null), 200); }}
        onMarkReceived={handleMarkReceived}
        onUnmarkReceived={handleUnmarkReceived}
      />
    </div>
  );
}
