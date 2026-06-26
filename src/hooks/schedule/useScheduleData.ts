import { useState, useEffect, useRef, useCallback } from "react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  CoreJobFilter,
  formatJobAsAgendaCardItem,
  formatJobFitlerToWhereClause,
  JobAgendaCardItem,
} from "@/services/jobs/utils/formatJob.ts";
import JobService from "@/services/jobs/JobService.ts";
import { Job } from "@/config/types.ts";

dayjs.extend(timezone);
dayjs.extend(utc);

const jobService = new JobService();

const isJobInMonth = (job: Job, monthKey: string): boolean => {
  const startDate = job.startDateTime;
  if (startDate) {
    const jobMonth = dayjs(startDate).format("YYYY-MM");
    if (jobMonth === monthKey) return true;
  }

  const additionalDates: Array<{ date: string }> =
    (job.additionalDates as any[]) || [];
  for (const ad of additionalDates) {
    if (ad?.date) {
      const adMonth = dayjs(ad.date).format("YYYY-MM");
      if (adMonth === monthKey) return true;
    }
  }

  return false;
};

const filterJobsForMonth = (
  jobs: Job[],
  monthKey: string,
): JobAgendaCardItem[] => {
  return jobs
    .filter((job) => isJobInMonth(job, monthKey))
    .map((job) => formatJobAsAgendaCardItem(job));
};

const loadAllFromAPI = async (userId: string): Promise<Job[]> => {
  // Buscar 1 mês anterior até 3 meses à frente
  const startDate = dayjs().subtract(1, "month").startOf("month").toDate();
  const endDate = dayjs().add(3, "months").endOf("month").toDate();

  const filter: CoreJobFilter = {
    title: "Minha agenda",
    type: "feed",
    conjunction: "or",
    conditions: [
      {
        inTo: [userId],
        betweenDates: [startDate, endDate],
        showPastJobs: true,
      },
      {
        inFrom: [userId],
        betweenDates: [startDate, endDate],
        visibility: "PRIVATE",
        showPastJobs: true,
      },
    ],
  };

  try {
    const result = await jobService.getJobs({
      where: formatJobFitlerToWhereClause(filter),
      page: 1,
      limit: 1000,
    });
    return result.docs;
  } catch (error) {
    console.error("[useAgendaData] Erro ao carregar da API:", error);
    return [];
  }
};

const loadMonthFromAPI = async (
  userId: string,
  month: Date,
): Promise<Job[]> => {
  const monthStart = dayjs(month).startOf("month").toDate();
  const monthEnd = dayjs(month).endOf("month").toDate();

  const filter: CoreJobFilter = {
    title: "Minha agenda",
    type: "feed",
    conjunction: "or",
    conditions: [
      {
        inTo: [userId],
        betweenDates: [monthStart, monthEnd],
        showPastJobs: true,
      },
      {
        inFrom: [userId],
        betweenDates: [monthStart, monthEnd],
        visibility: "PRIVATE",
        showPastJobs: true,
      },
    ],
  };

  try {
    const result = await jobService.getJobs({
      where: formatJobFitlerToWhereClause(filter),
      page: 1,
      limit: 1000,
    });
    return result.docs;
  } catch (error) {
    console.error("[useAgendaData] Erro ao carregar mês da API:", error);
    return [];
  }
};

export const useScheduleData = (
  userId: string | undefined,
  initialMonth: Date,
) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(initialMonth);
  const selectedMonthKey = dayjs(selectedMonth).format("YYYY-MM");

  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [monthJobs, setMonthJobs] = useState<JobAgendaCardItem[]>([]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChangingMonth, setIsChangingMonth] = useState(false);

  const isInitialLoadRef = useRef(true);
  const isMountedRef = useRef(true);

  // Manter monthJobs sincronizado com allJobs e selectedMonthKey
  useEffect(() => {
    const filtered = filterJobsForMonth(allJobs, selectedMonthKey);
    setMonthJobs(filtered);
  }, [selectedMonthKey, allJobs]);

  // Carregamento inicial
  const initialize = useCallback(async () => {
    if (!userId) {
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);
    try {
      const apiJobs = await loadAllFromAPI(userId);
      if (isMountedRef.current) {
        setAllJobs(apiJobs);
      }
    } catch (error) {
      console.error("[useAgendaData] Erro ao inicializar:", error);
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      initialize();
    }
  }, [initialize]);

  // Refresh manual
  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsRefreshing(true);
    try {
      const apiJobs = await loadAllFromAPI(userId);
      if (isMountedRef.current) {
        setAllJobs(apiJobs);
      }
    } catch (error) {
      console.error("[useAgendaData] Erro no refresh:", error);
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [userId, allJobs]);

  // Mudança de mês
  const changeMonth = useCallback(
    (newDate: Date) => {
      if (!userId) return;

      const newMonthKey = dayjs(newDate).format("YYYY-MM");
      setSelectedMonth(newDate);

      const alreadyLoaded = allJobs.filter((job) =>
        isJobInMonth(job, newMonthKey),
      );
      const shouldShowSkeleton = alreadyLoaded.length === 0;
      setIsChangingMonth(shouldShowSkeleton);

      (async () => {
        try {
          const apiJobs = await loadMonthFromAPI(userId, newDate);
          if (isMountedRef.current && apiJobs.length > 0) {
            const jobMap = new Map<string, Job>();
            allJobs.forEach((job) => jobMap.set(job.id, job));
            apiJobs.forEach((job) => jobMap.set(job.id, job));
            setAllJobs(Array.from(jobMap.values()));
          }
        } catch (error) {
          console.warn("[useAgendaData] Erro ao buscar mês da API:", error);
        } finally {
          if (isMountedRef.current) {
            setIsChangingMonth(false);
          }
        }
      })();
    },
    [userId, allJobs],
  );

  // Remover jobs localmente (após deleção)
  const removeJobs = useCallback((jobIds: string[]) => {
    if (jobIds.length === 0) return;
    setAllJobs((prev) => prev.filter((job) => !jobIds.includes(job.id)));
  }, []);

  return {
    allJobs,
    monthJobs,
    isInitialLoading,
    isRefreshing,
    isChangingMonth,
    refresh,
    changeMonth,
    selectedMonth,
    selectedMonthKey,
    removeJobs,
  };
};
