import { useEffect } from "react";
import { format } from "date-fns";
import {
  ResponsiveDialog,
  ResponsiveDialogHeaderComp,
  ResponsiveDialogBody,
  ResponsiveDialogFooterComp,
  ResponsiveDialogRoot,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface RecebimentoBulkEditModalProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (isReceived: boolean, date: string | null) => Promise<void>;
  isUpdatingBulk?: boolean;
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

export function WalletBulkEditModal({
  isOpen,
  selectedCount,
  onClose,
  onConfirm,
  isUpdatingBulk = false,
}: RecebimentoBulkEditModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isReceived: false,
      paymentDate: new Date(),
    },
  });

  const isReceivedWatch = form.watch("isReceived");

  useEffect(() => {
    if (isOpen) {
      // Default to false for bulk edit since users usually select multiple items to mark them as paid
      form.setValue("isReceived", false);
      form.setValue("paymentDate", new Date());
    }
  }, [isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    let newDate = null;
    if (values.isReceived && values.paymentDate) {
      const dateStr = format(values.paymentDate, "yyyy-MM-dd");
      newDate = new Date(dateStr + "T12:00:00Z").toISOString();
    }
    await onConfirm(values.isReceived, newDate);
  };

  return (
    <ResponsiveDialogRoot open={isOpen} onOpenChange={onClose} maxWidth="35vw">
      <ResponsiveDialogHeaderComp title="Editar Recebimentos" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ResponsiveDialogBody>
            <div className="flex flex-col gap-6">
              <div className="text-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Você está editando o status de{" "}
                  <span className="font-bold text-foreground">
                    {selectedCount}
                  </span>{" "}
                  recebimento{selectedCount > 1 ? "s" : ""}.
                </p>
              </div>

              <div className="flex flex-col gap-4 p-4 bg-secondary/50 rounded-xl border border-border shadow-sm">
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
                            field.value
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {field.value ? "Recebido" : "Não recebido"}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isUpdatingBulk}
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
                              disabled={isUpdatingBulk}
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
                disabled={isUpdatingBulk}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingBulk}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isUpdatingBulk ? (
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
