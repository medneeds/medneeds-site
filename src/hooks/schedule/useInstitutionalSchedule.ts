import { useState, useCallback, useEffect } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import institutionalService from "@/services/institution/InstitutionalService";
import type {
  InstitutionalJob,
  InstitutionMemberParameter,
  TeamItem,
} from "@/services/institution/InstitutionalService";

export interface ShiftWithDoctor extends InstitutionalJob {
  doctorName: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  checkInStatus: "pending" | "checked_in" | "checked_out" | "absent";
}

const resolveId = (field: unknown): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && "id" in (field as object))
    return (field as { id: string }).id ?? "";
  return "";
};

export function useInstitutionalSchedule(
  institutionId: string | null,
  monthDate: Date
) {
  const [jobs, setJobs] = useState<InstitutionalJob[]>([]);
  const [offers, setOffers] = useState<InstitutionalJob[]>([]);
  const [members, setMembers] = useState<InstitutionMemberParameter[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [replicating, setReplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const load = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    setError(null);
    try {
      const [agenda, offersRes, params, teamsData] = await Promise.all([
        institutionalService.getAgenda({
          from: format(monthStart, "yyyy-MM-dd"),
          to: format(monthEnd, "yyyy-MM-dd"),
          view: "institution",
          limit: 500,
        }),
        institutionalService.getOffers({ limit: 500 }).catch(() => ({ docs: [] })),
        institutionalService.getParameters(institutionId),
        institutionalService.listTeams(institutionId),
      ]);
      setJobs(agenda.docs ?? []);
      setOffers((offersRes as { docs?: InstitutionalJob[] }).docs ?? []);
      setMembers(params.filter((m) => m.status === "active"));
      setTeams(teamsData);
    } catch {
      setError("Erro ao carregar agenda institucional.");
    } finally {
      setLoading(false);
    }
  }, [institutionId, monthStart.toISOString(), monthEnd.toISOString()]);

  useEffect(() => {
    load();
  }, [load]);

  const resolveDoctor = useCallback(
    (profileId: string | null): string => {
      if (!profileId) return "—";
      return members.find((m) => m.userId === profileId)?.profileName ?? profileId.slice(0, 8) + "…";
    },
    [members]
  );

  const enrichedJobs: ShiftWithDoctor[] = jobs.map((j) => {
    let checkInAt: string | null = null;
    let checkOutAt: string | null = null;
    let checkInStatus: ShiftWithDoctor["checkInStatus"] = "pending";

    try {
      const raw = j.executionControl;
      // Payload retorna group como objeto; fallback para string legada
      const ctrl = raw
        ? (typeof raw === "string" ? JSON.parse(raw) : raw)
        : null;
      if (ctrl) {
        checkInAt = ctrl.checkInAt ?? null;
        checkOutAt = ctrl.checkOutAt ?? null;
        if (ctrl.absent) checkInStatus = "absent";
        else if (checkOutAt) checkInStatus = "checked_out";
        else if (checkInAt) checkInStatus = "checked_in";
      }
    } catch {
      // executionControl não é válido — ignorar
    }

    return {
      ...j,
      doctorName: resolveDoctor(j.toProfileId),
      checkInAt,
      checkOutAt,
      checkInStatus,
    };
  });

  const byDay = enrichedJobs.reduce<Record<string, ShiftWithDoctor[]>>(
    (acc, job) => {
      const day = format(new Date(job.startDateTime), "yyyy-MM-dd");
      (acc[day] ??= []).push(job);
      return acc;
    },
    {}
  );

  /** Replica uma lista de plantões mapeados para datas/horários destino */
  const replicateShifts = useCallback(async (
    toCreate: Array<{
      shift: ShiftWithDoctor;
      targetStart: Date;
      targetEnd: Date;
    }>,
    includeDoctors: boolean
  ) => {
    if (!institutionId) return;
    setReplicating(true);
    try {
      await Promise.all(
        toCreate.map(({ shift, targetStart, targetEnd }) =>
          institutionalService.createJob(shift.institutionId, {
            team: shift.teamId,
            startDateTime: targetStart.toISOString(),
            endDateTime: targetEnd.toISOString(),
            durationInHours: shift.durationInHours,
            ...(resolveId(shift.modality) && { modality: resolveId(shift.modality) }),
            ...(resolveId(shift.clinicalArea) && { clinicalArea: resolveId(shift.clinicalArea) }),
            ...(shift.place && { place: shift.place }),
            ...(shift.placeDisplayName && { placeDisplayName: shift.placeDisplayName }),
            ...(shift.priceInCents !== undefined && { priceInCents: shift.priceInCents }),
            ...(shift.paymentMethod && { paymentMethod: shift.paymentMethod }),
            ...(includeDoctors && shift.toProfileId ? { to: shift.toProfileId } : {}),
          })
        )
      );
      await load();
    } finally {
      setReplicating(false);
    }
  }, [institutionId, load]);

  const markCheckIn = useCallback(
    async (jobId: string, type: "in" | "out" | "absent" | "revert-absent") => {
      if (type === "in") {
        await institutionalService.checkIn(jobId);
      } else if (type === "out") {
        await institutionalService.checkOut(jobId);
      } else if (type === "absent") {
        await institutionalService.markAbsent(jobId);
      } else {
        await institutionalService.revertAbsent(jobId);
      }
      await load();
    },
    [load]
  );

  return {
    jobs: enrichedJobs,
    offers,
    byDay,
    members,
    teams,
    loading,
    replicating,
    error,
    reload: load,
    replicateShifts,
    markCheckIn,
    monthStart,
    monthEnd,
  };
}
