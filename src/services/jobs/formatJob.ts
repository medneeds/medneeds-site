import React from "react";
import { API_HOST, PROFILE_PICTURE_PLACEHOLDER } from "@/config/constants";
import { Job, Media, Profile } from "@/config/types";
import { authService } from "@/services/auth/AuthService.ts";
import { Where } from "payload";
import { toBrazilTimezone, toCalendarDate } from "@/utils/dateFormatter";
import dayjs from "dayjs";

export type JobCardTag = {
  label: string;
  color?: "default" | "green" | "blue" | "purple" | "orange" | "red" | "lime";
  onColor?: string;
};

export type JobCardItem = {
  id: string;
  caption?: string;
  title: string;
  subtitle: string;
  tags: JobCardTag[];
  avatars?: { uri: string }[];
  previewImageUrl?: string | null;
  createdAt: Date;
  hasMultipleDates?: boolean;
  interestedCaption?: string;
  // UI flags
  unlisted?: boolean;
  onClick?: () => void;
};

export type JobAgendaCardItem = {
  id: string;
  originalJobId: string; // ID do job original para navegação
  caption?: string;
  title: string;
  subtitle: string;
  startDateTime: Date;
  durationInHours: number;
  avatars?: { uri: string }[];
  tags: JobCardTag[];
  isAdditionalDate?: boolean; // Flag para identificar se é data adicional
};

function getAvatarUrl(media?: Media | string): string {
  if (typeof media === "string") {
    return "";
  }

  if (media && "url" in media && media.url) {
    return API_HOST.replace("/api", "") + media.url;
  }

  return "";
}

export function getJobAvatars(job: Job): { uri: string }[] {
  const avatars: { uri: string }[] = [];
  avatars.push({
    uri:
      getAvatarUrl(job.from.profilePicture as Media) ||
      PROFILE_PICTURE_PLACEHOLDER,
  });

  if (job.to && typeof job.to === "object") {
    avatars.push({
      uri:
        getAvatarUrl(job.to.profilePicture as Media) ||
        PROFILE_PICTURE_PLACEHOLDER,
    });
  }

  return avatars;
}

export function getJobTags(job: Job): JobCardTag[] {
  const tags: JobCardTag[] = [];

  tags.push({ label: job.modality.name ?? "", color: "purple" });
  tags.push({ label: `${job.durationInHours}h`, color: "blue" });
  if (job.clinicalArea?.name)
    tags.push({ label: job.clinicalArea.name, color: "green" });

  if (job.priceInCents) {
    tags.push({
      label: `R$ ${job.priceInCents / 100} ${job.paymentMethod}`,
      color:
        job.paymentMethod === "AV"
          ? "purple"
          : job.paymentMethod === "NR"
            ? "green"
            : "lime",
    });
  }

  if (job.additionalDates && job.additionalDates.length > 0) {
    const extra = job.additionalDates.length;
    tags.push({
      label:
        extra + " " + (extra === 1 ? "data adicional" : "datas adicionais"),
    });
    // tags.push({ label: job.singlePaymentForMutipleDates ? 'Bloco' : 'Série' });
  }

  return tags;
}

function getJobAgendaTags(job: Job): JobCardTag[] {
  const tags: JobCardTag[] = [];
  if (job.modality && typeof job.modality === "object" && job.modality.name) {
    tags.push({ label: job.modality.name });
  }
  if (job.clinicalArea?.name) tags.push({ label: job.clinicalArea.name });
  return tags;
}

export function resolveJobCaption(job: Job, relatedJobs?: Job[]): string {
  const user = authService.user;
  const hasTransferred = Boolean(job && job.to);
  const fromObj =
    job && job.from && typeof job.from === "object" ? job.from : undefined;

  if (job.visibility === "PRIVATE") {
    if (fromObj && fromObj.id === user?.id) {
      return "Agendado";
    }
    if (fromObj && fromObj.name) {
      return `${fromObj.name.split(" ")[0]} agendou`;
    }
    return "Publicado";
  }

  if (hasTransferred && fromObj && job.to && typeof job.to === "object") {
    const fromName =
      fromObj.id === user?.id ? "Você" : fromObj.name?.split(" ")[0] || "";
    const toName =
      job.to?.id === user?.id ? "você" : job.to?.name?.split(" ")[0] || "";
    return `${fromName} transferiu para ${toName}`;
  }

  const fromName = fromObj
    ? fromObj.id === user?.id
      ? "Você"
      : fromObj.name?.split(" ")[0] || ""
    : "";

  // Verificar se o job pai expirou
  const isMainJobPast = job.startDateTime
    ? dayjs(job.startDateTime).isBefore(dayjs())
    : false;

  // Se há jobs relacionados, verificar se algum ainda está disponível
  if (relatedJobs && relatedJobs.length > 0) {
    const hasAvailableChildJobs = relatedJobs.some(
      (childJob) =>
        childJob.startDateTime &&
        dayjs(childJob.startDateTime).isAfter(dayjs()),
    );

    // Se o job pai expirou mas há jobs filhos disponíveis, usar presente
    if (isMainJobPast && hasAvailableChildJobs) {
      return fromName ? `${fromName} está oferecendo` : "Oferta";
    }
  }

  if (isMainJobPast) {
    return fromName ? `${fromName} estava oferecendo` : "Oferta anterior";
  }

  return fromName ? `${fromName} está ofercendo` : "Oferta";
}

export function resolveJobInterestedCaption(job: Job, userId: string): string {
  const interestedProfiles = job.interested?.filter(
    (user) =>
      typeof user === "object" && "id" in user && user.id !== job.from.id,
  );
  const youAreInterested = interestedProfiles?.some(
    (user) => typeof user === "object" && "id" in user && user.id === userId,
  );

  // Verificar se o job foi transferido para o próprio usuário (assumido)
  const isOwner =
    job.from && typeof job.from === "object" && job.from.id === userId;
  const isTransferredToSelf =
    job.to && typeof job.to === "object" && job.to.id === userId && isOwner;

  // Não mostrar mensagens se foi transferido para o próprio usuário
  if (interestedProfiles?.length === 0 || job.to || isTransferredToSelf)
    return "";

  if (youAreInterested && interestedProfiles?.length === 1)
    return "Você solicitou esta oferta";

  if (
    youAreInterested &&
    interestedProfiles?.length &&
    interestedProfiles?.length > 1
  ) {
    return `Você e ${interestedProfiles.length - 1} outras pessoas solicitaram esta oferta`;
  }

  if (interestedProfiles?.length && interestedProfiles?.length > 1) {
    return `${interestedProfiles.length} pessoas solicitaram esta oferta`;
  }

  return "";
}

export const formatJobAsCardItem = (
  job: Job,
  options?: { showDate?: boolean } | number,
): JobCardItem => {
  const isToday = dayjs(job.startDateTime).isSame(dayjs(), "day");
  const isTomorrow = dayjs(job.startDateTime).isSame(
    dayjs().add(1, "day"),
    "day",
  );
  const inThisMonth = dayjs(job.startDateTime).isSame(dayjs(), "month");
  const titleDate = isToday
    ? "Hoje"
    : isTomorrow
      ? "Amanhã"
      : inThisMonth
        ? dayjs(job.startDateTime).format("[Dia] DD")
        : dayjs(job.startDateTime).format("DD/MM");

  return {
    id: job.id,
    caption: resolveJobCaption(job),
    title:
      typeof options === "object" && options?.showDate
        ? `${titleDate} às ${dayjs(job.startDateTime).format("H[h]mm").replace("h00", "h")} - ${job.place?.name}`
        : job.place?.name || "Local indefinido",
    subtitle: job.city.label,
    tags: getJobTags(job),
    avatars: getJobAvatars(job),
    createdAt: new Date(job.startDateTime ?? ""),
    hasMultipleDates: Boolean(
      job.additionalDates?.length && job.additionalDates.length > 0,
    ),
    interestedCaption: resolveJobInterestedCaption(
      job,
      authService.user?.id ?? "",
    ),
    unlisted: job.visibility === "UNLISTED",
  };
};

export const resolveJobAgendaCaption = (job: Job): string | undefined => {
  const user = authService.user;
  const fromObj =
    job && job.from && typeof job.from === "object" ? job.from : undefined;
  const toObj =
    job && job.to && typeof job.to === "object" ? job.to : undefined;
  const fromName = fromObj
    ? fromObj.id === user?.id
      ? "Você"
      : fromObj.name?.split(" ")[0] || ""
    : undefined;
  const toName = toObj
    ? toObj.id === user?.id
      ? "você"
      : toObj.name?.split(" ")[0] || ""
    : undefined;

  if (job.visibility === "PRIVATE") {
    return fromName ? `${fromName} agendou` : "Agendado";
  }

  if (toObj && toObj.id === user?.id && fromName) {
    return `Transferido por ${fromName}`;
  }

  return;
};

export const resolveJobAgendaTitle = (job: Job): string => {
  return `${job.modality.name} — ${job.place?.name}`;
};

export const formatJobAsAgendaCardItem = (job: Job): JobAgendaCardItem => {
  return {
    id: job.id,
    originalJobId: job.id,
    caption: resolveJobAgendaCaption(job),
    title: resolveJobAgendaTitle(job),
    subtitle: job.city.label,
    avatars: getJobAvatars(job),
    tags: getJobAgendaTags(job),
    startDateTime: new Date(job.startDateTime ?? ""),
    durationInHours: job.durationInHours ?? 0,
    isAdditionalDate: false,
  };
};

// turn jobs linst into { title: dateString yyy-mm-dd, data: JobCardItem[] }[]
export const groupJobsAgendaByDateSections = (
  jobs: JobAgendaCardItem[],
  selectedDate?: Date,
): { title: string; data: JobAgendaCardItem[] }[] => {
  // Usar Map para agrupamento O(n) em vez de O(n²) com find
  const groupedMap = new Map<string, JobAgendaCardItem[]>();

  // Pré-processar data de hoje uma única vez
  const today = toCalendarDate(new Date()) ?? "";
  const todayDate = today ? new Date(today) : null;
  const currentMonth = todayDate ? todayDate.getMonth() : new Date().getMonth();
  const currentYear = todayDate
    ? todayDate.getFullYear()
    : new Date().getFullYear();

  // Agrupar jobs por data usando Map (O(n))
  jobs.forEach((job) => {
    const date = toCalendarDate(job.startDateTime);
    if (!date) return;

    if (!groupedMap.has(date)) {
      groupedMap.set(date, []);
    }
    groupedMap.get(date)!.push(job);
  });

  // Converter Map para array
  const groupedJobs: { title: string; data: JobAgendaCardItem[] }[] =
    Array.from(groupedMap.entries()).map(([title, data]) => ({
      title,
      data,
    }));

  // Verificar se há eventos neste mês e se hoje não está nas seções
  const hasEventsThisMonth = groupedJobs.some((section) => {
    const sectionDate = new Date(section.title);
    return (
      sectionDate.getMonth() === currentMonth &&
      sectionDate.getFullYear() === currentYear &&
      section.data.length > 0
    );
  });

  if (today && !groupedMap.has(today) && hasEventsThisMonth) {
    groupedJobs.push({ title: today, data: [{} as JobAgendaCardItem] });
  }

  // Ordena as seções por data
  groupedJobs.sort((a, b) => a.title.localeCompare(b.title));

  // Ordena os jobs dentro de cada seção por horário
  // Pré-processar timezones uma única vez para cada job
  const jobsWithTimezone = new Map<JobAgendaCardItem, number>();
  groupedJobs.forEach((section) => {
    // Pré-processar valores de timezone para evitar recálculos
    section.data.forEach((job) => {
      if (!jobsWithTimezone.has(job)) {
        const timeA = toBrazilTimezone(job.startDateTime);
        jobsWithTimezone.set(job, timeA?.valueOf() || 0);
      }
    });

    section.data.sort((a, b) => {
      const timeA = jobsWithTimezone.get(a) || 0;
      const timeB = jobsWithTimezone.get(b) || 0;
      return timeA - timeB;
    });
  });

  // Filtrar por data selecionada se necessário
  if (selectedDate) {
    const selectedDateStr = toCalendarDate(selectedDate);
    return groupedJobs.filter((section) => section.title === selectedDateStr);
  }

  return groupedJobs;
};

export type JobBlockFilter = {
  inFrom?: string[];
  inTo?: string[];
  existsTo?: boolean;
  inGroups?: string[];
  inModalities?: string[];
  inDurationsInHours?: number[];
  inClinicalAreas?: string[];
  betweenPriceInCents?: [number, number];
  inPaymentMethods?: Job["paymentMethod"][];
  betweenDates?: [Date, Date];
  showPastJobs?: boolean; // Deve ser controlado TAMBÉM via botão na tela
  inStates?: string[];
  inCities?: string[];
  inPlaces?: string[];
  visibility?: "PRIVATE" | "PUBLIC";
  visibilityNotEquals?: "PRIVATE" | "PUBLIC" | "UNLISTED";
  hasPaidAt?: boolean; // Para filtrar jobs pagos ou pendentes
  hasReceivedAt?: boolean; // Para filtrar jobs recebidos ou não recebidos
};

export type JobFilter = {
  conjunction: "and" | "or";
  conditions: (JobBlockFilter | JobFilter)[];
};

export type CoreJobFilter = JobFilter & {
  id?: string;
  title: string;
  type: "feed" | "payments" | "transfer" | "onboarding";
};

export const MY_AGENDA_JOBS_FILTER: CoreJobFilter = {
  title: "Minha agenda",
  type: "feed",
  conjunction: "or",
  conditions: [
    {
      inTo: [authService.user?.id ?? "invalid"],
      showPastJobs: true,
    },
    {
      inFrom: [authService.user?.id ?? "invalid"],
      visibility: "PRIVATE",
      showPastJobs: true,
    },
  ],
};

export const ALL_AGENDA_JOBS_FILTER: CoreJobFilter = {
  title: "Agenda de todos",
  type: "feed",
  conjunction: "or",
  conditions: [
    {
      inTo: [authService.user?.id ?? "invalid"],
      showPastJobs: true,
    },
    {
      inFrom: [authService.user?.id ?? "invalid"],
      showPastJobs: true,
    },
  ],
};

export const MY_JOBS_FILTER: CoreJobFilter = {
  title: "Suas",
  type: "feed",
  conjunction: "and",
  conditions: [
    {
      inFrom: [authService.user?.id ?? "invalid"],
      showPastJobs: true,
    },
  ],
};

export const ALL_JOBS_FILTER: CoreJobFilter = {
  title: "Ver todas",
  type: "feed",
  conjunction: "and",
  conditions: [
    {
      showPastJobs: true,
    },
  ],
};

export const AVAILABLE_JOBS_FILTER: CoreJobFilter = {
  id: "available-jobs",
  title: "Disponíveis",
  type: "feed",
  conjunction: "and",
  conditions: [
    {
      showPastJobs: false,
    },
  ],
};

export const PAID_PAYMENTS_FILTER = (userId: string): CoreJobFilter => ({
  id: "paid-payments",
  title: "Recebidos",
  type: "payments",
  conjunction: "or",
  conditions: [
    {
      inTo: [userId],
      showPastJobs: true,
    },
    {
      inFrom: [userId],
      visibility: "PRIVATE",
      showPastJobs: true,
    },
  ],
});

export const PENDING_PAYMENTS_FILTER = (userId: string): CoreJobFilter => ({
  id: "pending-payments",
  title: "Não recebidos",
  type: "payments",
  conjunction: "or",
  conditions: [
    {
      inTo: [userId],
      showPastJobs: true,
      // Removido hasReceivedAt para buscar TODOS os jobs
    },
    {
      inFrom: [userId],
      visibility: "PRIVATE",
      showPastJobs: true,
      // Removido hasReceivedAt para buscar TODOS os jobs
    },
  ],
});

// Função para obter todos os filtros padrão de payments
export const getDefaultPaymentFilters = (userId: string): CoreJobFilter[] => [
  PAID_PAYMENTS_FILTER(userId),
  PENDING_PAYMENTS_FILTER(userId),
];

// Filtros padrão para transferências
export const TRANSFER_PAID_FILTER = (userId: string): CoreJobFilter => ({
  id: "transfer-paid",
  title: "Pagas",
  type: "transfer",
  conjunction: "and",
  conditions: [
    { inFrom: [userId] },
    { existsTo: true },
    // Removido hasPaidAt para buscar TODOS os jobs
    { showPastJobs: true },
    { visibilityNotEquals: "PRIVATE" as any },
  ] as any,
});

export const TRANSFER_PENDING_FILTER = (userId: string): CoreJobFilter => ({
  id: "transfer-pending",
  title: "Não pagas",
  type: "transfer",
  conjunction: "and",
  conditions: [
    { inFrom: [userId] },
    { existsTo: true },
    // Removido hasPaidAt para buscar TODOS os jobs
    { showPastJobs: true },
    { visibilityNotEquals: "PRIVATE" as any },
  ] as any,
});

export const getDefaultTransferFilters = (userId: string): CoreJobFilter[] => [
  TRANSFER_PAID_FILTER(userId),
  TRANSFER_PENDING_FILTER(userId),
];

// Funções de compatibilidade (para não quebrar código existente)
export const getPaidPaymentsFilter = PAID_PAYMENTS_FILTER;
export const getPendingPaymentsFilter = PENDING_PAYMENTS_FILTER;

export type FilterTag = {
  id: string;
  label: string;
  onPress?: () => void;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  isActionButton?: boolean;
};

export const formatJobFitlerToWhereClause = (filter: JobFilter): Where => {
  const clause: Where = {};

  if (!Object.keys(filter).length) {
    return clause;
  }

  clause[filter.conjunction] = filter.conditions.map((condition) => {
    if ("conjunction" in condition) {
      return formatJobFitlerToWhereClause(condition);
    }

    const block: Where = {};

    if (condition.inFrom) {
      block.from = { in: condition.inFrom };
    }

    if (condition.inTo) {
      block.to = { in: condition.inTo };
    }
    if (condition.existsTo !== undefined) {
      block.to = { exists: Boolean(condition.existsTo) };
    }

    if (condition.inGroups) {
      block.restrictedToGroups = { in: condition.inGroups };
    }

    if (condition.inModalities) {
      block.modality = { in: condition.inModalities };
    }

    if (condition.inDurationsInHours) {
      block.durationInHours = { in: condition.inDurationsInHours };
    }

    if (condition.inClinicalAreas) {
      block.clinicalArea = { in: condition.inClinicalAreas };
    }

    if (condition.betweenPriceInCents) {
      const max = Math.max(...condition.betweenPriceInCents);
      const min = Math.min(...condition.betweenPriceInCents);
      block.priceInCents = { greater_than_equal: min, less_than_equal: max };
    }

    if (condition.inPaymentMethods) {
      block.paymentMethod = { in: condition.inPaymentMethods };
    }

    if (
      !condition.showPastJobs &&
      !condition.betweenDates &&
      !block.startDateTime
    ) {
      block.startDateTime = { greater_than_equal: dayjs().toISOString() };
    }

    if (condition.betweenDates) {
      const startDate = condition.betweenDates[0];
      const endDate = condition.betweenDates[1];

      // Validar datas antes de converter
      if (!startDate || !endDate) {
        console.warn(
          "[formatJobFitlerToWhereClause] ⚠️ Datas inválidas em betweenDates",
        );
        return block;
      }

      const startDateObj = dayjs(startDate);
      const endDateObj = dayjs(endDate);

      // Validar se as datas são válidas
      if (!startDateObj.isValid() || !endDateObj.isValid()) {
        console.warn(
          "[formatJobFitlerToWhereClause] ⚠️ Datas inválidas após conversão com dayjs",
        );
        return block;
      }

      // Validar se as datas convertidas são válidas
      const startDateValue = startDateObj.toDate();
      const endDateValue = endDateObj.toDate();

      if (isNaN(startDateValue.getTime()) || isNaN(endDateValue.getTime())) {
        console.warn(
          "[formatJobFitlerToWhereClause] ⚠️ Datas inválidas após conversão para Date",
        );
        return block;
      }

      block.or = [
        {
          and: [
            {
              startDateTime: { greater_than_equal: startDateObj.toISOString() },
            },
            { startDateTime: { less_than_equal: endDateObj.toISOString() } },
          ],
        },
        {
          and: [
            {
              "additionalDates.date": {
                greater_than_equal: startDateObj.toISOString(),
              },
            },
            {
              "additionalDates.date": {
                less_than_equal: endDateObj.toISOString(),
              },
            },
          ],
        },
      ];
    }

    if (condition.inStates) {
      block.state = { in: condition.inStates };
    }

    if (condition.inCities) {
      block.city = { in: condition.inCities };
    }

    if (condition.inPlaces) {
      block.place = { in: condition.inPlaces };
    }
    if (condition.visibility) {
      block.visibility = { equals: condition.visibility };
    }

    if (condition.visibilityNotEquals) {
      block.visibility = {
        ...(block.visibility || {}),
        not_equals: condition.visibilityNotEquals,
      } as any;
    }

    if (condition.hasPaidAt !== undefined) {
      if (condition.hasPaidAt) {
        block.paidAt = { exists: true };
      } else {
        block.paidAt = { exists: false };
      }
    }

    if (condition.hasReceivedAt !== undefined) {
      if (condition.hasReceivedAt) {
        block.receivedAt = { exists: true };
      } else {
        block.receivedAt = { exists: false };
      }
    }

    return block;
  });

  return clause;
};
