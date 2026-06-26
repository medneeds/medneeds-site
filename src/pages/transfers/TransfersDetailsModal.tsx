import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Job } from "@/types/api.types";
import {
  ResponsiveDialog,
  ResponsiveDialogHeaderComp,
  ResponsiveDialogBody,
  ResponsiveDialogFooterComp,
  ResponsiveDialogRoot,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar, Stethoscope, Check, Loader2 } from "lucide-react";
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
import {PAYMENT_METHOD_VARIANTS} from "@/ui/themes/constants.ts";

type JobWithPaidAt = Job & { paidAt?: string | null };

interface TransferenciaDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (jobId: string, updates: Partial<Job>) => Promise<void>;
}

const formSchema = z
  .object({
    isPaid: z.boolean(),
    paymentDate: z.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isPaid && !data.paymentDate) {
        return false;
      }
      return true;
    },
    {
      message: "A data de pagamento é obrigatória quando marcado como pago",
      path: ["paymentDate"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

export function TransfersDetailsModal({
  job,
  isOpen,
  onClose,
  onUpdate,
}: TransferenciaDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isPaid: false,
      paymentDate: new Date(),
    },
  });

  const isPaidWatch = form.watch("isPaid");

  useEffect(() => {
    if (job && isOpen) {
      const paid = !!(job as JobWithPaidAt).paidAt;
      form.setValue("isPaid", paid);
      if (paid && (job as JobWithPaidAt).paidAt) {
        form.setValue("paymentDate", new Date((job as JobWithPaidAt).paidAt!));
      } else {
        form.setValue("paymentDate", new Date());
      }
    }
  }, [job, isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    if (!job) return;

    setIsUpdating(true);
    try {
      let newDate = null;
      if (values.isPaid && values.paymentDate) {
        const dateStr = format(values.paymentDate, "yyyy-MM-dd");
        newDate = new Date(dateStr + "T12:00:00Z").toISOString();
      }

      const currentPaidAt = (job as JobWithPaidAt).paidAt;
      const statusChanged = !!currentPaidAt !== values.isPaid;

      let dateChanged = false;
      if (values.isPaid && currentPaidAt && newDate) {
        dateChanged =
          format(new Date(currentPaidAt), "yyyy-MM-dd") !==
          format(new Date(newDate), "yyyy-MM-dd");
      }

      if (statusChanged || dateChanged) {
        await onUpdate(job.id, {
          paidAt: newDate as unknown,
        } as Partial<Job>);
      }
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar transferência:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!job)
    return (
      <ResponsiveDialog open={isOpen} onOpenChange={onClose} children={null} />
    );

  const amount = job.priceInCents ? job.priceInCents / 100 : 0;
  const itemDate = getJobDateInfo(job);
  const hasMultiple = job.additionalDates && job.additionalDates.length > 0;

  return (
    <ResponsiveDialogRoot open={isOpen} onOpenChange={onClose} maxWidth="35vw">
      <ResponsiveDialogHeaderComp title="Detalhes da Transferência" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ResponsiveDialogBody>
            <div className="flex flex-col gap-6">
              {/* Card Detalhes do Plantão */}
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-1 leading-tight">
                      {((job.place as Record<string, unknown>)
                        ?.name as string) || (job.place as unknown as string)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Chip
                        variant={"purple"}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        {((job.modality as Record<string, unknown>)
                          ?.name as string) || "Geral"}
                      </Chip>
                      {job.clinicalArea && (
                        <Chip
                          variant="green"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        >
                          {
                            (job.clinicalArea as Record<string, unknown>)
                              .name as string
                          }
                        </Chip>
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

                <div className="flex items-center gap-2 mt-4 text-sm font-medium text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/30">
                  <Calendar className="w-4 h-4 text-primary/70" />
                  <span>
                    {format(itemDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {/* Seletor de Status */}
              <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div>
                        <p className="text-base font-semibold text-foreground mb-1">
                          Status da Transferência
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            field.value ? "text-emerald-600" : "text-amber-600",
                          )}
                        >
                          {field.value ? "Pago" : "Pendente"}
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

                {isPaidWatch && (
                  <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-sm font-medium text-foreground mb-2">
                            Data de Pagamento
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
