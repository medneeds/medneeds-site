import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, Users, Link2, Eye, Lock, Building2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShiftPreviewData {
  modality: string;
  category: string;
  location: string;
  city: string;
  state: string;
  date: string;
  startTime: string;
  duration: number;
  value: string;
  paymentType: string;
  visibility: string;
  maxApplicants: number;
  groupName?: string;
}

interface ShiftPreviewCardProps {
  data: ShiftPreviewData;
}

// Skeleton shimmer animation component
function SkeletonPulse({ className, width = "w-full" }: { className?: string; width?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded bg-muted/60", width, className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Payment type badge colors
const paymentTypeColors: Record<string, string> = {
  NR: "bg-blue-100 text-blue-700",
  AC: "bg-purple-100 text-purple-700",
  AV: "bg-emerald-100 text-emerald-700",
};

// Visibility config
const visibilityConfig: Record<string, { icon: typeof Eye; label: string; bgColor: string }> = {
  public: { icon: Eye, label: "Público", bgColor: "bg-emerald-50 text-emerald-600" },
  private: { icon: Lock, label: "Privado", bgColor: "bg-amber-50 text-amber-600" },
  unlisted: { icon: Link2, label: "Via link", bgColor: "bg-blue-50 text-blue-600" },
  group: { icon: Building2, label: "Grupo", bgColor: "bg-purple-50 text-purple-600" },
};

export function ShiftPreviewCard({ data }: ShiftPreviewCardProps) {
  const hasCategory = !!data.category && data.category !== "Outro";
  const hasLocation = !!data.location;
  const hasCity = !!data.city;
  const hasState = !!data.state;
  const hasDate = !!data.date;
  const hasValue = !!data.value && data.value !== "R$ 0,00";
  const hasPaymentType = !!data.paymentType;

  // Calculate derived values
  const startDateTime = hasDate && data.startTime 
    ? new Date(`${data.date}T${data.startTime}`) 
    : null;
  const formattedDate = startDateTime ? format(startDateTime, "dd MMM", { locale: ptBR }) : null;
  const dayOfWeek = startDateTime ? format(startDateTime, "EEE", { locale: ptBR }) : null;

  // Calculate end time
  const endTime = startDateTime 
    ? format(new Date(startDateTime.getTime() + data.duration * 60 * 60 * 1000), "HH:mm")
    : null;

  // Generate auto title from category + location
  const autoTitle = hasCategory 
    ? `Plantão ${data.category}${hasLocation ? ` - ${data.location}` : ""}`
    : null;

  const VisibilityIcon = visibilityConfig[data.visibility]?.icon || Eye;
  const visibilityLabel = visibilityConfig[data.visibility]?.label || "Público";
  const visibilityBg = visibilityConfig[data.visibility]?.bgColor || "bg-muted text-muted-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        {/* Header Row: Title + Date */}
        <div className="flex items-start gap-3 mb-2">
          {/* Title & Location */}
          <div className="flex-1 min-w-0">
            {autoTitle ? (
              <motion.h3
                key={autoTitle}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-semibold text-foreground text-sm line-clamp-1"
              >
                {autoTitle}
              </motion.h3>
            ) : (
              <SkeletonPulse className="h-4 mb-1" width="w-3/4" />
            )}
            
            {/* Location */}
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
              {hasLocation || hasCity ? (
                <motion.span
                  key={`${data.location}-${data.city}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1"
                >
                  {data.location || "Local"}
                  {hasCity && `, ${data.city}`}
                  {hasState && ` - ${data.state}`}
                  <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                </motion.span>
              ) : (
                <SkeletonPulse className="h-3" width="w-32" />
              )}
            </div>
          </div>

          {/* Date Badge - Compact on the right */}
          <div className="shrink-0 text-right">
            {formattedDate ? (
              <motion.div
                key={formattedDate}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-end"
              >
                <span className="text-[10px] text-muted-foreground capitalize">{dayOfWeek}</span>
                <span className="text-xs font-semibold text-foreground">{formattedDate}</span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-end gap-0.5">
                <SkeletonPulse className="h-2.5" width="w-8" />
                <SkeletonPulse className="h-3" width="w-12" />
              </div>
            )}
          </div>
        </div>

        {/* Pills Row */}
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Duration */}
          <motion.span
            layout
            className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600"
          >
            {data.duration}h
          </motion.span>

          {/* Value */}
          <AnimatePresence mode="wait">
            {hasValue ? (
              <motion.span
                key={data.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700"
              >
                {data.value}
              </motion.span>
            ) : (
              <SkeletonPulse className="h-5 rounded-full" width="w-14" />
            )}
          </AnimatePresence>

          {/* Payment Type */}
          {hasPaymentType && (
            <motion.span
              layout
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-full",
                paymentTypeColors[data.paymentType] || "bg-muted text-muted-foreground"
              )}
            >
              {data.paymentType}
            </motion.span>
          )}

          {/* Slots if > 1 */}
          <AnimatePresence>
            {data.maxApplicants > 1 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-0.5"
              >
                <Users className="w-2.5 h-2.5" />
                {data.maxApplicants}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Footer: Time + Visibility */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {data.startTime ? (
              <motion.span
                key={`${data.startTime}-${data.duration}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-foreground"
              >
                {data.startTime} - {endTime}
              </motion.span>
            ) : (
              <SkeletonPulse className="h-3" width="w-20" />
            )}
          </div>

          {/* Visibility Badge */}
          <motion.div
            layout
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
              visibilityBg
            )}
          >
            <VisibilityIcon className="w-2.5 h-2.5" />
            <span>{visibilityLabel}</span>
          </motion.div>
        </div>

        {/* Group name if visibility is group */}
        <AnimatePresence>
          {data.visibility === "group" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 pt-2 border-t border-border/50"
            >
              <div className="flex items-center gap-1 text-[10px] text-purple-600">
                <Building2 className="w-3 h-3" />
                <span>{data.groupName || "Selecione um grupo"}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
