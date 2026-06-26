import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  TrendingUp,
  Filter,
  Clock,
  Loader2,
  Calendar,
  Check,
  CheckCircle2,
  EyeOff,
  Eye,
  Menu,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useTransfersData } from "@/hooks/transfers/useTransfersData.ts";
import type { Job } from "@/config/types";
import { formatCurrency } from "@/utils/numberFormatter";
import { getJobDateInfo } from "@/utils/job.helper";
import { statusColors, statusLabels } from "./utils/constants.ts";
import { TransfersDetailsModal } from "./TransfersDetailsModal.tsx";
import { TransfersBulkEditModal } from "./TransfersBulkEditModal.tsx";
import { Chip } from "@/components/ui/Chip";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { MonthTabs } from "./components/MonthTabs";
// P1: conectar ao useFiltersStore para filtros customizados
import { useFiltersStore } from "@/services/filters/store";
import {
  CoreJobFilter,
  getDefaultTransferFilters,
} from "@/services/jobs/utils/formatJob.ts";

type JobWithPaidAt = Job & { paidAt?: string | null };

export default function MobileTransfers() {
  const { user } = useAuthContext();

  // P1: estado de filtros
  const {
    filters: storeFilters,
    loadFilters,
    shouldRefreshFeed,
    lastSavedFilter,
    clearRefreshFlag,
  } = useFiltersStore();

  // P1: combinar filtros padrão + customizados de tipo "transfer"
  const availableFilters = useMemo(() => {
    if (!user?.id) return [];
    const defaultFilters = getDefaultTransferFilters(user.id);
    const customFilters = storeFilters.filter((f) => f.type === "transfer");
    return [...defaultFilters, ...customFilters];
  }, [user?.id, storeFilters]);

  // P1: dois estados separados — filtro de API vs filtro de UI (pago/pendente)
  const [externalFilter, setExternalFilter] = useState<CoreJobFilter | null>(
    null,
  );
  const [selectedFilterId, setSelectedFilterId] = useState<string | undefined>(
    undefined,
  );
  const [localSelectedFilterId, setLocalSelectedFilterId] = useState<
    string | undefined
  >(undefined);

  // Initialize with current month — declarado antes do hook para selectedMonthDate ser reativo
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState<{
    month: number;
    year: number;
  }>({
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  // selectedMonthDate reativo — muda de mês dispara novo fetch na API
  const selectedMonthDate = useMemo(
    () => new Date(monthFilter.year, monthFilter.month, 1),
    [monthFilter.month, monthFilter.year],
  );

  const { allJobs, loading, updateJob, updateJobsBulk, getSummary, refetch } =
    useTransfersData(externalFilter, selectedMonthDate);

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  const [hideValues, setHideValues] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  // P1: carregar filtros ao montar
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // P1: reagir a mudanças na store (filtros customizados criados/removidos)
  useEffect(() => {
    if (shouldRefreshFeed && lastSavedFilter) {
      if (lastSavedFilter === "REMOVED") {
        // Filtro removido — voltar ao padrão
        setExternalFilter(null);
        setSelectedFilterId(undefined);
        setLocalSelectedFilterId(undefined);
      } else {
        const newFilter = availableFilters.find(
          (f) => f.id === lastSavedFilter,
        );
        if (newFilter) {
          setExternalFilter(newFilter);
          setSelectedFilterId(newFilter.id || newFilter.title);
        }
      }
      clearRefreshFlag();
    }
  }, [shouldRefreshFeed, lastSavedFilter, availableFilters, clearRefreshFlag]);

  // P1: lógica de seleção de filtro (igual ao app — toggle, UI vs API)
  const onFilterChange = useCallback(
    (newFilter: CoreJobFilter) => {
      setSelectionMode(false);
      setSelectedItems(new Set());

      const newFilterId = newFilter.id || newFilter.title;
      const currentFilterId = localSelectedFilterId || selectedFilterId;

      const isUIFilter =
        newFilterId === "transfer-paid" || newFilterId === "transfer-pending";

      if (currentFilterId === newFilterId) {
        // Toggle off
        setLocalSelectedFilterId(undefined);
        setSelectedFilterId(undefined);
        setExternalFilter(null);
        if (!isUIFilter) refetch();
      } else {
        if (isUIFilter) {
          if (
            externalFilter &&
            externalFilter.id !== "transfer-paid" &&
            externalFilter.id !== "transfer-pending"
          ) {
            // Havia filtro customizado ativo — recarregar com padrão
            const defaultFilter =
              availableFilters.find((f) => f.id === newFilterId) ||
              availableFilters[0];
            setExternalFilter(defaultFilter);
            setSelectedFilterId(defaultFilter.id || defaultFilter.title);
            setTimeout(() => setLocalSelectedFilterId(newFilterId), 100);
          } else {
            setLocalSelectedFilterId(newFilterId);
          }
        } else {
          // Filtro customizado — buscar da API
          setLocalSelectedFilterId(undefined);
          setExternalFilter(newFilter);
          setSelectedFilterId(newFilterId);
        }
      }
    },
    [
      localSelectedFilterId,
      selectedFilterId,
      externalFilter,
      availableFilters,
      refetch,
    ],
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

  const filteredItems = useMemo(() => {
    let result = allJobs;
    // Filter by month
    if (monthFilter) {
      result = result.filter((item) => {
        // Lógica extraída do 'buildFilter' e filterJobsForMonth do app
        const jobHasTo = !!item?.to;
        const jobVisibility = item?.visibility;

        // Condições obrigatórias para transfers
        if (!jobHasTo) return false;
        if (jobVisibility === "PRIVATE") return false;

        // Filtro padrão de inFrom
        const fromId =
          typeof item.from === "string" ? item.from : item.from?.id;
        if (fromId !== user?.id) return false;

        return isJobInMonth(item, monthFilter.month, monthFilter.year);
      });
    }

    // P1: filtro de UI (pago/pendente) via localSelectedFilterId
    const activeUIFilter = localSelectedFilterId || statusFilter;
    if (activeUIFilter === "transfer-paid" || activeUIFilter === "paid") {
      result = result.filter((item) => !!(item as JobWithPaidAt).paidAt);
    } else if (
      activeUIFilter === "transfer-pending" ||
      activeUIFilter === "pending"
    ) {
      result = result.filter((item) => !(item as JobWithPaidAt).paidAt);
    }

    // Sort chronologically (newest first)
    return [...result].sort(
      (a, b) => getJobDateInfo(a).getTime() - getJobDateInfo(b).getTime(),
    );
  }, [
    allJobs,
    statusFilter,
    localSelectedFilterId,
    monthFilter,
    isJobInMonth,
    user?.id,
  ]);

  const isAllSelected =
    filteredItems.length > 0 && selectedItems.size === filteredItems.length;

  // P2: summary calculado sobre filteredItems (com todos os filtros aplicados)
  const summary = useMemo(() => {
    const itemsToSum =
      selectionMode && selectedItems.size > 0
        ? filteredItems.filter((j) => selectedItems.has(j.id))
        : filteredItems;

    return getSummary(itemsToSum);
  }, [selectionMode, selectedItems, filteredItems, getSummary]);

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

  const handleBulkUpdate = async (isPaid: boolean, date: string | null) => {
    if (selectedItems.size === 0) return;
    setIsUpdatingBulk(true);
    await updateJobsBulk(Array.from(selectedItems), {
      paidAt: date,
    });
    setIsUpdatingBulk(false);
    setIsBulkEditModalOpen(false);
    cancelSelection();
  };

  // P4: gerar 25 meses (−12 a +12)
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
      <div className="flex flex-col items-center justify-center p-8 text-center h-[50vh]">
        <ArrowLeftRight className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Faça login para ver suas transferências
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full relative overflow-hidden bg-background">
      {/* P5: Overlay bloqueante durante edição em lote */}
      {isUpdatingBulk && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-2xl p-6 flex flex-col items-center gap-3 min-w-[180px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-medium text-foreground text-center">
              Atualizando...
            </p>
          </div>
        </div>
      )}
      {/* Barra de Resumo */}
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

        {/* Filtros em dispositivos móveis */}
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
              onClick={() => setStatusFilter("paid")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors",
                statusFilter === "paid"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-foreground",
              )}
            >
              <CheckCircle2 className="w-3 h-3" /> Pago
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
              <Clock className="w-3 h-3" /> Pendente
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mt-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
              Pagas
            </p>
            <p className="text-sm font-bold text-emerald-600 truncate">
              {formatCurrency(summary.paidIncome, hideValues)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
              Pendente
            </p>
            <p className="text-sm font-bold text-amber-600 truncate">
              {formatCurrency(summary.pendingIncome, hideValues)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">
              Total
            </p>
            <p className="text-sm font-bold text-foreground truncate">
              {formatCurrency(summary.totalIncome, hideValues)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            <p className="mt-2 text-xs text-muted-foreground">
              Buscando transferências...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma transferência este mês
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const isPaid = !!(item as JobWithPaidAt).paidAt;
              const itemDate = getJobDateInfo(item);
              const modalityName =
                typeof item.modality === "object"
                  ? (item.modality as any).name
                  : item.modality;
              const placeName = (item.place as any)?.name || item.place;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (selectionMode) {
                      toggleItemSelection(item.id);
                    } else {
                      setSelectedJob(item);
                      setIsModalOpen(true);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-2 py-4 border-b border-border bg-card transition-colors",
                    isSelected && "bg-primary/5 border-l-4 border-l-primary",
                    !isSelected && "border-l-4 border-l-transparent",
                  )}
                >
                  {selectionMode && (
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={isSelected}
                        className="w-5 h-5 rounded-md"
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 bg-foreground text-secondary-foreground",
                    )}
                  >
                    <span className="text-[9px] font-bold uppercase leading-none mb-0.5">
                      {dayjs(itemDate).locale("pt-br").format("MMM")}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {dayjs(itemDate).format("DD")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex flex-col min-w-0 truncate mr-2">
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {modalityName}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          {isPaid ? (
                            <TrendingUp className="w-3 h-3 text-red-500" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {dayjs(itemDate).locale("pt-br").format("ddd, DD/MM")}
                        </div>
                      </div>
                      <p className={cn("text-sm font-bold shrink-0 font-mono")}>
                        {formatCurrency(
                          item.priceInCents ? item.priceInCents / 100 : 0,
                          hideValues,
                        )}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground truncate italic flex-1">
                        {placeName}
                      </p>
                      <Chip
                        className="text-[10px] h-4 px-1.5"
                        variant={
                          item.paymentMethod === "AV"
                            ? "purple"
                            : item.paymentMethod === "NR"
                              ? "green"
                              : "lime"
                        }
                      >
                        {item.paymentMethod}
                      </Chip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectionMode && selectedItems.size > 0 && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="fixed bottom-[65px] left-0 right-0 px-4 py-3 bg-foreground text-background flex items-center justify-between z-40 border-t border-white/10"
          >
            <p className="text-sm font-bold">
              {selectedItems.size}{" "}
              {selectedItems.size === 1 ? "selecionado" : "selecionados"}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelSelection}
                className="text-background/70 h-8"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-emerald-500 text-white hover:bg-emerald-600 h-8"
                onClick={() => setIsBulkEditModalOpen(true)}
              >
                Editar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TransfersDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => setSelectedJob(null), 200);
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate={updateJob as any}
      />

      <TransfersBulkEditModal
        isOpen={isBulkEditModalOpen}
        selectedCount={selectedItems.size}
        onClose={() => setIsBulkEditModalOpen(false)}
        onConfirm={handleBulkUpdate}
        isUpdatingBulk={isUpdatingBulk}
      />
    </div>
  );
}
