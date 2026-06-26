import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/Chip";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useWalletData } from "@/hooks/wallet/useWalletData.ts";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/api.types";
import { formatPaymentMethod, getJobDateInfo } from "@/utils/job.helper";
import { formatCurrency } from "@/utils/numberFormatter";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  RotateCw,
  Stethoscope,
  TrendingUp
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MonthTabs } from "../transfers/components/MonthTabs";
import { statusColors, statusLabels } from "./utils/constants.ts";
import { WalletBulkEditModal } from "./WalletBulkEditModal.tsx";
import { WalletDetailsModal } from "./WalletDetailsModal.tsx";

type JobWithReceivedAt = Job & { receivedAt?: string | null };

export default function DesktopWallet() {
  const { user } = useAuthContext();
  const { allJobs, loading, updateJob, updateJobsBulk, getSummary, refetch } =
    useWalletData();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  const [hideValues, setHideValues] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  // Initialize with current month
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState<{
    month: number;
    year: number;
  }>({
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  // Converte monthFilter {month, year} → Date para o hook
  const selectedMonthDate = useMemo(
    () => new Date(monthFilter.year, monthFilter.month, 1),
    [monthFilter.month, monthFilter.year],
  );

  // P2: getTransactionType — same logic as app
  const getTransactionType = useCallback(
    (item: Job): "income" | "expense" => {
      if (!user?.id) return "income";

      const itemTo =
        item.to && typeof item.to !== "string" ? item.to : undefined;
      const itemFrom =
        item.from && typeof item.from !== "string" ? item.from : undefined;

      const isIncome =
        (user.id === itemFrom?.id && item.visibility === "PRIVATE") ||
        (itemTo?.id === user.id && itemFrom?.id !== user.id);

      return isIncome ? "income" : "expense";
    },
    [user?.id],
  );

  const isJobInMonth = useCallback(
    (job: Job, month: number, year: number): boolean => {
      const monthKey = dayjs(new Date(year, month)).format("YYYY-MM");

      if (job.startDateTime) {
        const jobMonth = dayjs(job.startDateTime).format("YYYY-MM");
        if (jobMonth === monthKey) return true;
      }

      if (job.additionalDates && job.additionalDates.length > 0) {
        for (const ad of job.additionalDates) {
          if (ad && ad.date) {
            const adMonth = dayjs(ad.date).format("YYYY-MM");
            if (adMonth === monthKey) return true;
          }
        }
      }

      return false;
    },
    [],
  );

  // Filter and sort items chronologically
  const filteredItems = useMemo(() => {
    let result = allJobs;
    // Filter by month
    if (monthFilter) {
      result = result.filter((item) => {
        return isJobInMonth(item, monthFilter.month, monthFilter.year);
      });
    }

    // Filter by status (pending or received)
    if (statusFilter) {
      if (statusFilter === "pending") {
        result = result.filter(
          (item) => !(item as JobWithReceivedAt).receivedAt,
        );
      } else if (statusFilter === "received") {
        result = result.filter(
          (item) => !!(item as JobWithReceivedAt).receivedAt,
        );
      }
    }

    // Sort chronologically (oldest first)
    return result.sort(
      (a, b) => getJobDateInfo(a).getTime() - getJobDateInfo(b).getTime(),
    );
  }, [allJobs, statusFilter, monthFilter, isJobInMonth]);

  const isAllSelected =
    filteredItems.length > 0 && selectedItems.size === filteredItems.length;

  // P6: Totais do header refletem a seleção ativa
  const summary = useMemo(() => {
    const itemsThisMonth = allJobs.filter((item) => {
      return isJobInMonth(item, monthFilter.month, monthFilter.year);
    });

    const itemsToSum =
      selectionMode && selectedItems.size > 0
        ? filteredItems.filter((j) => selectedItems.has(j.id))
        : itemsThisMonth;

    return getSummary(itemsToSum);
  }, [
    allJobs,
    monthFilter,
    selectionMode,
    selectedItems,
    filteredItems,
    getSummary,
    isJobInMonth,
  ]);

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) newSelected.delete(itemId);
    else newSelected.add(itemId);
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(filteredItems.map((j) => j.id)));
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const handleBulkUpdate = async (
    markAsReceived: boolean,
    date: string | null,
  ) => {
    if (selectedItems.size === 0) return;
    setIsUpdatingBulk(true);
    try {
      await updateJobsBulk(Array.from(selectedItems), {
        receivedAt: date,
      } as unknown as Partial<Job>);
    } catch {
      // Rollback is handled inside updateJobsBulk
    } finally {
      setIsUpdatingBulk(false);
      setIsBulkEditModalOpen(false);
      cancelSelection();
    }
  };

  // P10: Context menu handler for right-click selection
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      if (!selectionMode) {
        setSelectionMode(true);
        setSelectedItems(new Set([itemId]));
      } else {
        toggleItemSelection(itemId);
      }
    },
    [selectionMode],
  );

  // P3: Generate months for filter — 12 past + 12 future (24 total)
  const months = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = -12; i <= 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      result.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: dayjs(d).locale("pt-br").format("MMMM YYYY"),
        shortLabel: dayjs(d)
          .locale("pt-br")
          .format("MMM/YY")
          .replace(/^\w/, (c) => c.toUpperCase()),
      });
    }
    return result;
  }, []);

  const currentMonthLabel = dayjs(new Date(monthFilter.year, monthFilter.month))
    .locale("pt-br")
    .format("MMMM [de] YYYY");

  if (!user) {
    return (
      <div className="page-container flex flex-col items-center justify-center h-[60vh] text-center">
        <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Faça login para ver seus recebimentos
        </h2>
        <p className="text-muted-foreground">
          Você precisa estar autenticado para acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* P5: Overlay bloqueante durante edição em lote */}
      {isUpdatingBulk && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[220px]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground text-center">
              Atualizando recebimentos...
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="page-header mb-0">
            <h1 className="page-title">Recebimentos</h1>
            <p className="page-subtitle capitalize">{currentMonthLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button
            variant="default"
            className={cn("gap-2", !hideValues && "bg-muted")}
            onClick={() => setHideValues(!hideValues)}
          >
            {hideValues ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
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
              <p className="text-sm text-muted-foreground">
                {summary.countReceived} itens
              </p>
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
                {formatCurrency(
                  summary.totalPending + summary.totalDelayed,
                  hideValues,
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.countPending + summary.countDelayed} itens
              </p>
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
                {formatCurrency(
                  summary.totalReceived +
                    summary.totalPending +
                    summary.totalDelayed,
                  hideValues,
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.countReceived +
                  summary.countPending +
                  summary.countDelayed}{" "}
                itens
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-foreground" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* P6: Indicator when selection is active */}
      <AnimatePresence>
        {selectionMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-sm text-primary font-medium"
          >
            Totais refletindo {selectedItems.size} ite
            {selectedItems.size === 1 ? "m" : "ns"} selecionado
            {selectedItems.size === 1 ? "" : "s"}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between mb-6 gap-4 overflow-hidden"
      >
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-4 w-full">
            {/* Abas de Meses */}
            <MonthTabs
              months={months}
              selectedMonth={monthFilter}
              onSelectMonth={(month, year) => {
                setMonthFilter({ month, year });
                cancelSelection();
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <div className="flex w-fit bg-card rounded-lg p-1 border border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "px-4 font-medium",
                    !statusFilter && "bg-background shadow-sm text-foreground",
                  )}
                  onClick={() => setStatusFilter(undefined)}
                >
                  Todos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "px-4 font-medium",
                    statusFilter === "received" &&
                      "bg-background shadow-sm text-emerald-600",
                  )}
                  onClick={() => setStatusFilter("received")}
                >
                  Recebidos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "px-4 font-medium",
                    statusFilter === "pending" &&
                      "bg-background shadow-sm text-amber-600",
                  )}
                  onClick={() => setStatusFilter("pending")}
                >
                  A Receber
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isAllSelected ? cancelSelection : selectAllItems}
                  className="text-foreground font-medium hover:bg-muted/80"
                >
                  {isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
              )}
              <Button
                variant={selectionMode ? "default" : "outline"}
                onClick={() => {
                  if (selectionMode) cancelSelection();
                  else setSelectionMode(true);
                }}
                className={cn(
                  "gap-2 font-medium"
                )}
              >
                {selectionMode ? "Sair da Seleção" : "Edição em Lote"}
              </Button>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Toolbar Bulk Update fixed at bottom */}
      <AnimatePresence>
        {selectionMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-foreground rounded-full shadow-2xl p-2.5 flex items-center justify-between text-background z-50 border border-border/20 min-w-[400px]"
          >
            <div className="px-5 text-sm font-medium flex items-center gap-3">
              <div className="bg-background text-foreground w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shadow-sm">
                {selectedItems.size}
              </div>
              <span>
                {selectedItems.size === 1
                  ? "item selecionado"
                  : "itens selecionados"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-foreground/70 hover:bg-white/10 hover:text-white px-5"
                onClick={cancelSelection}
                disabled={isUpdatingBulk}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="default"
                className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600 px-5 shadow-sm transition-all shadow-emerald-500/20"
                onClick={() => setIsBulkEditModalOpen(true)}
                disabled={isUpdatingBulk}
              >
                {isUpdatingBulk ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}{" "}
                Editar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
            <span className="ml-3 text-muted-foreground font-medium">
              Carregando recebimentos...
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          // P9: Empty state with contextual actions
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-background/50 flex items-center justify-center mb-6">
              <DollarSign className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum recebimento encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {allJobs.length === 0
                ? "Adicione plantões com valor na sua agenda para acompanhar seus recebimentos aqui."
                : "Não há itens correspondentes aos filtros selecionados neste mês."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {statusFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(undefined)}
                  className="gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Limpar filtro de status
                </Button>
              )}
              {allJobs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setMonthFilter({
                      month: today.getMonth(),
                      year: today.getFullYear(),
                    });
                  }}
                  className="gap-2"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Ir para mês atual
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/50 bg-background">
            <AnimatePresence>
              {filteredItems.map((item, index) => {
                const isSelected = selectedItems.has(item.id);
                const isReceived = !!(item as JobWithReceivedAt).receivedAt;
                const itemDate = getJobDateInfo(item);
                const amount = item.priceInCents ? item.priceInCents / 100 : 0;
                // P2: transaction type
                const transactionType = getTransactionType(item);
                // P8: showAsBlock for singlePaymentForMutipleDates children
                const isBlock = Boolean(
                  item.parentRef && item.singlePaymentForMutipleDates,
                );

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => {
                      if (selectionMode) {
                        toggleItemSelection(item.id);
                      } else {
                        setSelectedJob(item);
                        setIsModalOpen(true);
                      }
                    }}
                    // P10: right-click to enter selection
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                    className={cn(
                      "p-5 flex items-center justify-between transition-all group cursor-pointer bg-card hover:bg-muted/40 ",
                    )}
                  >
                    <div className="flex items-center gap-5">
                      {selectionMode && (
                        <div
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemSelection(item.id);
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            className={cn(
                              "w-5 h-5 transition-all data-[state=checked]:bg-primary",
                            )}
                          />
                        </div>
                      )}

                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0 transition-colors",
                          isReceived
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
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
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="bg-primary/10 p-1 rounded-md text-primary shrink-0">
                            <Stethoscope className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="font-semibold text-foreground text-base tracking-tight">
                            {item.modality?.name} - {item.place?.name}
                          </h4>
                          {/* P8: Block indicator badge */}
                          {isBlock && (
                            <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                              Pgto. Único
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                            {dayjs(itemDate)
                              .locale("pt-br")
                              .format("dddd, DD [de] MMMM")}
                          </span>
                          {item.clinicalArea?.name && (
                            <>
                              <span className="text-muted-foreground/30">
                                •
                              </span>
                              <span className="text-sm text-muted-foreground font-medium">
                                {item.clinicalArea.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {/* P2: Transaction type indicator */}
                      {/*<div*/}
                      {/*  className={cn(*/}
                      {/*    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",*/}
                      {/*    transactionType === "income"*/}
                      {/*      ? "text-emerald-600 bg-emerald-50"*/}
                      {/*      : "text-rose-600 bg-rose-50",*/}
                      {/*  )}*/}
                      {/*>*/}
                      {/*  {transactionType === "income" ? (*/}
                      {/*    <ArrowDownLeft className="w-3 h-3" />*/}
                      {/*  ) : (*/}
                      {/*    <ArrowUpRight className="w-3 h-3" />*/}
                      {/*  )}*/}
                      {/*  {transactionType === "income" ? "Receita" : "Despesa"}*/}
                      {/*</div>*/}

                      <span
                        className={cn(
                          "px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider",
                          statusColors[isReceived ? "received" : "pending"],
                        )}
                      >
                        {statusLabels[isReceived ? "received" : "pending"]}
                      </span>

                      <div className="text-right min-w-[120px]">
                        <p
                          className={cn(
                            "text-xl font-bold font-mono tracking-tight",
                            isReceived ? "text-emerald-600" : "text-foreground",
                          )}
                        >
                          {formatCurrency(amount, hideValues)}
                        </p>
                        <Chip
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          variant={
                            item.paymentMethod === "AV"
                              ? "purple"
                              : item.paymentMethod === "NR"
                                ? "green"
                                : "lime"
                          }
                        >
                          {formatPaymentMethod(item.paymentMethod)}
                        </Chip>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <WalletDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => setSelectedJob(null), 200);
        }}
        onUpdate={updateJob}
      />

      <WalletBulkEditModal
        isOpen={isBulkEditModalOpen}
        selectedCount={selectedItems.size}
        onClose={() => setIsBulkEditModalOpen(false)}
        onConfirm={handleBulkUpdate}
        isUpdatingBulk={isUpdatingBulk}
      />
    </div>
  );
}
