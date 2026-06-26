import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveDialogHeaderComp,
  ResponsiveDialogBody,
  ResponsiveDialogFooterComp,
  ResponsiveDialogRoot,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Building2, Calendar, Check, Clock, Loader2, Users } from "lucide-react";
import { formatCurrency } from "@/utils/numberFormatter";
import { formatPaymentMethod } from "@/utils/job.helper";
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
import type { InstitutionalJob } from "@/services/institution/InstitutionalService.ts";
import { PAYMENT_METHOD_VARIANTS } from "@/ui/themes/constants.ts";

export type InstitutionalJobWithReceivedAt = InstitutionalJob & { receivedAt?: string | null };

interface Props {
  job: InstitutionalJobWithReceivedAt | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkReceived: (jobId: string, date: string) => Promise<void>;
  onUnmarkReceived: (jobId: string) => Promise<void>;
}

const formSchema = z
  .object({
    isReceived: z.boolean(),
    paymentDate: z.date().optional().nullable(),
  })
  .refine(
    (data) => !(data.isReceived && !data.paymentDate),
    { message: "A data de recebimento é obrigatória", path: ["paymentDate"] },
  );

type FormValues = z.infer<typeof formSchema>;

export function InstitutionalWalletDetailsModal({ job, isOpen, onClose, onMarkReceived, onUnmarkReceived }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { isReceived: false, paymentDate: new Date() },
  });

  const isPaidWatch = form.watch("isReceived");

  useEffect(() => {
    if (job && isOpen) {
      const received = !!job.receivedAt;
      form.setValue("isReceived", received);
      form.setValue("paymentDate", received ? new Date(job.receivedAt!) : new Date());
    }
  }, [job, isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    if (!job) return;
    setIsUpdating(true);
    try {
      const wasReceived = !!job.receivedAt;
      if (values.isReceived && values.paymentDate) {
        const dateStr = format(values.paymentDate, "yyyy-MM-dd");
        const isoDate = new Date(dateStr + "T12:00:00Z").toISOString();
        const dateChanged = wasReceived
          ? format(new Date(job.receivedAt!), "yyyy-MM-dd") !== dateStr
          : true;
        if (!wasReceived || dateChanged) {
          await onMarkReceived(job.id, isoDate);
        }
      } else if (wasReceived && !values.isReceived) {
        await onUnmarkReceived(job.id);
      }
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  if (!job) return null;

  const amount = job.priceInCents ? job.priceInCents / 100 : 0;
  const itemDate = job.startDateTime ? new Date(job.startDateTime) : new Date();
  const hasSchedule = job.startDateTime && job.endDateTime;

  return (
    <ResponsiveDialogRoot open={isOpen} onOpenChange={onClose} maxWidth="35vw">
      <ResponsiveDialogHeaderComp title="Detalhes do Recebimento" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ResponsiveDialogBody>
            <div className="flex flex-col gap-6">
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-1 leading-tight">
                      {job.institutionName || "Instituição"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {job.institutionName && (
                        <Chip variant="purple" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <Building2 className="w-3.5 h-3.5" />
                          {job.institutionName}
                        </Chip>
                      )}
                      {job.teamName && (
                        <Chip variant="lime" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <Users className="w-3.5 h-3.5" />
                          {job.teamName}
                        </Chip>
                      )}
                      {job.durationInHours && (
                        <Chip variant="purple" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {job.durationInHours}h
                        </Chip>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="text-xl font-bold font-mono tracking-tight text-emerald-600">
                      {formatCurrency(amount, false)}
                    </span>
                    {job.paymentMethod && (
                      <Chip
                        className="text-xs rounded-full font-xs text-center"
                        variant={PAYMENT_METHOD_VARIANTS[job.paymentMethod] || "default"}
                      >
                        {formatPaymentMethod(job.paymentMethod)}
                      </Chip>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 text-sm font-medium text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/30">
                  <Calendar className="w-4 h-4 text-primary/70" />
                  <span>
                    {format(itemDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  {hasSchedule && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <Clock className="w-3.5 h-3.5 text-primary/70" />
                      <span>
                        {format(new Date(job.startDateTime!), "HH:mm")} – {format(new Date(job.endDateTime!), "HH:mm")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
                <FormField
                  control={form.control}
                  name="isReceived"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div>
                        <p className="text-base font-semibold text-foreground mb-1">Status do Recebimento</p>
                        <p className={cn("text-sm font-medium", field.value ? "text-emerald-600" : "text-amber-600")}>
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

                {isPaidWatch && (
                  <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-sm font-medium text-foreground mb-2">Data de Recebimento</p>
                          <FormControl>
                            <DatePicker date={field.value || undefined} onDateChange={field.onChange} disabled={isUpdating} />
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar
              </Button>
            </div>
          </ResponsiveDialogFooterComp>
        </form>
      </Form>
    </ResponsiveDialogRoot>
  );
}
