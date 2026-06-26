import { useState, useEffect, useCallback, useRef } from "react";
import { jobApplicationService } from "@/services/jobs/JobApplicationService.ts";
import { Job } from "@/types/api.types.ts";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

interface ApplicationsSummary {
  receivedCount: number;
  sentCount: number;
  pendingCount: number;
  acceptedReceivedCount: number;
  loading: boolean;
  error: string | null;
}

export function useApplicationsSummary(): ApplicationsSummary {
  const { user } = useAuthContext();
  const [summary, setSummary] = useState<ApplicationsSummary>({
    receivedCount: 0,
    sentCount: 0,
    pendingCount: 0,
    acceptedReceivedCount: 0,
    loading: true,
    error: null,
  });
  const isLoadingRef = useRef(false);

  const loadApplicationsSummary = useCallback(async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setSummary((prev) => ({ ...prev, loading: true, error: null }));

      if (!user?.id) {
        setSummary({
          receivedCount: 0,
          sentCount: 0,
          pendingCount: 0,
          acceptedReceivedCount: 0,
          loading: false,
          error: null,
        });
        isLoadingRef.current = false;
        return;
      }

      // Fetch applications where user is publisher (received)
      const receivedResult = await jobApplicationService.getJobApplications({
        where: {
          publisher: { equals: user.id },
        },
        page: 1,
        limit: 100,
      });

      // Fetch applications where user is applicant (sent)
      const sentResult = await jobApplicationService.getJobApplications({
        where: {
          applicant: { equals: user.id },
        },
        page: 1,
        limit: 100,
      });

      const now = new Date();

      // Filter non-expired applications
      const validReceivedApps = receivedResult.docs.filter((app) => {
        const job =
          typeof app.job === "object" ? (app.job as unknown as Job) : null;
        if (!job?.startDateTime) return false;
        return new Date(job.startDateTime) > now;
      });

      const validSentApps = sentResult.docs.filter((app) => {
        const job =
          typeof app.job === "object" ? (app.job as unknown as Job) : null;
        if (!job?.startDateTime) return false;
        return new Date(job.startDateTime) > now;
      });

      const pendingReceived = validReceivedApps.filter(
        (app) => app.status === "PENDING",
      ).length;

      const acceptedReceived = validReceivedApps.filter(
        (app) => app.status === "ACCEPTED",
      ).length;

      setSummary({
        receivedCount: validReceivedApps.length,
        sentCount: validSentApps.length,
        pendingCount: pendingReceived,
        acceptedReceivedCount: acceptedReceived,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("[useApplicationsSummary] Error loading summary:", error);
      setSummary((prev) => ({
        ...prev,
        loading: false,
        error: "Erro ao carregar aplicações",
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadApplicationsSummary();
    }
  }, [user?.id, loadApplicationsSummary]);

  return summary;
}
