import { useState, useCallback, useMemo, useEffect } from "react";
import { jobService } from "@/config/app";
import {
  CoreJobFilter,
  getDefaultPaymentFilters,
  formatJobFitlerToWhereClause,
} from "@/services/jobs/utils/formatJob.ts";
import type { Job } from "@/types/api.types.ts";
import dayjs from "dayjs";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useFiltersStore } from "@/services/filters/store/store.ts";

export function useWalletData() {
  const { user } = useAuthContext();

  const {
    filters,
    loadFilters,
    shouldRefreshFeed,
    lastSavedFilter,
    clearRefreshFlag,
  } = useFiltersStore();

  const [activeFilter, setActiveFilter] = useState<CoreJobFilter | null>(null);
  const [activeFilterId, setActiveFilterId] = useState<string | undefined>(
    undefined,
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtém os filtros padrões + customizados de Recebimentos
  const availableFilters = useMemo(() => {
    if (!user?.id) return [];
    const defaultFilters = getDefaultPaymentFilters(user.id);
    const customFilters = filters.filter((f) => f.type === "payments");
    return [...defaultFilters, ...customFilters];
  }, [user?.id, filters]);

  // Carregar filtros na inicialização
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Definir filtro inicial quando os filtros são carregados
  useEffect(() => {
    if (availableFilters.length > 0 && !activeFilter) {
      const initialFilter = availableFilters[0];
      setActiveFilter(initialFilter);
      setActiveFilterId(initialFilter.id || initialFilter.title);
    }
  }, [availableFilters, activeFilter]);

  // Observar mudanças na store para atualizar automaticamente
  useEffect(() => {
    if (shouldRefreshFeed && lastSavedFilter) {
      if (lastSavedFilter === "REMOVED") {
        if (availableFilters.length > 0) {
          setActiveFilter(availableFilters[0]);
          setActiveFilterId(
            availableFilters[0].id || availableFilters[0].title,
          );
        }
      } else {
        const newFilter = availableFilters.find(
          (f) => f.id === lastSavedFilter,
        );
        if (newFilter) {
          setActiveFilter(newFilter);
          setActiveFilterId(newFilter.id || newFilter.title);
        }
      }
      clearRefreshFlag();
    }
  }, [shouldRefreshFeed, lastSavedFilter, availableFilters, clearRefreshFlag]);

  // Função central para buscar os jobs usando o filtro ativo
  const fetchJobs = useCallback(
    async (filterOverride?: CoreJobFilter) => {
      if (!user?.id) return;

      const filterToUse = filterOverride || activeFilter;
      if (!filterToUse) return;

      setLoading(true);
      try {
        const startDate = dayjs()
          .subtract(6, "months")
          .startOf("month")
          .toDate();
        const endDate = dayjs().add(12, "months").endOf("month").toDate();

        const filterWithDates: CoreJobFilter = {
          ...filterToUse,
          conditions: filterToUse.conditions.map((condition) => ({
            ...condition,
            betweenDates: [startDate, endDate],
          })) as CoreJobFilter["conditions"],
        };

        const whereClause = formatJobFitlerToWhereClause(filterWithDates);
        const result = await jobService.getJobs({
          where: whereClause,
          page: 1,
          limit: 1000,
        });

        setJobs(result.docs);
      } catch (error) {
        console.error("[useWalletData] Erro ao carregar jobs:", error);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, activeFilter],
  );

  // Recarregar quando o filtro ativo muda
  useEffect(() => {
    if (activeFilter) {
      fetchJobs(activeFilter);
    }
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualização otimista com rollback
  const updateJobOptimistically = useCallback(
    (jobId: string, updates: Partial<Job>) => {
      let previousJobs: Job[] = [];

      setJobs((prevJobs) => {
        previousJobs = [...prevJobs];
        const jobBeingUpdated = prevJobs.find((j) => j.id === jobId);

        return prevJobs.map((job) => {
          if (job.id === jobId) {
            return { ...job, ...updates } as Job;
          }

          // Single payment update logic para jobs com multiple dates (família)
          if (
            jobBeingUpdated &&
            jobBeingUpdated.singlePaymentForMutipleDates &&
            updates.receivedAt !== undefined
          ) {
            if (!jobBeingUpdated.parentRef) {
              // é pai
              if (job.parentRef === jobId) {
                return { ...job, receivedAt: updates.receivedAt } as Job;
              }
            } else {
              // é filho
              const parentId = jobBeingUpdated.parentRef;
              if (job.id === parentId || job.parentRef === parentId) {
                return { ...job, receivedAt: updates.receivedAt } as Job;
              }
            }
          }
          return job;
        });
      });

      // Retornar função de rollback
      return () => {
        setJobs(previousJobs);
      };
    },
    [],
  );

  const updateJob = useCallback(
    async (jobId: string, updates: Partial<Job>) => {
      const jobToUpdate = jobs.find((j) => j.id === jobId);

      // Otimista (com rollback)
      const rollback = updateJobOptimistically(jobId, updates);

      try {
        if (jobToUpdate?.singlePaymentForMutipleDates) {
          const jobsToUpdate = jobs.filter((job) => {
            if (!jobToUpdate.parentRef) {
              return job.id === jobId || job.parentRef === jobId;
            } else {
              const parentId = jobToUpdate.parentRef;
              return job.id === parentId || job.parentRef === parentId;
            }
          });

          await Promise.all(
            jobsToUpdate.map((job) =>
              jobService.updateJob(job.id, { receivedAt: updates.receivedAt }),
            ),
          );
        } else {
          await jobService.updateJob(jobId, updates);
        }
      } catch (error) {
        console.error("[useWalletData] Erro ao atualizar job:", error);
        rollback();
      }
    },
    [jobs, updateJobOptimistically],
  );

  const updateJobsBulk = useCallback(
    async (jobIds: string[], updates: Partial<Job>) => {
      const relatedJobIds = new Set<string>();

      jobIds.forEach((id) => {
        relatedJobIds.add(id);
        const job = jobs.find((j) => j.id === id);
        if (job?.singlePaymentForMutipleDates) {
          if (!job.parentRef) {
            jobs
              .filter((j) => j.parentRef === job.id)
              .forEach((j) => relatedJobIds.add(j.id));
          } else {
            relatedJobIds.add(job.parentRef);
            jobs
              .filter((j) => j.parentRef === job.parentRef)
              .forEach((j) => relatedJobIds.add(j.id));
          }
        }
      });

      const finalIdsToUpdate = Array.from(relatedJobIds);

      // Otimista com rollback
      const rollbackFunctions: Array<() => void> = [];
      finalIdsToUpdate.forEach((id) => {
        const rollback = updateJobOptimistically(id, updates);
        rollbackFunctions.push(rollback);
      });

      try {
        await Promise.all(
          finalIdsToUpdate.map((id) => jobService.updateJob(id, updates)),
        );
      } catch (error) {
        console.error("[useWalletData] Erro ao atualizar jobs em lote:", error);
        // Rollback em caso de erro
        rollbackFunctions.forEach((rollback) => rollback());
        throw error; // Re-throw para que o consumer saiba que falhou
      }
    },
    [jobs, updateJobOptimistically],
  );

  // Calcula sumarização baseada no mês e filtro localmente
  const getSummary = useCallback((currentMonthJobs: Job[]) => {
    const jobsWithValue = currentMonthJobs.filter((job) => {
      if (job.parentRef && job.singlePaymentForMutipleDates) return false;
      const amount = job.priceInCents ? job.priceInCents / 100 : 0;
      return amount > 0;
    });

    const receivedJobs = jobsWithValue.filter((j) => !!j.receivedAt);
    const pendingJobs = jobsWithValue.filter((j) => !j.receivedAt);

    const totalReceived = receivedJobs.reduce(
      (acc, j) => acc + (j.priceInCents ? j.priceInCents / 100 : 0),
      0,
    );
    const totalPending = pendingJobs.reduce(
      (acc, j) => acc + (j.priceInCents ? j.priceInCents / 100 : 0),
      0,
    );

    return {
      totalReceived,
      totalPending,
      totalDelayed: 0,
      countReceived: receivedJobs.length,
      countPending: pendingJobs.length,
      countDelayed: 0,
    };
  }, []);

  // Função para trocar o filtro ativo
  const handleFilterChange = useCallback((newFilter: CoreJobFilter) => {
    const filterId = newFilter.id || newFilter.title;
    setActiveFilter(newFilter);
    setActiveFilterId(filterId);
  }, []);

  return {
    allJobs: jobs,
    loading,
    refetch: fetchJobs,
    updateJob,
    updateJobsBulk,
    getSummary,
    availableFilters,
    activeFilterId,
    setActiveFilterId: handleFilterChange,
    activeFilter,
  };
}
