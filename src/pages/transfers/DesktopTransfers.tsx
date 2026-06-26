import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/Chip";
import type { Job } from "@/config/types";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useTransfersData } from "@/hooks/transfers/useTransfersData.ts";
import { cn } from "@/lib/utils";
import { formatPaymentMethod, getJobDateInfo } from "@/utils/job.helper";
import { formatCurrency } from "@/utils/numberFormatter";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  TrendingUp
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MonthTabs } from "./components/MonthTabs";
import { TransfersBulkEditModal } from "./TransfersBulkEditModal.tsx";
import { TransfersDetailsModal } from "./TransfersDetailsModal.tsx";
import { statusColors, statusLabels } from "./utils/constants.ts";
// P1: conectar ao useFiltersStore para filtros customizados
import { useFiltersStore } from "@/services/filters/store";
import {
  CoreJobFilter,
  getDefaultTransferFilters,
} from "@/services/jobs/utils/formatJob.ts";

type JobWithPaidAt = Job & { paidAt?: string | null };

export default function DesktopTransfers() {
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


  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedJob, setSelectedJob] = useState<any>(null);
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

  // Converte monthFilter {month, year} → Date para o hook (betweenDates filtra na API por este mês)
  const selectedMonthDate = useMemo(
    () => new Date(monthFilter.year, monthFilter.month, 1),
    [monthFilter.month, monthFilter.year],
  );

  const { allJobs, loading, updateJob, updateJobsBulk, getSummary, refetch } =
    useTransfersData(externalFilter, selectedMonthDate);

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

  // P1+P2: filteredItems aplica TODAS as condições obrigatórias de transfer
  const filteredItems = useMemo(() => {
    let result = allJobs;

    // Filtrar por mês + condições obrigatórias de transfer
    if (monthFilter) {
      result = result.filter((item) => {
        const jobHasTo = !!item?.to;
        const jobVisibility = item?.visibility;

        if (!jobHasTo) return false;
        if (jobVisibility === "PRIVATE") return false;

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

    // Sort cronológico
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

  // P2: summary calculado sobre filteredItems (com todas condições), não allJobs filtrado só por mês
  const summary = useMemo(() => {
    const itemsToSum =
      selectionMode && selectedItems.size > 0
        ? filteredItems.filter((j) => selectedItems.has(j.id))
        : filteredItems;

    return getSummary(itemsToSum);
  }, [filteredItems, selectionMode, selectedItems, getSummary]);

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

  // P4: gerar 25 meses (12 passados + atual + 12 futuros)
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
        <ArrowLeftRight className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Faça login para ver suas transferências
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
              Atualizando transferências...
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="page-header mb-0">
            <h1 className="page-title">Transferências</h1>
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
            variant="outline"
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
              <p className="text-sm text-muted-foreground">Pago</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.paidIncome, hideValues)}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.paidCount} itens
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
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(summary.pendingIncome, hideValues)}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.pendingCount} itens
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
                {formatCurrency(summary.totalIncome, hideValues)}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.totalCount} itens
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
            {/* P4: Abas de Meses substituindo o Select */}
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
            {/* Filtro de status (pago/pendente) — mantido como está */}
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
                    statusFilter === "paid" &&
                      "bg-background shadow-sm text-emerald-600",
                  )}
                  onClick={() => setStatusFilter("paid")}
                >
                  Pago
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
                  Pendente
                </Button>
              </div>
            </div>

            {/* //TODO: Futuro */}
            {/* P1: chips de filtros customizados */}
            {/*{availableFilters*/}
            {/*  .filter(*/}
            {/*    (f) =>*/}
            {/*      f.id !== "transfer-paid" && f.id !== "transfer-pending",*/}
            {/*  )*/}
            {/*  .map((f) => {*/}
            {/*    const fId = f.id || f.title;*/}
            {/*    const isActive =*/}
            {/*      (localSelectedFilterId || selectedFilterId) === fId;*/}
            {/*    return (*/}
            {/*      <Button*/}
            {/*        key={fId}*/}
            {/*        variant={isActive ? "default" : "outline"}*/}
            {/*        size="sm"*/}
            {/*        className={cn(*/}
            {/*          "gap-1.5 font-medium transition-all",*/}
            {/*          isActive &&*/}
            {/*            "bg-primary text-primary-foreground hover:bg-primary/90",*/}
            {/*        )}*/}
            {/*        onClick={() => onFilterChange(f)}*/}
            {/*      >*/}
            {/*        <Filter className="w-3 h-3" />*/}
            {/*        {f.title}*/}
            {/*      </Button>*/}
            {/*    );*/}
            {/*  })}*/}

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
                      "gap-2 font-medium",
                      selectionMode &&
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
              >
                {selectionMode ? "Sair da Seleção" : "Edição em Lote"}
              </Button>
            </div>
          </div>
        </div>

      </motion.div>

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
              Carregando transferências...
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-background/50 flex items-center justify-center mb-6">
              <ArrowLeftRight className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhuma transferência encontrada
            </h3>
            <p className="text-muted-foreground max-w-md">
              {allJobs.length === 0
                ? "As transferências aparecerão aqui quando você fazer transferências para outros profissionais."
                : "Não há itens correspondentes aos filtros selecionados neste mês."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 bg-background">
            <AnimatePresence>
              {filteredItems.map((item, index) => {
                const isSelected = selectedItems.has(item.id);
                const isPaid = !!(item as JobWithPaidAt).paidAt;
                const itemDate = getJobDateInfo(item);
                const amount = item.priceInCents ? item.priceInCents / 100 : 0;
                const modalityName =
                  typeof item.modality === "object"
                    ? (item.modality as any).name
                    : item.modality;

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
                    className={cn(
                      "p-5 flex items-center justify-between transition-all group cursor-pointer bg-card hover:bg-muted/40",
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
                          isSelected && "ring-2 ring-primary ring-offset-2",
                          isPaid
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
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="font-semibold text-foreground text-base tracking-tight">
                            {modalityName} -{" "}
                            {(item.place as any)?.name || item.place}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            {isPaid ? (
                              <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {dayjs(itemDate)
                              .locale("pt-br")
                              .format("dddd, DD [de] MMMM")}
                          </span>
                          {item.to && (
                            <>
                              <span className="text-muted-foreground/30">
                                •
                              </span>
                              <span className="text-sm text-muted-foreground font-medium">
                                Para:{" "}
                                {typeof item.to === "string"
                                  ? item.to
                                  : (item.to as any).name ||
                                    (item.to as any).email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <span
                        className={cn(
                          "px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider",
                          statusColors[isPaid ? "paid" : "pending"],
                        )}
                      >
                        {statusLabels[isPaid ? "paid" : "pending"]}
                      </span>

                      <div className="text-right min-w-[120px]">
                        <p
                          className={cn(
                            "text-xl font-bold font-mono tracking-tight",
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

      <TransfersDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => setSelectedJob(null), 200);
        }}
        onUpdate={updateJob}
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
