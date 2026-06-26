import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Job } from "@/types/api.types";
import {
  ResponsiveDialogHeaderComp,
  ResponsiveDialogBody,
  ResponsiveDialogFooterComp,
  ResponsiveDialogRoot,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Stethoscope,
  Check,
  Loader2,
  Clock,
  Eye,
  User,
} from "lucide-react";
import { formatCurrency } from "@/utils/numberFormatter";
import { formatPaymentMethod, getJobDateInfo } from "@/utils/job.helper";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {PAYMENT_METHOD_COLORS, PAYMENT_METHOD_VARIANTS} from "@/ui/themes/constants.ts";

type JobWithReceivedAt = Job & { receivedAt?: string | null };

interface RecebimentoDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (jobId: string, updates: Partial<Job>) => Promise<void>;
}

const formSchema = z
  .object({
    isReceived: z.boolean(),
    paymentDate: z.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isReceived && !data.paymentDate) {
        return false;
      }
      return true;
    },
    {
      message: "A data de recebimento é obrigatória quando marcado como pago",
      path: ["paymentDate"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

export function WalletDetailsModal({
  job,
  isOpen,
  onClose,
  onUpdate,
}: RecebimentoDetailsModalProps) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isReceived: false,
      paymentDate: new Date(),
    },
  });

  const isReceivedWatch = form.watch("isReceived");

  useEffect(() => {
    if (job && isOpen) {
      const received = !!(job as JobWithReceivedAt).receivedAt;
      form.setValue("isReceived", received);
      if (received && (job as JobWithReceivedAt).receivedAt) {
        form.setValue(
          "paymentDate",
          new Date((job as JobWithReceivedAt).receivedAt!),
        );
      } else {
        form.setValue("paymentDate", new Date());
      }
    }
  }, [job, isOpen, form]);

  // P7: Build tags like the app does
  const tags = useMemo(() => {
    if (!job) return [];
    const result: {
      label: string;
      variant: "purple" | "green" | "lime" | "default";
    }[] = [];

    if (job.modality?.name) {
      result.push({ label: job.modality.name, variant: "purple" });
    }
    if (job.durationInHours) {
      result.push({ label: `${job.durationInHours}h`, variant: "default" });
    }
    if (job.clinicalArea?.name) {
      result.push({ label: job.clinicalArea.name, variant: "green" });
    }
    if (job.visibility === "PRIVATE") {
      result.push({ label: "Você agendou", variant: "lime" });
    }
    const jobTo = job.to && typeof job.to !== "string" ? job.to : undefined;
    const jobFrom =
      job.from && typeof job.from !== "string" ? job.from : undefined;
    if (jobTo?.id === user?.id && jobFrom?.id !== user?.id && jobFrom?.name) {
      const firstName = jobFrom.name.split(" ")[0];
      result.push({ label: `Transferido por ${firstName}`, variant: "lime" });
    }

    return result;
  }, [job, user]);

  const onSubmit = async (values: FormValues) => {
    if (!job) return;

    setIsUpdating(true);
    try {
      let newDate = null;
      if (values.isReceived && values.paymentDate) {
        const dateStr = format(values.paymentDate, "yyyy-MM-dd");
        newDate = new Date(dateStr + "T12:00:00Z").toISOString();
      }

      const currentReceivedAt = (job as JobWithReceivedAt).receivedAt;
      const statusChanged = !!currentReceivedAt !== values.isReceived;

      let dateChanged = false;
      if (values.isReceived && currentReceivedAt && newDate) {
        dateChanged =
          format(new Date(currentReceivedAt), "yyyy-MM-dd") !==
          format(new Date(newDate), "yyyy-MM-dd");
      }

      if (statusChanged || dateChanged) {
        await onUpdate(job.id, {
          receivedAt: newDate as unknown,
        } as Partial<Job>);
      }
      onClose();
      toast.success("Data alterada com sucesso!");
    } catch (error) {
      toast.error("Erro ao alterar data");
    } finally {
      setIsUpdating(false);
    }
  };

  // P7: Navigate to job details
  const handleViewJob = () => {
    if (!job) return;
    onClose();
    navigate(`/jobs?jobId=${job.id}`);
  };

  if (!job) return null;

  const amount = job.priceInCents ? job.priceInCents / 100 : 0;
  const itemDate = getJobDateInfo(job);
  const hasMultiple = job.additionalDates && job.additionalDates.length > 0;

  // P7: Schedule info
  const hasSchedule = job.startDateTime && job.endDateTime;

  return (
    <ResponsiveDialogRoot open={isOpen} onOpenChange={onClose} maxWidth="35vw">
      <ResponsiveDialogHeaderComp title="Detalhes do Recebimento" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ResponsiveDialogBody>
            <div className="flex flex-col gap-6">
              {/* Card Detalhes do Plantão — Enriched (P7) */}
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-1 leading-tight">
                      {((job.place as unknown as Record<string, unknown>)
                        ?.name as string) || (job.place as unknown as string)}
                    </h3>
                    {/* P7: Tags like app (modality, duration, clinicalArea, visibility) */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {tags.map((tag, i) => (
                        <Chip
                          key={i}
                          variant={
                            tag.variant === "default" ? "purple" : tag.variant
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        >
                          {tag.variant === "purple" && (
                            <Stethoscope className="w-3.5 h-3.5" />
                          )}
                          {tag.variant === "default" && (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {tag.label}
                        </Chip>
                      ))}
                      {hasMultiple && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          +{job.additionalDates!.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xl font-bold font-mono tracking-tight text-emerald-600 block">
                      {formatCurrency(amount, false)}
                    </span>
                    <Chip
                      className="text-xs rounded-full font-xs text-center"
                      variant={PAYMENT_METHOD_VARIANTS[job.paymentMethod] || "default"}
                    >
                      {formatPaymentMethod(job.paymentMethod)}
                    </Chip>
                  </div>
                </div>

                {/* P7: Schedule info */}
                <div className="flex items-center gap-2 mt-4 text-sm font-medium text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/30">
                  <Calendar className="w-4 h-4 text-primary/70" />
                  <span>
                    {format(itemDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                  {hasSchedule && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <Clock className="w-3.5 h-3.5 text-primary/70" />
                      <span>
                        {format(new Date(job.startDateTime!), "HH:mm")} –{" "}
                        {format(new Date(job.endDateTime!), "HH:mm")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Seletor de Status */}
              <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
                <FormField
                  control={form.control}
                  name="isReceived"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div>
                        <p className="text-base font-semibold text-foreground mb-1">
                          Status do Recebimento
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            field.value ? "text-emerald-600" : "text-amber-600",
                          )}
                        >
                          {field.value ? "Pago" : "Não recebido"}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isUpdating}
                          className="data-[state=checked]:bg-emerald-500 scale-125 mr-2"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isReceivedWatch && (
                  <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-sm font-medium text-foreground mb-2">
                            Data de Recebimento
                          </p>
                          <FormControl>
                            <DatePicker
                              date={field.value || undefined}
                              onDateChange={field.onChange}
                              disabled={isUpdating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooterComp>
            <div className="flex items-center gap-3 w-full sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUpdating}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirmar
              </Button>
            </div>
          </ResponsiveDialogFooterComp>
        </form>
      </Form>
    </ResponsiveDialogRoot>
  );
}
