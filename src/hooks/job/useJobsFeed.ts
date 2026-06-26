import { useState, useCallback, useEffect, useRef } from "react";
import type { Where } from "payload";
import { Job } from "@/config/types.ts";
import { jobService } from "@/config/app.ts";
import {
  formatJobAsCardItem,
  JobCardItem,
  formatJobFitlerToWhereClause,
} from "@/services/jobs/utils/formatJob.ts";
import { useFiltersStore } from "@/services/filters/store/store.ts";

const PAGE_SIZE = 50;

/**
 * Constrói a base do `Where` para buscar jobs de acordo com a lógica do mobile
 */
function getJobWhereClause(
  now: string,
  isPast: boolean,
  activeFilter?: any,
): Where {
  const isMyJobsFilter =
    activeFilter?.id === "my-jobs" ||
    (typeof activeFilter?.title === "string" &&
      activeFilter.title.trim().toLowerCase() === "suas");
  const isAvailableJobsFilter = activeFilter?.id === "available-jobs";
  const hasDateRange = activeFilter?.conditions?.some(
    (c: any) => c && "betweenDates" in c && c.betweenDates,
  );

  const baseAnd: any[] = [
    { visibility: { not_equals: "PRIVATE" } },
    ...(isMyJobsFilter ? [] : [{ to: { exists: false } }]),
    {
      or: [
        { singlePaymentForMutipleDates: { equals: false } },
        { singlePaymentForMutipleDates: { exists: false } },
        {
          and: [
            { parentRef: { exists: false } },
            { singlePaymentForMutipleDates: { equals: true } },
          ],
        },
      ],
    },
  ];

  if (!isMyJobsFilter) {
    baseAnd.push({ visibility: { not_equals: "UNLISTED" } });
  }

  if (isPast) {
    baseAnd.push({ startDateTime: { less_than: now } });
    baseAnd.push({ parentRef: { exists: false } });
  } else {
    // Para séries/pacotes: se o job principal é passado mas tem filhos futuros,
    // o Payload deve retornar se filtrarmos por startDateTime >= now OU se algum additionalDate >= now
    // No entanto, o baseAnd aqui é restritivo.

    if (hasDateRange) {
      // Se tem range de data, o formatJobFitlerToWhereClause já cuida do OR entre principal e additionalDates
      // Então não injetamos startDateTime aqui para não conflitar
    } else {
      baseAnd.push({
        or: [
          { startDateTime: { greater_than_equal: now } },
          { "additionalDates.date": { greater_than_equal: now } },
        ],
      });
      baseAnd.push({ parentRef: { exists: false } });
    }
  }

  if (activeFilter) {
    const filterWhere = formatJobFitlerToWhereClause(activeFilter);
    if (filterWhere && Object.keys(filterWhere).length > 0) {
      baseAnd.push(filterWhere);
    }
  }

  return { and: baseAnd } as Where;
}

export function useJobsFeed() {
  const [futureJobs, setFutureJobs] = useState<Job[]>([]);
  const [pastJobs, setPastJobs] = useState<Job[]>([]);
  const [futurePage, setFuturePage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [hasNextFuturePage, setHasNextFuturePage] = useState(true);
  const [hasNextPastPage, setHasNextPastPage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOnlyFuture, setShowOnlyFuture] = useState(false);

  const { activeFilter, loadFilters } = useFiltersStore();

  // ─── load inicial / re-carga ─────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    if (!activeFilter) return;

    setIsLoading(true);

    try {
      const now = new Date().toISOString();

      // Jobs futuros
      const futurePromise = jobService.getJobs({
        where: getJobWhereClause(now, false, activeFilter),
        page: 1,
        limit: PAGE_SIZE,
        sort: "startDateTime",
      });

      // Jobs passados (somente se o toggle permitir)
      const isAvailableJobsFilter = activeFilter?.id === "available-jobs";
      const canShowPast = !showOnlyFuture && !isAvailableJobsFilter;

      let pastPromise: Promise<any> | null = null;
      if (canShowPast) {
        pastPromise = jobService.getJobs({
          where: getJobWhereClause(now, true, activeFilter),
          page: 1,
          limit: PAGE_SIZE,
          sort: "-startDateTime",
        });
      }

      const [futureResult, pastResult] = await Promise.all([
        futurePromise,
        pastPromise,
      ]);

      setFutureJobs(futureResult.docs);
      setHasNextFuturePage(futureResult.hasNextPage);
      setFuturePage(1);

      if (pastResult) {
        setPastJobs(pastResult.docs);
        setHasNextPastPage(pastResult.hasNextPage);
        setPastPage(1);
      } else {
        setPastJobs([]);
        setHasNextPastPage(false);
        setPastPage(1);
      }
    } catch (err) {
      console.error("[useJobsFeed] Erro ao carregar jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [showOnlyFuture, activeFilter]);

  // ─── refresh ─────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadJobs();
    setIsRefreshing(false);
  }, [loadJobs]);

  // ─── load more (paginação infinita) ──────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    if (!hasNextFuturePage && !hasNextPastPage) return;

    setIsLoadingMore(true);

    try {
      const now = new Date().toISOString();

      let futurePromise: Promise<any> | null = null;
      let pastPromise: Promise<any> | null = null;

      if (hasNextFuturePage) {
        const nextPage = futurePage + 1;
        futurePromise = jobService.getJobs({
          where: getJobWhereClause(now, false, activeFilter),
          page: nextPage,
          limit: PAGE_SIZE,
          sort: "startDateTime",
        });
      }

      const isAvailableJobsFilter = activeFilter?.id === "available-jobs";
      const canShowPast = !showOnlyFuture && !isAvailableJobsFilter;

      if (hasNextPastPage && canShowPast) {
        const nextPage = pastPage + 1;
        pastPromise = jobService.getJobs({
          where: getJobWhereClause(now, true, activeFilter),
          page: nextPage,
          limit: PAGE_SIZE,
          sort: "-startDateTime",
        });
      }

      const [futureResult, pastResult] = await Promise.all([
        futurePromise,
        pastPromise,
      ]);

      if (futureResult) {
        setFutureJobs((prev) => [...prev, ...futureResult.docs]);
        setHasNextFuturePage(futureResult.hasNextPage);
        setFuturePage((p) => p + 1);
      }

      if (pastResult) {
        setPastJobs((prev) => [...prev, ...pastResult.docs]);
        setHasNextPastPage(pastResult.hasNextPage);
        setPastPage((p) => p + 1);
      }
    } catch (err) {
      console.error("[useJobsFeed] Erro ao carregar mais jobs:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasNextFuturePage,
    hasNextPastPage,
    futurePage,
    pastPage,
    showOnlyFuture,
    activeFilter,
  ]);

  // ─── efeito inicial e re-carga ao mudar toggle ───────────────────────────

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyFuture, activeFilter]);

  // ─── cards formatados ─────────────────────────────────────────────────────

  const futureCards: JobCardItem[] = futureJobs.map(formatJobAsCardItem);
  const pastCards: JobCardItem[] = showOnlyFuture
    ? []
    : pastJobs.map(formatJobAsCardItem);

  return {
    futureCards,
    pastCards,
    isLoading,
    isLoadingMore,
    isRefreshing,
    showOnlyFuture,
    setShowOnlyFuture,
    loadMore,
    refresh,
  };
}
