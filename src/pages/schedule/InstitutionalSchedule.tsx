import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/auth/useAuthContext";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext";
import { useInstitutionalSchedule } from "@/hooks/schedule/useInstitutionalSchedule";
import { useUserMode } from "@/contexts/user/UserModeContext";
import type { ShiftWithDoctor } from "@/hooks/schedule/useInstitutionalSchedule";
import {
  WeekReplicationModal,
  type ShiftToCreate,
} from "@/components/schedule/WeekReplicationModal";
import { useScheduleNotifications } from "@/hooks/schedule/useScheduleNotifications";
import { cn } from "@/lib/utils";
import type { InstitutionMemberParameter, TeamItem, InstitutionalJob } from "@/services/institution/InstitutionalService";
import institutionalService from "@/services/institution/InstitutionalService";
import type { InstitutionOption } from "@/services/institution/InstitutionalService";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserCheck,
  Users,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { jobApplicationService } from "@/services/jobs/JobApplicationService";

// ─── Constantes ───────────────────────────────────────────────────────────────

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Paletas de cores determinísticas para instituição e time
const INST_HUES  = [0, 30, 60, 120, 165, 195, 210, 240, 270, 300, 330, 345];
const TEAM_HUES  = [15, 45, 90, 150, 180, 225, 255, 285, 315, 10, 100, 200];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function instColor(id: string) {
  return `hsl(${INST_HUES[hashId(id) % INST_HUES.length]}, 65%, 52%)`;
}
function teamHue(id: string) {
  return `hsl(${TEAM_HUES[hashId(id) % TEAM_HUES.length]}, 68%, 58%)`;
}

const STATUS_RING: Record<ShiftWithDoctor["checkInStatus"], string> = {
  pending:     "#f59e0b",
  checked_in:  "#22c55e",
  checked_out: "#3b82f6",
  absent:      "#ef4444",
};

function dominantStatus(shifts: ShiftWithDoctor[]): ShiftWithDoctor["checkInStatus"] {
  if (shifts.some((s) => s.checkInStatus === "absent"))      return "absent";
  if (shifts.some((s) => s.checkInStatus === "checked_in"))  return "checked_in";
  if (shifts.some((s) => s.checkInStatus === "checked_out")) return "checked_out";
  return "pending";
}

const CHECK_IN_LABELS: Record<ShiftWithDoctor["checkInStatus"], string> = {
  pending: "Pendente",
  checked_in: "Check-in",
  checked_out: "Encerrado",
  absent: "Falta",
};

const CHECK_IN_COLORS: Record<ShiftWithDoctor["checkInStatus"], string> = {
  pending: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  checked_in: "text-green-600 bg-green-50 dark:bg-green-900/20",
  checked_out: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  absent: "text-destructive bg-destructive/10",
};

const CHECK_IN_ICONS: Record<ShiftWithDoctor["checkInStatus"], typeof CheckCircle2> = {
  pending: Clock,
  checked_in: CheckCircle2,
  checked_out: UserCheck,
  absent: UserX,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

function fmtHour(iso: string) {
  return format(new Date(iso), "HH:mm", { locale: ptBR });
}

/** Extrai o nome de um campo relacional que pode chegar como string ou objeto populado pelo Payload */
function resolveName(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && "name" in (field as object))
    return (field as { name: string }).name ?? "";
  return "";
}

// ─── Multi-select com chips ───────────────────────────────────────────────────

function ChipMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Todos",
}: {
  label?: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
      )}
      <div
        className="flex flex-wrap gap-1.5 min-h-9 items-center bg-card border border-border rounded-xl px-3 py-1.5 cursor-pointer hover:border-accent/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
        {selected.map((id) => {
          const opt = options.find((o) => o.value === id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 bg-accent/15 text-accent text-xs px-2 py-0.5 rounded-full"
            >
              {opt?.label ?? id}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); toggle(id); }}
              />
            </span>
          );
        })}
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">Sem opções</p>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors",
                  selected.includes(opt.value) && "text-accent font-medium"
                )}
                onMouseDown={(e) => { e.preventDefault(); toggle(opt.value); }}
              >
                <span
                  className={cn(
                    "w-3.5 h-3.5 rounded border flex-shrink-0 transition-colors",
                    selected.includes(opt.value) ? "bg-accent border-accent" : "border-border"
                  )}
                />
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal de novo plantão ────────────────────────────────────────────────────

function NewShiftModal({
  open,
  onClose,
  onSuccess,
  institutions,
  defaultInstitutionId,
  defaultDate,
  teams,
  members,
  existingJobs,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutions: InstitutionOption[];
  defaultInstitutionId: string | null;
  defaultDate?: string;
  teams: TeamItem[];
  members: InstitutionMemberParameter[];
  existingJobs: InstitutionalJob[];
}) {
  const [institutionId, setInstitutionId] = useState(defaultInstitutionId ?? "");
  const [teamId, setTeamId] = useState("");
  const [date, setDate] = useState(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("07:00");
  const [duration, setDuration] = useState("12");
  const [assignTo, setAssignTo] = useState("");
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("AV");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setInstitutionId(defaultInstitutionId ?? "");
      setTeamId("");
      setDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
      setStartTime("07:00");
      setDuration("12");
      setAssignTo("");
      setPrice("");
      setPaymentMethod("AV");
      setErrors({});
    }
  }, [open, defaultInstitutionId, defaultDate]);

  const filteredTeams = teams.filter((t) => {
    if (!institutionId) return true;
    const instId = typeof t.institution === "string" ? t.institution : t.institution.id;
    return instId === institutionId;
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!institutionId) e.institutionId = "Selecione uma instituição";
    if (!teamId) e.teamId = "Selecione um time";
    if (!date) e.date = "Selecione uma data";
    if (!assignTo) e.assignTo = "Selecione o médico responsável";

    if (assignTo && date && startTime) {
      const durationHours = parseFloat(duration) || 12;
      const newStart = new Date(`${date}T${startTime}`).getTime();
      const newEnd = newStart + durationHours * 3600000;

      const conflict = existingJobs.find((j) => {
        if (j.toProfileId !== assignTo) return false;
        const jStart = new Date(j.startDateTime).getTime();
        const jEnd = new Date(j.endDateTime).getTime();
        return newStart < jEnd && newEnd > jStart;
      });

      if (conflict) {
        const doctorName = members.find((m) => m.userId === assignTo)?.profileName ?? "médico";
        const conflictDate = format(new Date(conflict.startDateTime), "dd/MM/yyyy 'às' HH:mm");
        e.assignTo = `${doctorName} já possui plantão em ${conflictDate}`;
      }
    }

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const durationHours = parseFloat(duration) || 12;
      const startDateTime = new Date(`${date}T${startTime}`).toISOString();
      const endDateTime = new Date(
        new Date(`${date}T${startTime}`).getTime() + durationHours * 3600000
      ).toISOString();
      const priceInCents = price ? Math.round(parseFloat(price) * 100) : undefined;

      await institutionalService.createJob(institutionId, {
        team: teamId,
        to: assignTo,
        startDateTime,
        endDateTime,
        durationInHours: durationHours,
        paymentMethod,
        ...(priceInCents ? { priceInCents } : {}),
      });
      onSuccess();
      onClose();
    } catch {
      setErrors({ _: "Erro ao criar plantão. Tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  const selectCls = cn(
    "w-full h-10 rounded-xl border border-input bg-background px-3 text-sm",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Plantão</DialogTitle>
          <DialogDescription>
            Preencha os dados do plantão institucional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Instituição */}
          {institutions.length > 1 && (
            <div className="space-y-1.5">
              <Label>Instituição *</Label>
              <select
                value={institutionId}
                onChange={(e) => { setInstitutionId(e.target.value); setTeamId(""); }}
                className={cn(selectCls, errors.institutionId && "border-destructive")}
              >
                <option value="">Selecione uma instituição</option>
                {institutions.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
              {errors.institutionId && <p className="text-xs text-destructive">{errors.institutionId}</p>}
            </div>
          )}

          {/* Time */}
          <div className="space-y-1.5">
            <Label>Time *</Label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className={cn(selectCls, errors.teamId && "border-destructive")}
              disabled={!institutionId}
            >
              <option value="">Selecione um time</option>
              {filteredTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.teamId && <p className="text-xs text-destructive">{errors.teamId}</p>}
          </div>

          {/* Médico obrigatório */}
          <div className="space-y-1.5">
            <Label>Médico *</Label>
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className={cn(selectCls, errors.assignTo && "border-destructive")}
            >
              <option value="">Selecione o médico</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.profileName}</option>
              ))}
            </select>
            {errors.assignTo && <p className="text-xs text-destructive">{errors.assignTo}</p>}
          </div>

          {/* Data + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(errors.date && "border-destructive")}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Horário de início *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duração */}
          <div className="space-y-1.5">
            <Label>Duração (horas) *</Label>
            <Input
              type="number"
              value={duration}
              min={1}
              max={24}
              step={0.5}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Valor + Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor em R$ (opcional)</Label>
              <Input
                placeholder="Ex: 1200.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pagamento</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={selectCls}
              >
                <option value="AV">À Vista</option>
                <option value="NR">Nota de Repasse</option>
                <option value="AC">Acerto</option>
              </select>
            </div>
          </div>

          {errors._ && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errors._}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar plantão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Hover card de plantão ────────────────────────────────────────────────────

function ShiftHoverCard({
  shift,
  currentUserId,
  canMarkAbsent,
  canDelete,
  onCheckIn,
  onCheckOut,
  onAbsent,
  onRevertAbsent,
  onDelete,
}: {
  shift: ShiftWithDoctor;
  currentUserId?: string;
  canMarkAbsent: boolean;
  canDelete?: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onAbsent: () => void;
  onRevertAbsent: () => void;
  onDelete?: () => void;
}) {
  const Icon = CHECK_IN_ICONS[shift.checkInStatus];
  const isOwnShift       = !!currentUserId && shift.toProfileId === currentUserId;
  const showCheckIn      = isOwnShift && shift.checkInStatus === "pending";
  const showCheckOut     = isOwnShift && shift.checkInStatus === "checked_in";
  const showFalta        = canMarkAbsent && shift.checkInStatus === "pending";
  const showRevertAbsent = canMarkAbsent && shift.checkInStatus === "absent";
  const hasActions       = showCheckIn || showCheckOut || showFalta || showRevertAbsent || !!canDelete;

  return (
    <div className="space-y-2.5 text-sm border-t first:border-t-0 pt-2.5 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground leading-snug">{shift.doctorName}</p>
          <p className="text-xs text-muted-foreground">
            {fmtTime(shift.startDateTime)} – {fmtTime(shift.endDateTime)}
            {shift.clinicalArea && ` · ${resolveName(shift.clinicalArea)}`}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
            CHECK_IN_COLORS[shift.checkInStatus]
          )}
        >
          <Icon className="w-3 h-3" />
          {CHECK_IN_LABELS[shift.checkInStatus]}
        </span>
      </div>

      {hasActions && (
        <div className="flex gap-1.5">
          {showCheckIn && (
            <Button
              size="sm"
              className="h-7 text-xs flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1"
              onClick={onCheckIn}
            >
              <CheckCircle2 className="w-3 h-3" /> Check-in
            </Button>
          )}
          {showFalta && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={onAbsent}
            >
              <UserX className="w-3 h-3" />
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
          {showRevertAbsent && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 text-amber-600 border-amber-400/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 gap-1"
              onClick={onRevertAbsent}
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
          {showCheckOut && (
            <Button size="sm" variant="outline" className="h-7 text-xs flex-1 gap-1" onClick={onCheckOut}>
              <UserCheck className="w-3 h-3" /> Check-out
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Célula do dia no calendário ──────────────────────────────────────────────

function DayCell({
  date,
  shifts,
  canCheckIn,
  canMarkAbsent,
  currentUserId,
  isSelected,
  isOutsideMonth,
  onSelect,
  onCheckIn,
  onCheckOut,
  onAbsent,
  onRevertAbsent,
}: {
  date: Date;
  shifts: ShiftWithDoctor[];
  canCheckIn: boolean;
  canMarkAbsent: boolean;
  currentUserId?: string;
  isSelected: boolean;
  isOutsideMonth?: boolean;
  onSelect: () => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onAbsent: (id: string) => void;
  onRevertAbsent: (id: string) => void;
}) {
  const today = isToday(date);
  const hasShifts = shifts.length > 0;
  const absentCount = shifts.filter((s) => s.checkInStatus === "absent").length;

  // Agrupa por instituição+time para os dots
  const teamGroups = Object.entries(
    shifts.reduce<Record<string, { institutionId: string; institutionName: string; teamId: string; teamName: string; shifts: ShiftWithDoctor[] }>>(
      (acc, s) => {
        const key = `${s.institutionId}__${s.teamId}`;
        if (!acc[key]) acc[key] = {
          institutionId: s.institutionId,
          institutionName: s.institutionName ?? s.institutionId,
          teamId: s.teamId,
          teamName: s.teamName ?? s.teamId,
          shifts: [],
        };
        acc[key].shifts.push(s);
        return acc;
      },
      {}
    )
  );
  const uniqueInstCount  = new Set(shifts.map((s) => s.institutionId)).size;
  const uniqueTeamCount  = new Set(shifts.map((s) => s.teamId)).size;
  const visibleGroups    = teamGroups.slice(0, 5);
  const extraGroups      = teamGroups.length - visibleGroups.length;

  // Bolinhas de canto: esquerda = pendente/falta · direita = check-in/check-out
  const hasAbsent     = shifts.some((s) => s.checkInStatus === "absent");
  const hasPending    = shifts.some((s) => s.checkInStatus === "pending");
  const hasCheckedOut = shifts.some((s) => s.checkInStatus === "checked_out");
  const hasCheckedIn  = shifts.some((s) => s.checkInStatus === "checked_in");
  const leftDotColor  = hasAbsent  ? STATUS_RING.absent     : hasPending   ? STATUS_RING.pending    : null;
  const rightDotColor = hasCheckedOut ? STATUS_RING.checked_out : hasCheckedIn ? STATUS_RING.checked_in : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer",
        "min-h-[72px] w-full",
        isOutsideMonth && "opacity-30",
        today && "border-accent/60",
        isSelected && "bg-accent/10 border-accent",
        !isSelected && !today && "border-transparent hover:border-border hover:bg-muted/30",
      )}
    >
      {/* Bolinhas de status nos cantos superiores */}
      {hasShifts && leftDotColor && (
        <span
          className="absolute top-1.5 left-1.5 rounded-full flex-shrink-0"
          style={{ width: 7, height: 7, background: leftDotColor }}
        />
      )}
      {hasShifts && rightDotColor && (
        <span
          className="absolute top-1.5 right-1.5 rounded-full flex-shrink-0"
          style={{ width: 7, height: 7, background: rightDotColor }}
        />
      )}

      {/* Número do dia */}
      <span
        className={cn(
          "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0",
          today && "bg-accent text-accent-foreground",
          !today && "text-foreground",
        )}
      >
        {format(date, "d")}
      </span>

      {/* Resumo: "1 INT | 2 T" */}
      {hasShifts && (
        <span className="text-[11px] font-semibold text-foreground/90 leading-none">
          {uniqueInstCount} INT | {uniqueTeamCount} T
        </span>
      )}

      {/* Dots por time — split-color */}
      {hasShifts && (
        <div className="flex gap-1.5 justify-center flex-wrap">
          {visibleGroups.map(([key, group]) => {
            const ic = instColor(group.institutionId);
            const tc = teamHue(group.teamId);
            const isOwnGroup = !!currentUserId && group.shifts.some((s) => s.toProfileId === currentUserId);
            return (
              <HoverCard key={key} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <span
                    className="inline-block rounded-full cursor-pointer flex-shrink-0"
                    style={{
                      width: 11,
                      height: 11,
                      background: `linear-gradient(90deg, ${ic} 50%, ${tc} 50%)`,
                      outline: undefined,
                      outlineOffset: undefined,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </HoverCardTrigger>
                <HoverCardContent side="top" align="center" className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    <div className="pb-1.5 border-b border-border">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="rounded-full flex-shrink-0 inline-block"
                          style={{
                            width: 12,
                            height: 12,
                            background: `linear-gradient(90deg, ${ic} 50%, ${tc} 50%)`,
                          }}
                        />
                        <p className="text-sm font-semibold text-foreground leading-snug">{group.institutionName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5">{group.teamName}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5 pl-5">
                        {group.shifts.length} {group.shifts.length !== 1 ? "plantões" : "plantão"}
                      </p>
                    </div>
                    {group.shifts.map((s) => (
                      <ShiftHoverCard
                        key={s.id}
                        shift={s}
                        currentUserId={currentUserId}
                        canMarkAbsent={canMarkAbsent}
                        onCheckIn={() => onCheckIn(s.id)}
                        onCheckOut={() => onCheckOut(s.id)}
                        onAbsent={() => onAbsent(s.id)}
                        onRevertAbsent={() => onRevertAbsent(s.id)}
                      />
                    ))}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
          {extraGroups > 0 && (
            <span className="text-[9px] text-muted-foreground leading-none self-center">
              +{extraGroups}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Painel de shifts do dia selecionado ─────────────────────────────────────

function ShiftGroupCard({
  institutionName,
  teamName,
  shifts,
  canCheckIn,
  canMarkAbsent,
  canDelete,
  currentUserId,
  onCheckIn,
  onCheckOut,
  onAbsent,
  onRevertAbsent,
  onDelete,
}: {
  institutionName: string;
  teamName: string;
  shifts: ShiftWithDoctor[];
  canCheckIn: boolean;
  canMarkAbsent: boolean;
  canDelete?: boolean;
  currentUserId?: string;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onAbsent: (id: string) => void;
  onRevertAbsent: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pendingCount = shifts.filter((s) => s.checkInStatus === "pending").length;
  const absentCount  = shifts.filter((s) => s.checkInStatus === "absent").length;
  const ic = instColor(shifts[0]?.institutionId ?? '');
  const tc = teamHue(shifts[0]?.teamId ?? '');

  return (
    <>
    <Dialog open={!!confirmDeleteId} onOpenChange={(v) => { if (!v) setConfirmDeleteId(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir plantão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este plantão? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirmDeleteId) onDelete?.(confirmDeleteId);
              setConfirmDeleteId(null);
            }}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      {/* Cabeçalho do grupo — sempre visível */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span
          className="rounded-full flex-shrink-0 inline-block"
          style={{
            width: 16,
            height: 16,
            background: `linear-gradient(90deg, ${ic} 50%, ${tc} 50%)`,
          }}
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-snug">{institutionName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Users className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{teamName || "Sem time"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground/80 bg-muted/40 px-2 py-0.5 rounded-full">
              {shifts.length} {shifts.length !== 1 ? "plantões" : "plantão"}
            </span>
            {pendingCount > 0 && (
              <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                {pendingCount} pend.
              </span>
            )}
            {absentCount > 0 && (
              <span className="text-xs text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">
                {absentCount} {absentCount !== 1 ? "faltas" : "falta"}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-border/40 divide-y divide-border/30">
          {shifts
            .slice()
            .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
            .map((s) => {
              const Icon = CHECK_IN_ICONS[s.checkInStatus];
              const isOwnShift       = !!currentUserId && s.toProfileId === currentUserId;
              const showCheckIn      = isOwnShift && s.checkInStatus === "pending";
              const showCheckOut     = isOwnShift && s.checkInStatus === "checked_in";
              const showFalta        = canMarkAbsent && s.checkInStatus === "pending";
              const showRevertAbsent = canMarkAbsent && s.checkInStatus === "absent";
              const hasActions       = showCheckIn || showCheckOut || showFalta || showRevertAbsent || !!canDelete;

              return (
                <div key={s.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* Horário */}
                    <div className="text-center flex-shrink-0 w-12 pt-0.5">
                      <p className="text-sm font-bold text-foreground leading-none">
                        {fmtTime(s.startDateTime)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtTime(s.endDateTime)}
                      </p>
                    </div>

                    <div className="w-px self-stretch bg-border/60 flex-shrink-0" />

                    {/* Infos */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-sm text-foreground">
                        {s.doctorName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {s.clinicalArea && (
                          <span>{resolveName(s.clinicalArea)}</span>
                        )}
                        {s.clinicalArea && <span className="text-border">·</span>}
                        <span className="bg-muted/40 px-1.5 py-0.5 rounded-full font-medium">
                          {s.durationInHours}h
                        </span>
                        <span className="text-border">·</span>
                        <span className="text-accent font-medium">
                          R${" "}
                          {((s.priceInCents ?? 0) / 100).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                        CHECK_IN_COLORS[s.checkInStatus]
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {CHECK_IN_LABELS[s.checkInStatus]}
                    </span>
                  </div>

                  {/* Ações */}
                  {hasActions && (
                    <div className="flex gap-2 pt-1">
                      {showCheckIn && (
                        <Button
                          size="sm"
                          className="h-8 text-xs px-3 flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1.5 font-semibold"
                          onClick={() => onCheckIn(s.id)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fazer Check-in
                        </Button>
                      )}
                      {showFalta && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-3 text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                          onClick={() => onAbsent(s.id)}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Falta
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-3 text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                          onClick={() => setConfirmDeleteId(s.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </Button>
                      )}
                      {showRevertAbsent && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-3 text-amber-600 border-amber-400/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 gap-1 font-semibold"
                          onClick={() => onRevertAbsent(s.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reverter falta
                        </Button>
                      )}
                      {showCheckOut && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-3 flex-1 gap-1.5 border-blue-400/50 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          onClick={() => onCheckOut(s.id)}
                        >
                          <UserCheck className="w-3 h-3 mr-1.5" /> Check-out
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
    </>
  );
}

function OfferCard({
  offer,
  pendingSwap,
  onSwap,
  swapping,
}: {
  offer: InstitutionalJob;
  pendingSwap?: { applicantId: string; applicantName: string };
  onSwap?: () => void;
  swapping?: boolean;
}) {
  const ic = instColor(offer.institutionId ?? '');
  const tc = teamHue(offer.teamId ?? '');
  const start = new Date(offer.startDateTime);
  const end = new Date(offer.endDateTime);

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <span
          className="rounded-full flex-shrink-0 inline-block"
          style={{ width: 16, height: 16, background: `linear-gradient(90deg, ${ic} 50%, ${tc} 50%)` }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground leading-snug">
              {format(start, "HH:mm")} – {format(end, "HH:mm")}
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Oferta aberta
            </span>
          </div>
          {pendingSwap && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Aceita por <span className="font-medium text-foreground">{pendingSwap.applicantName}</span>
            </p>
          )}
        </div>
        {pendingSwap && onSwap && (
          <Button
            size="sm"
            className="h-7 text-xs shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground gap-1"
            onClick={onSwap}
            disabled={swapping}
          >
            {swapping ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Trocar Plantão
          </Button>
        )}
      </div>
    </div>
  );
}

function DayShiftList({
  date,
  shifts,
  canCheckIn,
  canMarkAbsent,
  canDelete,
  currentUserId,
  onCheckIn,
  onCheckOut,
  onAbsent,
  onRevertAbsent,
  onDelete,
  institutions,
  teams,
  dayOffers,
  pendingSwaps,
  onSwapOffer,
  swappingId,
}: {
  date: Date;
  shifts: ShiftWithDoctor[];
  canCheckIn: boolean;
  canMarkAbsent: boolean;
  canDelete?: boolean;
  currentUserId?: string;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onAbsent: (id: string) => void;
  onRevertAbsent: (id: string) => void;
  onDelete?: (id: string) => void;
  institutions: InstitutionOption[];
  teams: TeamItem[];
  dayOffers?: InstitutionalJob[];
  pendingSwaps?: Map<string, { applicantId: string; applicantName: string }>;
  onSwapOffer?: (offer: InstitutionalJob, applicantId: string) => void;
  swappingId?: string | null;
}) {
  if (shifts.length === 0 && (!dayOffers || dayOffers.length === 0)) {
    return (
      <div className="bg-card rounded-xl p-8 text-center text-muted-foreground border">
        <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhum plantão neste dia.</p>
      </div>
    );
  }

  // Agrupa por instituição + time
  const groups = shifts.reduce<
    Record<string, { institutionName: string; teamName: string; shifts: ShiftWithDoctor[] }>
  >((acc, s) => {
    const key = `${s.institutionId}__${s.teamId}`;
    if (!acc[key]) {
      acc[key] = {
        institutionName: institutions.find((i) => i.value === s.institutionId)?.label ?? s.institutionId,
        teamName: teams.find((t) => t.id === s.teamId)?.name ?? "",
        shifts: [],
      };
    }
    acc[key].shifts.push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })} — {shifts.length}{" "}
        {shifts.length !== 1 ? "plantões" : "plantão"}
      </p>
      {Object.entries(groups).map(([key, group]) => (
        <ShiftGroupCard
          key={key}
          institutionName={group.institutionName}
          teamName={group.teamName}
          shifts={group.shifts}
          canCheckIn={canCheckIn}
          canMarkAbsent={canMarkAbsent}
          canDelete={canDelete}
          currentUserId={currentUserId}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
          onAbsent={onAbsent}
          onRevertAbsent={onRevertAbsent}
          onDelete={onDelete}
        />
      ))}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-2">
        Ofertas{dayOffers && dayOffers.length > 0 ? ` (${dayOffers.length})` : ""}
      </p>
      {!dayOffers || dayOffers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Nenhuma oferta acertada para este dia.</p>
        </div>
        
      ) : (
        dayOffers.map(offer => {
          const swap = pendingSwaps?.get(offer.id);
          return (
            <OfferCard
              key={offer.id}
              offer={offer}
              pendingSwap={swap}
              onSwap={swap ? () => onSwapOffer?.(offer, swap.applicantId) : undefined}
              swapping={swappingId === offer.id}
            />
          );
        })
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function InstitutionalSchedule() {
  const { user } = useAuthContext();
  const { medicoModeActive } = useUserMode();
  const {
    institutions,
    selectedInstitutionId,
    myPermissions,
    hasOperationalPermission,
  } = useInstitutionalContext();

  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [filterInstIds, setFilterInstIds] = useState<string[]>([]);
  const [filterTeamIds, setFilterTeamIds] = useState<string[]>([]);
  const [filterMedicoIds, setFilterMedicoIds] = useState<string[]>([]);
  const [newShiftOpen, setNewShiftOpen] = useState(false);
  const [replicatingWeek, setReplicatingWeek] = useState<Date | null>(null);

  const isEscalista = myPermissions?.role === "scheduler";
  // canCheckIn: pode validar presença de qualquer médico (responsável / validate_checkin)
  const canCheckIn =
    myPermissions?.role === "responsible" ||
    hasOperationalPermission("validate_checkin");
  // canMarkAbsent: idem, mas não é mostrado no modo médico
  const canMarkAbsent = canCheckIn && !medicoModeActive;
  const canCreateShift =
    isEscalista ||
    myPermissions?.role === "institutional" ||
    myPermissions?.role === "administrative" ||
    hasOperationalPermission("manage_shifts");
  const canReplicate = canCreateShift;

  const { addNotification } = useScheduleNotifications();

  const {
    jobs: allJobs,
    offers,
    members,
    teams,
    loading,
    replicating,
    error,
    reload,
    replicateShifts,
    markCheckIn,
    monthStart,
  } = useInstitutionalSchedule(selectedInstitutionId, monthDate);

  const [pendingSwaps, setPendingSwaps] = useState<Map<string, { applicantId: string; applicantName: string }>>(new Map());
  const [swappingId, setSwappingId] = useState<string | null>(null);

  useEffect(() => {
    const offersWithParent = offers.filter(o => !!(o as InstitutionalJob & { parentRef?: string }).parentRef);
    if (!offersWithParent.length) { setPendingSwaps(new Map()); return; }

    jobApplicationService.getJobApplications({
      where: { and: [
        { job: { in: offersWithParent.map(o => o.id) } },
        { status: { equals: 'ACCEPTED' } },
      ] } as Record<string, unknown>,
      depth: 1,
      limit: 100,
      sort: '-createdAt',
    }).then(res => {
      const map = new Map<string, { applicantId: string; applicantName: string }>();
      for (const app of res.docs) {
        const jobField = app.job as unknown as { id?: string } | string;
        const applicantField = app.applicant as unknown as { id?: string; profileName?: string } | string;
        const jobId = typeof jobField === 'object' ? jobField.id ?? '' : String(app.job ?? '');
        const applicantId = typeof applicantField === 'object' ? applicantField.id ?? '' : String(app.applicant ?? '');
        const applicantName = typeof applicantField === 'object' ? applicantField.profileName ?? '—' : '—';
        if (jobId) map.set(jobId, { applicantId, applicantName });
      }
      setPendingSwaps(map);
    }).catch(() => {});
  }, [offers]);

  // Filtra jobs client-side
  const filteredJobs = allJobs.filter((j) => {
    if (filterInstIds.length > 0 && !filterInstIds.includes(j.institutionId)) return false;
    if (filterTeamIds.length > 0 && !filterTeamIds.includes(j.teamId)) return false;
    if (medicoModeActive) {
      // Modo médico: exibe apenas os plantões do próprio usuário
      if (j.toProfileId !== user?.id) return false;
    } else if (filterMedicoIds.length > 0) {
      if (j.toProfileId && !filterMedicoIds.includes(j.toProfileId)) return false;
    }
    return true;
  });

  const byDay = filteredJobs.reduce<Record<string, typeof filteredJobs>>(
    (acc, job) => {
      const day = format(new Date(job.startDateTime), "yyyy-MM-dd");
      (acc[day] ??= []).push(job);
      return acc;
    },
    {}
  );

  // Constrói grade mensal: semanas completas cobrindo o mês
  const calFirstDay = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calLastDay = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calFirstDay, end: calLastDay });
  const calendarWeeks: Date[][] = Array.from(
    { length: calDays.length / 7 },
    (_, i) => calDays.slice(i * 7, i * 7 + 7)
  );

  const selectedShifts = byDay[selectedDay] ?? [];

  const handleCheckIn = async (jobId: string) => {
    await markCheckIn(jobId, "in");
    addNotification("check_in", "Check-in registrado com sucesso.");
  };

  const handleCheckOut = async (jobId: string) => {
    await markCheckIn(jobId, "out");
    addNotification("check_in", "Check-out registrado com sucesso.");
  };

  const handleAbsent = async (jobId: string) => {
    await markCheckIn(jobId, "absent");
    addNotification("check_in", "Falta registrada.");
  };

  const handleRevertAbsent = async (jobId: string) => {
    await markCheckIn(jobId, "revert-absent");
    addNotification("check_in", "Falta revertida.");
  };

  const handleDeleteShift = async (jobId: string) => {
    try {
      await institutionalService.deleteJob(jobId);
      reload();
      addNotification("shift_created", "Plantão excluído.");
    } catch {
      addNotification("error", "Erro ao excluir plantão.");
    }
  };

  const handleReplicateConfirm = async (
    toCreate: ShiftToCreate[],
    includeDoctors: boolean
  ) => {
    await replicateShifts(toCreate, includeDoctors);
    addNotification("shift_created", "Agenda da semana replicada com sucesso.");
    setReplicatingWeek(null);
  };

  const handleNewShiftSuccess = () => {
    reload();
    addNotification("shift_created", "Novo plantão criado com sucesso.");
  };

  // Ofertas do dia selecionado (parentRef = troca de plantão)
  const dayOffers = useMemo(() => {
    return offers.filter(
      (o) => format(new Date(o.startDateTime), "yyyy-MM-dd") === selectedDay
    );
  }, [offers, selectedDay]);

  // Homologar troca: aceita aplicação e realoca médico no plantão original
  const handleSwapOffer = async (offer: InstitutionalJob, applicantId: string) => {
    setSwappingId(offer.id);
    try {
      // Busca a aplicação aceita para este offer
      const res = await jobApplicationService.getJobApplications({
        where: { and: [
          { job: { equals: offer.id } },
          { status: { equals: 'ACCEPTED' } },
          { applicant: { equals: applicantId } },
        ] } as Record<string, unknown>,
        depth: 0,
        limit: 1,
      });
      const app = res.docs[0];
      if (!app) throw new Error("Aplicação não encontrada");
      // Homologa via serviço institucional
      await institutionalService.homologateApplication(app.id, 'APPROVED');
      await reload();
      setPendingSwaps((prev) => {
        const next = new Map(prev);
        next.delete(offer.id);
        return next;
      });
      addNotification("shift_created", "Troca de plantão homologada com sucesso.");
    } catch {
      addNotification("error", "Erro ao homologar troca de plantão.");
    } finally {
      setSwappingId(null);
    }
  };

  const totalMonthShifts = filteredJobs.length;
  const totalPending = filteredJobs.filter((s) => s.checkInStatus === "pending").length;

  const institutionOptions = institutions.map((i) => ({ value: i.value, label: i.label }));
  const medicoOptions = members.map((m) => ({ value: m.userId, label: m.profileName }));
  const teamOptions = teams
    .filter((t) => {
      if (filterInstIds.length === 0) return true;
      const instId = typeof t.institution === "string" ? t.institution : t.institution.id;
      return filterInstIds.includes(instId);
    })
    .map((t) => ({ value: t.id, label: t.name }));

  const roleLabel =
    myPermissions?.role === "scheduler"
      ? "Escalista"
      : myPermissions?.role === "responsible"
      ? "Responsável"
      : myPermissions?.role === "administrative"
      ? "Administrativo"
      : "Institucional";

  const selectedDayDate = new Date(selectedDay + "T12:00:00");

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Agenda</h1>
            {myPermissions?.role && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                {roleLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalMonthShifts} {totalMonthShifts === 1 ? "plantão" : "plantões"}{" "}
            {medicoModeActive ? "meus plantões neste mês" : "neste mês"}
            {canCheckIn && totalPending > 0 && (
              <span className="ml-2 text-amber-600">
                · {totalPending} check-in{totalPending !== 1 ? "s" : ""} pendente{totalPending !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="h-8 px-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>

          {canCreateShift && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setNewShiftOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo plantão
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <ChipMultiSelect
            label="Instituições"
            options={institutionOptions}
            selected={filterInstIds}
            onChange={(ids) => { setFilterInstIds(ids); setFilterTeamIds([]); }}
            placeholder="Todas as instituições"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <ChipMultiSelect
            label="Times"
            options={teamOptions}
            selected={filterTeamIds}
            onChange={setFilterTeamIds}
            placeholder="Todos os times"
          />
        </div>
        {!medicoModeActive && (
          <div className="flex-1 min-w-[180px]">
            <ChipMultiSelect
              label="Médico"
              options={medicoOptions}
              selected={filterMedicoIds}
              onChange={setFilterMedicoIds}
              placeholder="Todos os médicos"
            />
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Layout dois colunas: calendário + painel lateral */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Coluna esquerda: calendário mensal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border p-4 space-y-4">
            {/* Navegação mensal */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonthDate((d) => subMonths(d, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <p className="text-sm font-semibold text-foreground capitalize">
                {format(monthStart, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMonthDate((d) => addMonths(d, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Cabeçalho dias da semana */}
            <div className="grid grid-cols-7 gap-1.5 text-center" style={{ paddingLeft: canReplicate ? "52px" : undefined }}>
              {WEEK_DAYS.map((d) => (
                <span key={d} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {d}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {calendarWeeks.map((week) => {
                  const weekStartDate = week[0];
                  const weekKey = format(weekStartDate, "yyyy-MM-dd");
                  const weekHasShifts = week.some((d) => (byDay[format(d, "yyyy-MM-dd")]?.length ?? 0) > 0);

                  return (
                    <div key={weekKey} className="flex items-stretch gap-1.5">
                      {/* Botão de replicar no lado esquerdo */}
                      {canReplicate ? (
                        <button
                          type="button"
                          onClick={() => weekHasShifts && setReplicatingWeek(weekStartDate)}
                          disabled={replicating || !weekHasShifts}
                          title={weekHasShifts ? "Replicar agenda desta semana" : "Nenhum plantão nesta semana"}
                          className={cn(
                            "w-[44px] flex-shrink-0 flex items-center justify-center rounded-lg border",
                            "text-[9px] font-semibold uppercase tracking-wider transition-colors",
                            "[writing-mode:vertical-lr] rotate-180",
                            weekHasShifts && !replicating
                              ? "border-accent/40 text-accent hover:bg-accent/10 bg-accent/5 cursor-pointer"
                              : "border-border text-muted-foreground/40 cursor-not-allowed bg-muted/20"
                          )}
                        >
                          {replicating && replicatingWeek && format(replicatingWeek, "yyyy-MM-dd") === weekKey
                            ? <Loader2 className="w-3 h-3 animate-spin" style={{ writingMode: "horizontal-tb" }} />
                            : "Replicar Semana"}
                        </button>
                      ) : (
                        <div className="w-[44px] flex-shrink-0" />
                      )}

                      {/* 7 células de dia */}
                      <div className="grid grid-cols-7 gap-1.5 flex-1">
                        {week.map((day) => {
                          const key = format(day, "yyyy-MM-dd");
                          return (
                            <DayCell
                              key={key}
                              date={day}
                              shifts={byDay[key] ?? []}
                              canCheckIn={canCheckIn}
                              canMarkAbsent={canMarkAbsent}
                              currentUserId={user?.id}
                              isSelected={selectedDay === key}
                              isOutsideMonth={!isSameMonth(day, monthDate)}
                              onSelect={() => setSelectedDay(key)}
                              onCheckIn={handleCheckIn}
                              onCheckOut={handleCheckOut}
                              onAbsent={handleAbsent}
                              onRevertAbsent={handleRevertAbsent}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legenda de check-in — bolinhas sólidas */}
          <div className="flex items-center gap-4 px-1 flex-wrap">
            {(["pending", "checked_in", "checked_out", "absent"] as const).map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block rounded-full flex-shrink-0"
                  style={{ width: 8, height: 8, background: STATUS_RING[s] }}
                />
                {CHECK_IN_LABELS[s]}
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita: detalhes do dia selecionado */}
        <div className="space-y-3">
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground capitalize text-sm">
                  {format(selectedDayDate, "EEEE", { locale: ptBR })}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {format(selectedDayDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedShifts.length === 0
                ? "Nenhum plantão neste dia"
                : `${selectedShifts.length} ${selectedShifts.length !== 1 ? "plantões" : "plantão"}`}
            </p>
          </div>

          <DayShiftList
            date={selectedDayDate}
            shifts={selectedShifts}
            canCheckIn={canCheckIn}
            canMarkAbsent={canMarkAbsent}
            canDelete={!medicoModeActive && canCreateShift}
            currentUserId={user?.id}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onAbsent={handleAbsent}
            onRevertAbsent={handleRevertAbsent}
            onDelete={handleDeleteShift}
            institutions={institutions}
            teams={teams}
            dayOffers={dayOffers}
            pendingSwaps={pendingSwaps}
            onSwapOffer={handleSwapOffer}
            swappingId={swappingId}
          />
        </div>
      </div>

      <NewShiftModal
        open={newShiftOpen}
        onClose={() => setNewShiftOpen(false)}
        onSuccess={handleNewShiftSuccess}
        institutions={institutions}
        defaultInstitutionId={selectedInstitutionId}
        defaultDate={selectedDay ?? undefined}
        teams={teams}
        members={members}
        existingJobs={allJobs}
      />

      <WeekReplicationModal
        open={!!replicatingWeek}
        onClose={() => setReplicatingWeek(null)}
        sourceWeekStart={replicatingWeek}
        allJobs={allJobs}
        onConfirm={handleReplicateConfirm}
      />
    </div>
  );
}
