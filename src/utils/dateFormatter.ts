import { JobCardItem } from "@/services/jobs/utils/formatJob.ts";
import dayjs, { Dayjs } from "dayjs";
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Configuração global de timezone
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * SISTEMA UNIFICADO DE DATAS
 * 
 * Regras:
 * 1. Payload CMS sempre retorna UTC
 * 2. Toda data deve ser convertida para timezone brasileiro
 * 3. Para calendários e exibição, usar sempre timezone local brasileiro
 * 4. Para APIs, converter de volta para UTC se necessário
 */

// ===== FUNÇÕES PRINCIPAIS =====

/**
 * Converte qualquer data para timezone brasileiro
 * Use esta função SEMPRE que receber data do backend
 */
export function toBrazilTimezone(date: string | Date | number | null | undefined): Dayjs | null {
  if (!date) return null;
  return dayjs.utc(date).tz(BRAZIL_TIMEZONE);
}

/**
 * Converte data brasileira para UTC (para enviar ao backend)
 * Use esta função SEMPRE que enviar data para o backend
 */
export function toUTC(date: string | Date | Dayjs): string {
  return dayjs.tz(date, BRAZIL_TIMEZONE).utc().toISOString();
}

/**
 * Cria uma nova data no timezone brasileiro
 * Use para criar datas "agora" ou datas específicas
 */
export function nowInBrazil(): Dayjs {
  return dayjs().tz(BRAZIL_TIMEZONE);
}

/**
 * Converte data para formato de calendário (YYYY-MM-DD) no timezone brasileiro
 * Use para react-native-calendars e comparações de datas
 */
export function toCalendarDate(date: string | Date | number | null | undefined): string | null {
  const brazilDate = toBrazilTimezone(date);
  return brazilDate ? brazilDate.format('YYYY-MM-DD') : null;
}

/**
 * Converte data para Date nativo no timezone brasileiro
 * Use quando componentes precisam de Date nativo
 */
export function toBrazilDate(date: string | Date | number | null | undefined): Date | null {
  const brazilDate = toBrazilTimezone(date);
  return brazilDate ? brazilDate.toDate() : null;
}

/**
 * Formata data para exibição brasileira
 */
export function formatBrazilDate(date: string | Date | number | null | undefined, format: string = 'DD/MM/YYYY'): string {
  const brazilDate = toBrazilTimezone(date);
  return brazilDate ? brazilDate.format(format) : '';
}

/**
 * Verifica se duas datas são do mesmo dia (no timezone brasileiro)
 */
export function isSameDay(date1: string | Date | number, date2: string | Date | number): boolean {
  const brazil1 = toBrazilTimezone(date1);
  const brazil2 = toBrazilTimezone(date2);
  return brazil1?.format('YYYY-MM-DD') === brazil2?.format('YYYY-MM-DD');
}

// ===== FUNÇÕES LEGADAS (manter compatibilidade) =====

/**
 * @deprecated Use toBrazilTimezone() instead
 */
export function createTimezoneDate(dateInput?: string | number | Date, timezone: string = BRAZIL_TIMEZONE): Dayjs {
  return dayjs(dateInput).tz(timezone);
}

/**
 * @deprecated Use toBrazilDate() instead
 */
export function brazilDateFromUtc(utcDate: Date | number): Date {
  return toBrazilTimezone(utcDate)?.toDate() || new Date();
}

// ===== FUNÇÕES DE FORMATAÇÃO EXISTENTES (atualizadas) =====

export const formatDateToDisplay = (date: Date): string => {
  const brazilDate = toBrazilTimezone(date);
  if (!brazilDate) return '';
  
  const today = nowInBrazil();
  const tomorrow = today.add(1, 'day');
  const yesterday = today.subtract(1, 'day');
  
  if (brazilDate.isSame(today, 'day')) {
    return "Hoje";
  } else if (brazilDate.isSame(tomorrow, 'day')) {
    return "Amanhã";
  } else if (brazilDate.isSame(yesterday, 'day')) {
    return "Ontem";
  } else if (brazilDate.isBefore(today.subtract(1, 'year'))) {
    return brazilDate.format('D [de] MMMM [de] YYYY');
  } else {
    if (brazilDate.isBefore(today.subtract(1, 'week'))) {
      const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      return weekdays[brazilDate.day()] + ', ' + brazilDate.format('D [de] MMMM');
    } else {
      return brazilDate.format('D [de] MMMM [de] YYYY');
    }
  }
};

export const organizeCardsByDate = (cards: JobCardItem[], dateField: keyof JobCardItem = 'createdAt', reverse: boolean = false): { title: string, data: JobCardItem[] }[] => {
  // Ordena os cards por data (convertendo para timezone brasileiro)
  const sortedCards = [...cards].sort((a, b) => {
    const dateA = toBrazilTimezone(a[dateField] as Date);
    const dateB = toBrazilTimezone(b[dateField] as Date);
    return (dateB?.valueOf() || 0) - (dateA?.valueOf() || 0);
  });
  
  // Agrupa os cards por data (em string formatada)
  const groupedByDate: Record<string, JobCardItem[]> = {};
  
  sortedCards.forEach(card => {
    const dateKey = formatDateToDisplay(card[dateField] as Date);
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(card);
  });

  const dates = Object.keys(groupedByDate);
  if (reverse) {
    dates.reverse();
  }
  
  // Converte para o formato de seções
  return dates.map(dateKey => ({
    title: dateKey,
    data: groupedByDate[dateKey]
  }));
};

export const organizeJobsByDateWithPastFuture = (
  futureCards: JobCardItem[], 
  pastCards: JobCardItem[], 
  dateField: keyof JobCardItem = 'createdAt'
): { title: string, data: JobCardItem[] }[] => {
  const now = nowInBrazil();
  
  // Jobs futuros: ordenação crescente (mais próximo primeiro)
  const sortedFutureCards = [...futureCards].sort((a, b) => {
    const dateA = toBrazilTimezone(a[dateField] as Date);
    const dateB = toBrazilTimezone(b[dateField] as Date);
    return (dateA?.valueOf() || 0) - (dateB?.valueOf() || 0);
  });
  
  // Jobs passados: ordenação decrescente (mais recente primeiro)
  const sortedPastCards = [...pastCards].sort((a, b) => {
    const dateA = toBrazilTimezone(a[dateField] as Date);
    const dateB = toBrazilTimezone(b[dateField] as Date);
    return (dateB?.valueOf() || 0) - (dateA?.valueOf() || 0);
  });
  
  // Combinar e agrupar
  const allCards = [...sortedFutureCards, ...sortedPastCards];
  const groupedByDate: Record<string, JobCardItem[]> = {};
  
  allCards.forEach(card => {
    const dateKey = formatDateToDisplay(card[dateField] as Date);
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(card);
  });
  
  // Converte para o formato de seções
  return Object.keys(groupedByDate).map(dateKey => ({
    title: dateKey,
    data: groupedByDate[dateKey]
  }));
};

// ===== EXEMPLOS DE USO =====

/**
 * GUIA DE MIGRAÇÃO E EXEMPLOS
 * 
 * 1. DADOS VINDOS DO BACKEND (Payload CMS):
 *    const job = await fetchJob();
 *    const startDate = toBrazilTimezone(job.startDate); // Converte UTC para Brasil
 *    const displayDate = formatBrazilDate(job.startDate, 'DD/MM/YYYY HH:mm');
 * 
 * 2. PARA CALENDÁRIOS (react-native-calendars):
 *    const markedDates = {
 *      [toCalendarDate(job.startDate)]: { selected: true }
 *    };
 * 
 * 3. COMPARAÇÕES DE DATAS:
 *    const isToday = isSameDay(job.startDate, new Date());
 *    const isAfterNow = toBrazilTimezone(job.startDate).isAfter(nowInBrazil());
 * 
 * 4. ENVIANDO PARA O BACKEND:
 *    const payload = {
 *      startDate: toUTC(selectedDate), // Converte Brasil para UTC
 *      endDate: toUTC(endDate)
 *    };
 * 
 * 5. CRIANDO DATAS LOCAIS:
 *    const now = nowInBrazil();
 *    const tomorrow = nowInBrazil().add(1, 'day');
 *    const startOfDay = nowInBrazil().startOf('day');
 * 
 * 6. COMPONENTES QUE PRECISAM DE Date NATIVO:
 *    const nativeDate = toBrazilDate(job.startDate);
 *    <DatePicker date={nativeDate} />
 */