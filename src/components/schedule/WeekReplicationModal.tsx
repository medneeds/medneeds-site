import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ShiftWithDoctor } from "@/hooks/schedule/useInstitutionalSchedule";
import {
  addWeeks,
  differenceInCalendarDays,
  endOfWeek,
  format,
  subWeeks,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShiftToCreate {
  shift: ShiftWithDoctor;
  targetDate: Date;
  targetStart: Date;
  targetEnd: Date;
}

interface ConflictInfo {
  shift: ShiftWithDoctor;
  targetDate: Date;
  reason: string;
}

interface PreviewData {
  toCreate: ShiftToCreate[];
  conflicts: ConflictInfo[];
}

export interface WeekReplicationModalProps {
  open: boolean;
  onClose: () => void;
  sourceWeekStart: Date | null;
  allJobs: ShiftWithDoctor[];
  onConfirm: (toCreate: ShiftToCreate[], includeDoctors: boolean) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computePreview(
  sourceShifts: ShiftWithDoctor[],
  sourceWeekStart: Date,
  targetWeekStart: Date,
  includeDoctors: boolean,
  allJobs: ShiftWithDoctor[]
): PreviewData {
  const toCreate: ShiftToCreate[] = [];
  const conflicts: ConflictInfo[] = [];

  const targetDayMap = allJobs.reduce<Record<string, ShiftWithDoctor[]>>((acc, j) => {
    const key = format(new Date(j.startDateTime), "yyyy-MM-dd");
    (acc[key] ??= []).push(j);
    return acc;
  }, {});

  for (const shift of sourceShifts) {
    const shiftStart = new Date(shift.startDateTime);
    const dayOffset = differenceInCalendarDays(shiftStart, sourceWeekStart);

    const targetDate = addDays(targetWeekStart, dayOffset);
    const targetStart = new Date(targetDate);
    targetStart.setHours(shiftStart.getHours(), shiftStart.getMinutes(), 0, 0);
    const targetEnd = new Date(
      targetStart.getTime() + shift.durationInHours * 60 * 60 * 1000
    );

    const targetKey = format(targetDate, "yyyy-MM-dd");
    const existingInTarget = targetDayMap[targetKey] ?? [];

    const timeConflict = existingInTarget.find((ex) => {
      const exStart = new Date(ex.startDateTime);
      const exEnd = new Date(ex.endDateTime);
      return (
        targetStart < exEnd &&
        targetEnd > exStart &&
        ex.institutionId === shift.institutionId &&
        ex.teamId === shift.teamId
      );
    });

    if (timeConflict) {
      conflicts.push({
        shift,
        targetDate,
        reason: `Já existe plantão em ${format(targetDate, "dd/MM", { locale: ptBR })} no mesmo horário`,
      });
      continue;
    }

    if (includeDoctors && shift.toProfileId) {
      const doctorConflict = existingInTarget.find((ex) => {
        const exStart = new Date(ex.startDateTime);
        const exEnd = new Date(ex.endDateTime);
        return (
          targetStart < exEnd &&
          targetEnd > exStart &&
          ex.toProfileId === shift.toProfileId
        );
      });
      if (doctorConflict) {
        conflicts.push({
          shift,
          targetDate,
          reason: `Médico já escalado em outro plantão em ${format(targetDate, "dd/MM", { locale: ptBR })}`,
        });
        continue;
      }
    }

    toCreate.push({ shift, targetDate, targetStart, targetEnd });
  }

  return { toCreate, conflicts };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function WeekReplicationModal({
  open,
  onClose,
  sourceWeekStart,
  allJobs,
  onConfirm,
}: WeekReplicationModalProps) {
  const [step, setStep] = useState<"pick" | "preview">("pick");
  const [targetWeekStart, setTargetWeekStart] = useState<Date>(
    () => (sourceWeekStart ? addWeeks(sourceWeekStart, 1) : new Date())
  );
  const [includeDoctors, setIncludeDoctors] = useState(false);
  const [working, setWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && sourceWeekStart) {
      setStep("pick");
      setTargetWeekStart(addWeeks(sourceWeekStart, 1));
      setIncludeDoctors(false);
      setErrorMsg(null);
    }
  }, [open, sourceWeekStart]);

  const sourceWeekEnd = sourceWeekStart
    ? endOfWeek(sourceWeekStart, { weekStartsOn: 0 })
    : null;
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 0 });

  const sourceShifts = useMemo(() => {
    if (!sourceWeekStart || !sourceWeekEnd) return [];
    const wStart = format(sourceWeekStart, "yyyy-MM-dd");
    const wEnd = format(sourceWeekEnd, "yyyy-MM-dd");
    return allJobs.filter((j) => {
      const d = format(new Date(j.startDateTime), "yyyy-MM-dd");
      return d >= wStart && d <= wEnd;
    });
  }, [allJobs, sourceWeekStart, sourceWeekEnd]);

  const preview = useMemo(() => {
    if (!sourceWeekStart) return null;
    return computePreview(
      sourceShifts,
      sourceWeekStart,
      targetWeekStart,
      includeDoctors,
      allJobs
    );
  }, [sourceShifts, sourceWeekStart, targetWeekStart, includeDoctors, allJobs]);

  const handleConfirm = async () => {
    if (!preview || preview.toCreate.length === 0) return;
    setWorking(true);
    setErrorMsg(null);
    try {
      await onConfirm(preview.toCreate, includeDoctors);
      onClose();
    } catch {
      setErrorMsg("Não foi possível replicar a agenda da semana. Tente novamente.");
    } finally {
      setWorking(false);
    }
  };

  if (!sourceWeekStart || !sourceWeekEnd) return null;

  const affectedDaysCount = preview
    ? new Set(preview.toCreate.map((i) => format(i.targetDate, "yyyy-MM-dd"))).size
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !working && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Copy className="w-4 h-4 text-accent" />
            </div>
            <div>
              <DialogTitle>Replicar agenda da semana</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {format(sourceWeekStart, "dd/MM", { locale: ptBR })} a{" "}
                {format(sourceWeekEnd, "dd/MM/yyyy", { locale: ptBR })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── Passo 1: Escolher semana destino ── */}
          {step === "pick" && (
            <>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Semana origem
                </p>
                <p className="font-semibold text-sm text-foreground">
                  {format(sourceWeekStart, "dd 'de' MMMM", { locale: ptBR })} a{" "}
                  {format(sourceWeekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sourceShifts.length === 0
                    ? "Nenhum plantão nesta semana"
                    : `${sourceShifts.length} ${sourceShifts.length !== 1 ? "plantões" : "plantão"} encontrado${sourceShifts.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Semana destino</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => setTargetWeekStart((p) => subWeeks(p, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center rounded-xl border border-input bg-muted/20 px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">
                      {format(targetWeekStart, "dd/MM", { locale: ptBR })} a{" "}
                      {format(targetWeekEnd, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => setTargetWeekStart((p) => addWeeks(p, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/10 cursor-pointer"
                onClick={() => setIncludeDoctors(v => !v)}>
                <Checkbox
                  id="includeDoctors"
                  checked={includeDoctors}
                  onCheckedChange={(v) => setIncludeDoctors(!!v)}
                  className="mt-0.5"
                />
                <div className="select-none">
                  <Label htmlFor="includeDoctors" className="text-sm font-medium cursor-pointer">
                    Replicar médicos escalados também
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Copia a atribuição do médico junto com o plantão
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── Passo 2: Prévia ── */}
          {step === "preview" && preview && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                  <p className="text-2xl font-bold text-emerald-400">
                    {preview.toCreate.length}
                  </p>
                  <p className="text-xs text-emerald-400/80 mt-0.5">Serão criados</p>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-3 border",
                    preview.conflicts.length > 0
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-muted/20 border-border"
                  )}
                >
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      preview.conflicts.length > 0
                        ? "text-amber-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {preview.conflicts.length}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      preview.conflicts.length > 0
                        ? "text-amber-400/80"
                        : "text-muted-foreground/70"
                    )}
                  >
                    Conflitos
                  </p>
                </div>
                <div className="bg-muted/20 rounded-xl p-3 border border-border">
                  <p className="text-2xl font-bold text-foreground">{affectedDaysCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Dias afetados</p>
                </div>
              </div>

              <div className="bg-muted/20 rounded-xl px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  <span className="font-medium text-foreground">Destino:</span>{" "}
                  {format(targetWeekStart, "dd/MM", { locale: ptBR })} a{" "}
                  {format(targetWeekEnd, "dd/MM/yyyy", { locale: ptBR })}
                  {includeDoctors && (
                    <span className="ml-2 text-accent">· médicos incluídos</span>
                  )}
                </span>
              </div>

              {preview.conflicts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Plantões ignorados por conflito ({preview.conflicts.length})
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
                    {preview.conflicts.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-1.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-foreground font-medium">
                            {format(new Date(c.shift.startDateTime), "HH:mm")}–
                            {format(new Date(c.shift.endDateTime), "HH:mm")}
                          </span>
                          <span className="text-muted-foreground ml-1.5">
                            — {c.reason}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.toCreate.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Nenhum plantão pode ser criado na semana destino.
                </p>
              )}
            </>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl px-3 py-2.5 text-sm mb-1">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          {step === "pick" && (
            <>
              <Button variant="outline" onClick={onClose} type="button" className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("preview")}
                disabled={sourceShifts.length === 0}
                type="button"
                className="flex-1 sm:flex-none"
              >
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Pré-visualizar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  working || sourceShifts.length === 0 || !preview || preview.toCreate.length === 0
                }
                className="btn-lime flex-1 sm:flex-none"
                type="button"
              >
                {working ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Copy className="w-4 h-4 mr-1.5" />
                )}
                Confirmar replicação
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("pick")}
                disabled={working}
                type="button"
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={working}
                type="button"
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={working || !preview || preview.toCreate.length === 0}
                className="btn-lime flex-1 sm:flex-none"
                type="button"
              >
                {working ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Replicando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Confirmar replicação
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
