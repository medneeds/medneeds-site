import { useState, useCallback, useMemo, useEffect } from "react";
import {
  CoreJobFilter,
  JobBlockFilter,
  getDefaultTransferFilters,
  formatJobFitlerToWhereClause,
} from "@/services/jobs/utils/formatJob.ts";
import type { Job } from "@/config/types.ts";
import dayjs from "dayjs";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { jobService } from "@/config/app";

// O hook aceita:
// - externalFilter: filtro customizado do store (ex: filtros de tipo "transfer")
// - selectedMonth: o mês selecionado pelo usuário — betweenDates filtra NA API por este mês
//   (igual ao app: cada mudança de mês dispara um novo fetch, não filtragem no frontend)
export function useTransfersData(
  externalFilter?: CoreJobFilter | null,
  selectedMonth?: Date,
) {
  const { user } = useAuthContext();

  const [activeFilterId, setActiveFilterId] = useState<string | undefined>(
    undefined,
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtém os filtros padrões de Transferências (para exposição externa)
  const availableFilters = useMemo(() => {
    if (!user?.id) return [];
    return getDefaultTransferFilters(user.id);
  }, [user?.id]);

  // Calcula o range de datas para o mês selecionado
  // ⚠️ Igual ao app: betweenDates = startOf/endOf do MÊS SELECIONADO
  // O filtro acontece na API, não no frontend — garante resultados idênticos ao app
  const effectiveDateRange = useMemo((): [Date, Date] => {
    const month = selectedMonth || new Date();
    const start = dayjs(month).startOf("month").toDate();
    const end = dayjs(month).endOf("month").toDate();
    return [start, end];
  }, [selectedMonth]);

  // Constrói o filtro efetivo a ser enviado à API
  //
  // ⚠️ IMPORTANTE: cada condição deve ser um bloco SEPARADO no array.
  // O `formatJobFitlerToWhereClause` processa cada item do array conditions
  // em um único bloco de WHERE. Se `betweenDates` estiver junto com `inFrom`
  // no mesmo objeto, o processador cria `block.or` (para as datas) e sobrescreve
  // `block.from` — perdendo o filtro de usuário na cláusula enviada à API.
  const buildEffectiveFilter = useCallback(
    (userId: string): CoreJobFilter => {
      const [startDate, endDate] = effectiveDateRange;

      // Condições obrigatórias
      const mandatoryConditions: CoreJobFilter["conditions"] = [
        { existsTo: true } as JobBlockFilter,
        { visibilityNotEquals: "PRIVATE" } as JobBlockFilter,
      ];

      // Filtro com filtro externo passado por fora (ex: filtro customizado do store)
      if (externalFilter) {
        return {
          title: externalFilter.title,
          type: "transfer",
          conjunction: "and",
          conditions: [
            ...externalFilter.conditions,
            ...mandatoryConditions,
          ].map(condition => ({
            ...(condition as object),
            betweenDates: [startDate, endDate],
          })) as CoreJobFilter["conditions"],
        } as CoreJobFilter;
      }

      // Filtro padrão — sem filtro externo
      return {
        title: "Todas as transferências",
        type: "transfer",
        conjunction: "and",
        conditions: [
          { inFrom: [userId] } as JobBlockFilter,
          ...mandatoryConditions,
        ].map(condition => ({
          ...(condition as object),
          betweenDates: [startDate, endDate],
        })) as CoreJobFilter["conditions"],
      } as CoreJobFilter;
    },
    [externalFilter, effectiveDateRange],
  );

  // Função central para buscar os jobs
  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const filterToApply = buildEffectiveFilter(user.id);
      const whereClause = formatJobFitlerToWhereClause(filterToApply);
      const result = await jobService.getJobs({
        where: whereClause,
        page: 1,
        limit: 300,
      });

      setJobs(result.docs);
    } catch (error) {
      console.error("[useTransfersData] Erro ao carregar jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, buildEffectiveFilter]);

  // Inicializa buscando os dados
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // P3: atualização otimista RETORNA função de rollback
  const updateJobOptimistically = useCallback(
    (jobId: string, updates: Partial<Job>): (() => void) => {
      let previousJobs: Job[] = [];

      setJobs((prevJobs) => {
        // Salvar snapshot para rollback
        previousJobs = prevJobs;

        const jobBeingUpdated = prevJobs.find((j) => j.id === jobId);

        return prevJobs.map((job) => {
          if (job.id === jobId) {
            return { ...job, ...updates } as Job;
          }

          // Família de jobs (singlePaymentForMutipleDates)
          if (
            jobBeingUpdated &&
            jobBeingUpdated.singlePaymentForMutipleDates &&
            updates.paidAt !== undefined
          ) {
            if (!jobBeingUpdated.parentRef) {
              if (job.parentRef === jobId) {
                return { ...job, paidAt: updates.paidAt } as Job;
              }
            } else {
              const parentId = jobBeingUpdated.parentRef;
              if (job.id === parentId || job.parentRef === parentId) {
                return { ...job, paidAt: updates.paidAt } as Job;
              }
            }
          }
          return job;
        });
      });

      // Rollback imediato ao snapshot anterior
      return () => {
        setJobs(previousJobs);
      };
    },
    [],
  );

  const updateJob = useCallback(
    async (jobId: string, updates: Partial<Job>) => {
      const jobToUpdate = jobs.find((j) => j.id === jobId);

      // P3: capturar rollback antes de aplicar otimismo
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
              jobService.updateJob(job.id, { paidAt: updates.paidAt }),
            ),
          );
        } else {
          await jobService.updateJob(jobId, updates);
        }
      } catch (error) {
        console.error("[useTransfersData] Erro ao atualizar job:", error);
        // P3: rollback imediato em caso de erro
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

      // P3: coletar rollbacks de todas as atualizações otimistas
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
        console.error(
          "[useTransfersData] Erro ao atualizar jobs em lote:",
          error,
        );
        // P3: rollback de todos em caso de erro
        rollbackFunctions.forEach((r) => r());
      }
    },
    [jobs, updateJobOptimistically],
  );

  const getSummary = useCallback((currentMonthJobs: Job[]) => {
    const jobsWithValue = currentMonthJobs.filter((job) => {
      if (job.parentRef && job.singlePaymentForMutipleDates) return false;
      const amount = job.priceInCents ? job.priceInCents / 100 : 0;
      return amount > 0;
    });

    const paidJobs = jobsWithValue.filter((j) => !!j.paidAt);
    const pendingJobs = jobsWithValue.filter((j) => !j.paidAt);

    const totalIncome = jobsWithValue.reduce(
      (acc, j) => acc + (j.priceInCents ? j.priceInCents / 100 : 0),
      0,
    );
    const paidIncome = paidJobs.reduce(
      (acc, j) => acc + (j.priceInCents ? j.priceInCents / 100 : 0),
      0,
    );
    const pendingIncome = pendingJobs.reduce(
      (acc, j) => acc + (j.priceInCents ? j.priceInCents / 100 : 0),
      0,
    );

    return {
      totalIncome,
      paidIncome,
      pendingIncome,
      totalCount: jobsWithValue.length,
      paidCount: paidJobs.length,
      pendingCount: pendingJobs.length,
    };
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
    setActiveFilterId,
  };
}
