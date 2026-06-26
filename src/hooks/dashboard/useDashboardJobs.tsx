import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JobService from "@/services/jobs/JobService.ts";
import {
  CoreJobFilter,
  formatJobFitlerToWhereClause,
} from "@/services/jobs/utils/formatJob.ts";
import type { Job } from "@/config/types.ts";
import type { ShiftData } from "@/components/dashboard/card/ShiftCard.tsx";
import dayjs from "dayjs";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

/**
 * Convert a Job (Payload CMS) into the ShiftData shape used by ShiftCard.
 */
function jobToShiftData(job: Job): ShiftData {
  const start = dayjs(job.startDateTime);
  const city = job.city?.name ?? "";
  const state = job.city?.uf ?? (job as any)?.city?.state ?? "";
  const location = job.place?.name ?? job.place ?? "";
  const modality = job.modality?.name ?? job.modality ?? "";

  return {
    id: job.id,
    title:
      (typeof location === "string" ? location : (location as any)?.name) ||
      (typeof modality === "string" ? modality : (modality as any)?.name) ||
      "",
    location:
      typeof location === "string" ? location : ((location as any)?.name ?? ""),
    city,
    state,
    sector: "",
    date: start.toDate(),
    startTime: start.format("HH:mm"),
    duration: `${job.durationInHours ?? 0}h`,
    value: (job.priceInCents ?? 0) / 100,
    payType: (job.paymentMethod as "NR" | "AC") ?? "NR",
    status:
      job.status === "open"
        ? "open"
        : job.selectedApplication
          ? "confirmed"
          : "open",
    modality:
      typeof modality === "string" ? modality : ((modality as any)?.name ?? ""),
    clinicalArea:
      typeof job.clinicalArea === "string"
        ? job.clinicalArea
        : (job.clinicalArea?.name ?? ""),
  };
}
export function useDashboardJobs() {
  const { user } = useAuthContext();
  const jobService = useMemo(() => new JobService(), []);
  const [todayJobs, setTodayJobs] = useState<ShiftData[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<ShiftData[]>([]);
  const [feedJobs, setFeedJobs] = useState<ShiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoadingRef = useRef(false);

  // Build filters exactly like the mobile Start screen
  const todayFilter: CoreJobFilter = useMemo(() => {
    const today = dayjs();
    return {
      title: "Hoje",
      type: "feed",
      conjunction: "or",
      conditions: [
        {
          visibility: "PRIVATE" as const,
          inFrom: [user?.id ?? "invalid"],
          betweenDates: [
            today.startOf("day").toDate(),
            today.endOf("day").toDate(),
          ],
        },
        {
          inTo: [user?.id ?? "invalid"],
          betweenDates: [
            today.startOf("day").toDate(),
            today.endOf("day").toDate(),
          ],
        },
      ],
    };
  }, [user?.id]);

  const upcomingFilter: CoreJobFilter = useMemo(() => {
    const tomorrow = dayjs().add(1, "day");
    const twoWeeks = dayjs().add(15, "day");
    return {
      title: "Próximos compromissos",
      type: "feed",
      conjunction: "or",
      conditions: [
        {
          visibility: "PRIVATE" as const,
          inFrom: [user?.id ?? "invalid"],
          betweenDates: [
            tomorrow.startOf("day").toDate(),
            twoWeeks.endOf("day").toDate(),
          ],
        },
        {
          inTo: [user?.id ?? "invalid"],
          betweenDates: [
            tomorrow.startOf("day").toDate(),
            twoWeeks.endOf("day").toDate(),
          ],
        },
      ],
    };
  }, [user?.id]);

  const feedFilter: CoreJobFilter = useMemo(
    () => ({
      title: "Disponíveis",
      type: "feed",
      conjunction: "and",
      conditions: [{ showPastJobs: false }],
    }),
    [],
  );

  const fetchJobs = useCallback(async () => {
    if (isLoadingRef.current || !user) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const [todayRes, upcomingRes, feedRes] = await Promise.all([
        jobService.getJobs({
          where: formatJobFitlerToWhereClause(todayFilter),
          page: 1,
          limit: 10,
          sort: "startDateTime",
        }),
        jobService.getJobs({
          where: formatJobFitlerToWhereClause(upcomingFilter),
          page: 1,
          limit: 10,
          sort: "startDateTime",
        }),
        jobService.getJobs({
          where: formatJobFitlerToWhereClause(feedFilter),
          page: 1,
          limit: 6,
          sort: "-startDateTime",
        }),
      ]);

      setTodayJobs(todayRes.docs.map(jobToShiftData));
      setUpcomingJobs(upcomingRes.docs.map(jobToShiftData));
      setFeedJobs(feedRes.docs.map(jobToShiftData));
    } catch (error) {
      console.error("[useDashboardJobs] Error fetching jobs:", error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [user, jobService, todayFilter, upcomingFilter, feedFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    todayJobs,
    upcomingJobs,
    feedJobs,
    loading,
    refetch: fetchJobs,
  };
}
