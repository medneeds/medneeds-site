import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/numberFormatter";
import { addHours, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, Clock, Eye, MapPin, Users } from "lucide-react";
import { useMemo } from "react";
import type { PaymentMethod } from "../NewJob.types";

interface JobPreviewCardProps {
  /** Caption above the title, e.g. "Você está agendando" */
  caption?: string;
  /** Place name – becomes the card title */
  placeName?: string;
  /** Place address (city / formatted address) */
  placeAddress?: string;
  /** Modality name */
  modality?: string;
  /** Clinical area name */
  clinicalArea?: string;
  /** Institution name (institutional mode) */
  institutionName?: string;
  /** Team name (institutional mode) */
  teamName?: string;
  /** Start date */
  startDate?: Date;
  /** Start time string (HH:mm) */
  startTime?: string;
  /** Duration in hours */
  duration?: number;
  /** Formatted price string e.g. "R$ 1.200,00" */
  price?: string;
  /** Payment method code */
  paymentMethod?: PaymentMethod;
  /** Additional replicated dates count */
  additionalDatesCount?: number;
  /** Visibility */
  visibility?: string;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  AV: "À vista",
  NR: "No mês referente",
  AC: "A combinar",
};

export const PAYMENT_METHOD_CHIP_VARIANT: Record<
  string,
  "purple" | "green" | "lime" | "default"
> = {
  AV: "purple",
  NR: "green",
  AC: "lime",
};

export function JobPreviewCard({
  caption,
  placeName,
  placeAddress,
  modality,
  clinicalArea,
  institutionName,
  teamName,
  startDate,
  startTime,
  duration,
  price,
  paymentMethod,
  additionalDatesCount,
  visibility,
}: JobPreviewCardProps) {
  const hasAnyData = !!(
    placeName ||
    modality ||
    clinicalArea ||
    institutionName ||
    startDate ||
    price
  );

  /* ── Period computation ── */
  const periodData = useMemo(() => {
    if (!startDate || !startTime || !duration) return null;
    const [h, m] = startTime.split(":").map(Number);
    const start = new Date(startDate);
    start.setHours(h, m, 0, 0);
    const end = addHours(start, duration);

    const sameDay = isSameDay(start, end);

    const startDayStr = format(start, "EEE", { locale: ptBR }).toUpperCase();
    const startMonthStr = format(start, "dd MMM", {
      locale: ptBR,
    }).toUpperCase();
    const startHourStr = format(start, "HH'h'mm").replace("h00", "h");

    const endDayStr = format(end, "EEE", { locale: ptBR }).toUpperCase();
    const endMonthStr = format(end, "dd MMM", { locale: ptBR }).toUpperCase();
    const endHourStr = format(end, "HH'h'mm").replace("h00", "h");

    return {
      sameDay,
      startDay: startDayStr,
      startMonth: startMonthStr,
      startHour: startHourStr,
      endDay: endDayStr,
      endMonth: endMonthStr,
      endHour: endHourStr,
    };
  }, [startDate, startTime, duration]);

  const priceInCents = useMemo(() => {
    if (!price) return 0;
    const numbers = price.replace(/\D/g, "");
    return parseInt(numbers || "0", 10);
  }, [price]);

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/50 bg-gradient-to-b from-card to-card/80 overflow-hidden transition-all duration-300",
        hasAnyData ? "shadow-sm" : "border-dashed border-muted-foreground/20",
      )}
    >
      {/* Caption */}
      {caption && (
        <div className="px-4 pt-3 pb-0 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {caption}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pt-2 pb-3 flex flex-col items-center text-center">
        {/* Title */}
        {institutionName ? (
          <div className="mb-2">
            <h3 className="text-base font-bold text-foreground leading-snug">
              {institutionName}
            </h3>
            {teamName ? (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <Users className="w-3 h-3 shrink-0" />
                {teamName}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                Selecione o time
              </p>
            )}
          </div>
        ) : placeName ? (
          <div className="mb-2">
            <h3 className="text-base font-bold text-foreground leading-snug">
              {placeName}
            </h3>
            {placeAddress && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {placeAddress}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-2">
            <div className="h-5 w-40 bg-muted/50 rounded animate-pulse" />
          </div>
        )}

        {/* Tags row */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
          {modality && (
            <Chip variant="purple" size="sm">
              {modality}
            </Chip>
          )}
          {clinicalArea && (
            <Chip variant="green" size="sm">
              {clinicalArea}
            </Chip>
          )}
          {duration && (
            <Chip variant="blue" size="sm">
              {duration}h
            </Chip>
          )}
          {additionalDatesCount && additionalDatesCount > 0 ? (
            <Chip
              variant="default"
              size="sm"
              icon={<CalendarPlus className="w-3 h-3" />}
            >
              {additionalDatesCount}{" "}
              {additionalDatesCount === 1
                ? "data adicional"
                : "datas adicionais"}
            </Chip>
          ) : null}
          {visibility === "UNLISTED" && (
            <Chip variant="orange" size="sm" icon={<Eye className="w-3 h-3" />}>
              Não listada
            </Chip>
          )}
        </div>

        {/* Period display – mirrors the app's JobPeriod component */}
        {periodData && (
          <div className="flex items-center justify-center gap-2 my-2 w-full">
            {/* Left side: start date + start hour */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {/* Start date column */}
              <div className="flex flex-col items-end leading-none">
                <span className="text-[13px] font-bold text-foreground leading-[13px]">
                  {periodData.startDay}
                </span>
                <span className="text-[13px] font-bold text-foreground leading-[13px]">
                  {periodData.startMonth}
                </span>
              </div>
              {/* Start hour */}
              <span className="text-[24px] font-bold text-foreground leading-none">
                {periodData.startHour}
              </span>
            </div>

            {/* Center: dash — clock — dash */}
            <div className="flex items-center gap-1.5 mx-1">
              <span className="text-lg text-foreground/60 font-normal">—</span>
              <Clock className="w-5 h-5 text-foreground shrink-0" />
              <span className="text-lg text-foreground/60 font-normal">—</span>
            </div>

            {/* Right side: end hour + end date */}
            <div className="flex items-center gap-2 flex-1 justify-start">
              {/* End hour */}
              <span className="text-[24px] font-bold text-foreground leading-none">
                {periodData.endHour}
              </span>
              {/* End date column – hidden when same day */}
              {!periodData.sameDay && (
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[13px] font-bold text-foreground leading-[13px]">
                    {periodData.endDay}
                  </span>
                  <span className="text-[13px] font-bold text-foreground leading-[13px]">
                    {periodData.endMonth}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Price Footer */}
      {priceInCents > 0 && paymentMethod && (
        <div className="px-4 py-2.5 bg-card flex flex-col items-center justify-center gap-1.5 ">
          {/* <span className="text-lg font-bold text-foreground">
            
          </span> */}
          <Chip
            variant={PAYMENT_METHOD_CHIP_VARIANT[paymentMethod] || "default"}
            size="sm"
          >
            {formatCurrency(priceInCents / 100)} ({paymentMethod})
          </Chip>
        </div>
      )}

      {/* Empty state */}
      {!hasAnyData && (
        <div className="px-4 py-6 flex flex-col items-center justify-center text-center">
          <Eye className="w-6 h-6 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground/50">
            Preencha os campos para visualizar o preview
          </p>
        </div>
      )}
    </div>
  );
}
