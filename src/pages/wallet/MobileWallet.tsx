import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowDown,
  ArrowUp,
  Stethoscope,
  Check,
  EyeOff,
  Eye,
  RotateCw,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useWalletData } from "@/hooks/wallet/useWalletData.ts";
import type { Job } from "@/types/api.types";
import { formatCurrency } from "@/utils/numberFormatter";
import { getJobDateInfo } from "@/utils/job.helper";
import { WalletDetailsModal } from "./WalletDetailsModal.tsx";
import { WalletBulkEditModal } from "./WalletBulkEditModal.tsx";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { MonthTabs } from "../transfers/components/MonthTabs";

type JobWithReceivedAt = Job & { receivedAt?: string | null };

export default function MobileWallet() {
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

    // Sort chronologically (oldest first to match app)
    return result.sort(
      (a, b) => getJobDateInfo(a).getTime() - getJobDateInfo(b).getTime(),
    );
  }, [allJobs, statusFilter, monthFilter, isJobInMonth]);

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

  // P10: Context menu handler for long-press/right-click selection
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

  // P3: Generate months — 12 past + 12 future (25 total)
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">
          Faça login para ver seus recebimentos
        </h2>
        <p className="text-muted-foreground">
          Você precisa estar autenticado para acessar esta página.
        </p>
      </div>
    );
  }

  const isAllSelected =
    filteredItems.length > 0 && selectedItems.size === filteredItems.length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background relative">
      {/* P5: Loading overlay during bulk edit */}
      <AnimatePresence>
        {isUpdatingBulk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center"
          >
            <div className="bg-card rounded-xl p-6 flex flex-col items-center gap-3 shadow-2xl border border-border">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Atualizando...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card px-4 py-4 border-b border-border shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-semibold capitalize text-foreground">
            {currentMonthLabel}
          </p>
          <div className="flex gap-2">
            {selectionMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={isAllSelected ? cancelSelection : selectAllItems}
                className="h-8 text-[10px] px-2 text-foreground font-medium hover:bg-muted/80"
              >
                {isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideValues(!hideValues)}
              className="h-8 w-8"
            >
              {hideValues ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={() =>
                selectionMode ? cancelSelection() : setSelectionMode(true)
              }
              className="h-8"
            >
              {selectionMode ? "Sair" : "Edição"}
            </Button>
          </div>
        </div>

        {/* Summary de totais */}
        <div className="grid grid-cols-3 gap-2 text-center mt-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
              Recebido
            </p>
            <p className="text-sm font-bold text-emerald-600 truncate">
              {formatCurrency(summary.totalReceived, hideValues)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
              A Receber
            </p>
            <p className="text-sm font-bold text-amber-600 truncate">
              {formatCurrency(
                summary.totalPending + summary.totalDelayed,
                hideValues,
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
              Total
            </p>
            <p className="text-sm font-bold text-foreground truncate">
              {formatCurrency(
                summary.totalReceived +
                  summary.totalPending +
                  summary.totalDelayed,
                hideValues,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* P6: Selection indicator */}
      <AnimatePresence>
        {selectionMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/5 border-b border-primary/20 px-2 py-2 text-xs text-primary font-medium"
          >
            Totais refletindo {selectedItems.size} ite
            {selectedItems.size === 1 ? "m" : "ns"} selecionado
            {selectedItems.size === 1 ? "" : "s"}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border-b border-border">
        {/* Filtros */}
        <div className="flex flex-col gap-3 px-2 py-3">
          <div className="flex items-center overflow-x-auto pb-1 no-scrollbar">
            <MonthTabs
              months={months}
              selectedMonth={monthFilter}
              onSelectMonth={(month, year) => {
                setMonthFilter({ month, year });
                cancelSelection();
              }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setStatusFilter(undefined)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                !statusFilter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("received")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors",
                statusFilter === "received"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-foreground",
              )}
            >
              <CheckCircle2 className="w-3 h-3" /> Recebidos
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors",
                statusFilter === "pending"
                  ? "bg-amber-600 text-white"
                  : "bg-muted text-foreground",
              )}
            >
              <Clock className="w-3 h-3" /> A Receber
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          // P9: Empty state with contextual actions
          <div className="flex flex-col items-center justify-center py-12 px-2 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-1">
              Nenhum recebimento
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {allJobs.length === 0
                ? "Adicione plantões com valor na agenda para acompanhar seus recebimentos."
                : "Não há itens correspondentes aos filtros selecionados neste mês."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {statusFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(undefined)}
                  className="gap-1.5 text-xs"
                >
                  <RotateCw className="w-3 h-3" />
                  Limpar filtro
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
                  className="gap-1.5 text-xs"
                >
                  <Calendar className="w-3 h-3" />
                  Mês atual
                </Button>
              )}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredItems.map((item, index) => {
              const isSelected = selectedItems.has(item.id);
              const isReceived = !!(item as JobWithReceivedAt).receivedAt;
              const itemDate = getJobDateInfo(item);
              const hasMultiple =
                item.additionalDates && item.additionalDates.length > 0;
              const amount = item.priceInCents ? item.priceInCents / 100 : 0;
              // P2: transaction type
              const transactionType = getTransactionType(item);
              // P8: showAsBlock
              const isBlock = Boolean(
                item.parentRef && item.singlePaymentForMutipleDates,
              );

              return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.02 }}
                  key={item.id}
                  onClick={() => {
                    if (selectionMode) {
                      toggleItemSelection(item.id);
                    } else {
                      setSelectedJob(item);
                      setIsModalOpen(true);
                    }
                  }}
                  // P10: right-click / long-press to enter selection
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                  className={cn(
                    "flex items-center gap-3 px-2 py-4 border-b border-border bg-card transition-colors",
                    selectionMode && "cursor-pointer hover:bg-secondary/50",
                    isSelected && "bg-primary/5 border-l-4 border-l-primary",
                    !isSelected && "border-l-4 border-l-transparent",
                  )}
                >
                  {selectionMode && (
                    <div
                      className="flex-shrink-0 mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemSelection(item.id);
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        className={cn("data-[state=checked]:bg-primary")}
                      />
                    </div>
                  )}

                  <div className="flex-shrink-0 bg-background/50 p-2 rounded-full">
                    {/* P2: Icon reflects transaction type */}
                    {transactionType === "income" ? (
                      <ArrowDown
                        className={cn(
                          "w-4 h-4",
                          isReceived ? "text-emerald-500" : "text-amber-500",
                        )}
                      />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-rose-500" />
                    )}
                  </div>

                  <div className="w-10 text-center flex-shrink-0">
                    <span className="text-lg font-bold text-foreground leading-tight">
                      {dayjs(itemDate).format("DD")}
                    </span>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {dayjs(itemDate).locale("pt-br").format("MMM")}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <h4 className="font-medium text-foreground text-sm truncate">
                        {item.modality?.name} - {item.place?.name}
                      </h4>
                      {/* P8: Block badge */}
                      {isBlock && (
                        <span className="text-[9px] font-bold text-primary/60 bg-primary/5 px-1 py-0.5 rounded whitespace-nowrap">
                          Pgto. Único
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        <Stethoscope className="w-3 h-3 inline mr-1 opacity-70" />
                        {item.clinicalArea &&
                        typeof item.clinicalArea === "object" &&
                        "name" in item.clinicalArea
                          ? (item.clinicalArea as { name: string }).name
                          : "Geral"}
                      </span>
                      {hasMultiple && (
                        <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-sm">
                          +{item.additionalDates!.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center gap-1.5 flex-shrink-0 pl-2">
                    <span
                      className={cn(
                        "font-bold text-sm",
                        transactionType === "expense"
                          ? "text-rose-600"
                          : isReceived
                            ? "text-emerald-600"
                            : "text-foreground",
                      )}
                    >
                      {transactionType === "expense" ? "- " : ""}
                      {formatCurrency(amount, hideValues)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {selectionMode && selectedItems.size > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-20 left-4 right-4 bg-foreground rounded-2xl shadow-xl p-3 flex items-center justify-between text-background z-50 border border-border/10"
        >
          <div className="px-3 text-sm font-semibold flex items-center gap-2">
            <div className="bg-background text-foreground w-6 h-6 flex items-center justify-center rounded-full text-xs">
              {selectedItems.size}
            </div>
            selecionados
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-9 rounded-xl px-6 bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={() => setIsBulkEditModalOpen(true)}
              disabled={isUpdatingBulk}
            >
              {isUpdatingBulk ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
              )}{" "}
              Editar
            </Button>
          </div>
        </motion.div>
      )}

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
