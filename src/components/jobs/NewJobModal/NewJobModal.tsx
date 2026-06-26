import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { jobService, templateService } from "@/config/app.ts";
import type { JobTemplate } from "@/config/payload.types.ts";
import { useToast } from "@/hooks/ui/useToast.ts";
import { searchService } from "@/services/search/SearchService.ts";
import { ClinicalArea, JobModality } from "@/types/api.types.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Activity,
  FileText,
  Loader2,
  Save,
  Stethoscope
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  NewJobFormData,
  newJobSchema,
} from "@/components/jobs/NewJobModal/schemas/NewJobModal.schema.ts";
import { Separator } from "@/components/ui/separator.tsx";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { formatCurrency } from "@/utils/numberFormatter";
import { NewJobModalProps, PaymentMethod } from "./NewJob.types.ts";
import { DateTimeSection } from "./components/DateTimeSection.tsx";
import { JobPreviewCard } from "./components/JobPreviewCard.tsx";
import { PaymentSection } from "./components/PaymentSection.tsx";
import { PlaceSelector } from "./components/PlaceSelector.tsx";
import { ReplicationSection } from "./components/ReplicationSection.tsx";
import { SearchableSelector } from "./components/SearchableSelector.tsx";
import { TemplateSelectorModal } from "./components/TemplateSelectorModal.tsx";
import {
  VisibilitySection,
  VisibilityType,
} from "./components/VisibilitySection.tsx";

export function NewJobModal({
  open,
  onClose,
  onSuccess,
  initialDate,
  jobToEdit,
}: NewJobModalProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>(
    undefined,
  );
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const isEditing = !!jobToEdit;

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<NewJobFormData>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      modality: undefined,
      clinicalArea: undefined,
      place: undefined,
      startDate: new Date(),
      startTime: "07:00",
      duration: 12,
      price: "",
      paymentMethod: "AV",
      singlePaymentForMultipleDates: null,
      visibility: "PRIVATE",
      enableReplication: false,
      replicateDates: [],
    },
  });

  const selectedModality = watch("modality") as JobModality | undefined;
  const selectedClinicalArea = watch("clinicalArea") as
    | ClinicalArea
    | undefined;
  const selectedPlace = watch("place") as any | undefined;
  const startDate = watch("startDate");
  const startTime = watch("startTime");
  const duration = watch("duration");
  const price = watch("price");
  const paymentMethod = watch("paymentMethod");
  const visibility = watch("visibility");
  const singlePaymentForMultipleDates = watch("singlePaymentForMultipleDates");
  const enableReplication = watch("enableReplication");
  const replicateDates = watch("replicateDates");

  const formatCurrencyInput = (val: string) => {
    const numbers = val.replace(/\D/g, "");
    const amount = parseInt(numbers || "0", 10) / 100;
    return formatCurrency(amount);
  };

  useEffect(() => {
    if (open) {
      if (jobToEdit) {
        const jobDate = new Date(jobToEdit.startDateTime);
        reset({
          modality: {
            id: jobToEdit.modality.id,
            name: jobToEdit.modality.name || "",
          },
          clinicalArea: {
            id: jobToEdit.clinicalArea.id,
            name: jobToEdit.clinicalArea.name || "",
          },
          place: jobToEdit.place
            ? {
                placeId: jobToEdit.place.id,
                name: jobToEdit.place.name || "",
                address: jobToEdit.place.formattedAddress || "",
                cityId: jobToEdit.city.id,
                cityName: jobToEdit.city.name || "",
              }
            : undefined,
          startDate: jobDate,
          startTime: format(jobDate, "HH:mm"),
          duration: jobToEdit.durationInHours,
          price: jobToEdit.priceInCents
            ? formatCurrencyInput(jobToEdit.priceInCents.toString())
            : "",
          paymentMethod: jobToEdit.paymentMethod as PaymentMethod,
          visibility: (jobToEdit.visibility as any) || "PRIVATE",
          singlePaymentForMultipleDates: (jobToEdit as any)
            .singlePaymentForMutipleDates,
          enableReplication: !!jobToEdit.additionalDates?.length,
          replicateDates: [
            jobDate,
            ...(jobToEdit.additionalDates || [])
              .filter((ad) => !!ad.date)
              .map((ad) => new Date(ad.date!)),
          ],
        });
      } else {
        const date = initialDate || new Date();
        reset({
          modality: undefined,
          clinicalArea: undefined,
          place: undefined,
          startDate: date,
          startTime: "07:00",
          duration: 12,
          price: "",
          paymentMethod: "AV",
          visibility: "PRIVATE",
          singlePaymentForMultipleDates: null,
          enableReplication: false,
          replicateDates: [],
        });
        setActiveTemplateId(undefined);
      }
      setShowPaymentPicker(false);
    }
  }, [open, initialDate, reset, jobToEdit]);

  const searchModalities = useCallback(async (query: string) => {
    const result = await searchService.getModalities(query || undefined);
    return result.docs || [];
  }, []);

  const searchClinicalAreas = useCallback(async (query: string) => {
    const result = await searchService.getClinicalAreas(query || undefined);
    return result.docs || [];
  }, []);

  const getPriceInCents = (): number | undefined => {
    if (!price) return undefined;
    const numbers = price.replace(/\D/g, "");
    return parseInt(numbers || "0", 10);
  };

  // ===== Template Logic =====

  const canSaveTemplate = useMemo(() => {
    return (
      !!selectedModality?.id &&
      !!selectedClinicalArea?.id &&
      !!selectedPlace?.placeId
    );
  }, [selectedModality, selectedClinicalArea, selectedPlace]);

  const isEditingTemplate = useMemo(
    () => !!activeTemplateId,
    [activeTemplateId],
  );

  const loadTemplateData = async (template: JobTemplate) => {
    try {
      // Modality
      if (template.modality) {
        let modalityObj = template.modality;
        if (typeof modalityObj === "string") {
          const results = await searchService.getModalitiesByIds([modalityObj]);
          if (results.length > 0) modalityObj = results[0] as any;
        }
        if (typeof modalityObj === "object" && modalityObj) {
          setValue(
            "modality",
            { id: modalityObj.id, name: (modalityObj as any).name || "" },
            { shouldValidate: true },
          );
        }
      }

      // Clinical Area
      if (template.clinicalArea) {
        let clinicalObj = template.clinicalArea;
        if (typeof clinicalObj === "string") {
          const results = await searchService.getClinicalAreasByIds([
            clinicalObj,
          ]);
          if (results.length > 0) clinicalObj = results[0] as any;
        }
        if (typeof clinicalObj === "object" && clinicalObj) {
          setValue(
            "clinicalArea",
            { id: clinicalObj.id, name: (clinicalObj as any).name || "" },
            { shouldValidate: true },
          );
        }
      }

      // Place
      if (template.place && typeof template.place === "object") {
        const placeObj = template.place;
        const cityObj =
          typeof placeObj.city === "object" ? placeObj.city : null;
        setValue(
          "place",
          {
            placeId: placeObj.id,
            name: placeObj.name || "",
            address: placeObj.formattedAddress || "",
            cityId: cityObj
              ? cityObj.id
              : typeof placeObj.city === "string"
                ? placeObj.city
                : undefined,
            cityName: cityObj ? cityObj.name || cityObj.label || "" : "",
          },
          { shouldValidate: true },
        );
      }

      // Start time
      if (template.startTime) {
        setValue("startTime", template.startTime);
      }

      // Duration
      if (template.durationInHours) {
        setValue("duration", template.durationInHours);
      }

      // Payment method
      if (template.paymentMethod) {
        setValue("paymentMethod", template.paymentMethod);
      }

      // Price
      if (template.priceInCents) {
        setValue(
          "price",
          formatCurrencyInput(template.priceInCents.toString()),
        );
      }

      // Visibility
      if (template.visibility) {
        setValue("visibility", template.visibility as any);
      }

      // Track active template
      setActiveTemplateId(template.id);

      toast({
        title: "Modelo carregado",
        description: "Os dados do modelo foram aplicados ao formulário.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error loading template data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do modelo.",
        variant: "destructive",
      });
    }
  };

  const handleSelectTemplate = (template: JobTemplate) => {
    loadTemplateData(template);
  };

  const handleSaveAsTemplate = async (forceCreate: boolean = false) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Faça login para salvar um modelo.",
        variant: "destructive",
      });
      return;
    }

    if (!canSaveTemplate) {
      const missing: string[] = [];
      if (!selectedModality?.id) missing.push("modalidade");
      if (!selectedClinicalArea?.id) missing.push("atuação");
      if (!selectedPlace?.placeId) missing.push("local");
      const action = isEditingTemplate ? "atualizar" : "salvar";
      toast({
        title: "Dados insuficientes",
        description: `Para ${action} um modelo, selecione: ${missing.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      const templateData = {
        from: user.id,
        modality: selectedModality?.id,
        clinicalArea: selectedClinicalArea?.id,
        place: selectedPlace?.placeId || undefined,
        city: selectedPlace?.cityId || undefined,
        startTime: startTime,
        durationInHours: duration || undefined,
        paymentMethod: paymentMethod as "AV" | "NR" | "AC",
        priceInCents: getPriceInCents() || undefined,
        singlePaymentForMutipleDates: singlePaymentForMultipleDates,
        visibility: visibility as any,
        description: "",
      };

      if (activeTemplateId && !forceCreate) {
        await templateService.updateTemplate(activeTemplateId, templateData);
        toast({
          title: "Sucesso!",
          description: "Modelo atualizado com sucesso!",
          duration: 3000,
        });
      } else {
        const saved = await templateService.createTemplate(templateData);
        setActiveTemplateId(saved.id);
        toast({
          title: "Sucesso!",
          description: forceCreate
            ? "Novo modelo criado com sucesso!"
            : "Modelo salvo com sucesso!",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      const action = isEditingTemplate ? "atualizar" : "salvar";
      toast({
        title: "Erro",
        description: `Não foi possível ${action} o modelo. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const onSubmit = async (data: NewJobFormData) => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: `Faça login para ${isEditing ? "editar" : "criar"} um agendamento.`,
        variant: "destructive",
      });
      return;
    }

    if (!data.place?.cityId) {
      toast({
        title: "Erro",
        description:
          "A cidade para o local selecionado não foi encontrada. Selecione o local novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(data.startDate, "yyyy-MM-dd");
      const startDateTime = new Date(
        `${dateStr}T${data.startTime}`,
      ).toISOString();
      const priceInCents = getPriceInCents();

      const additionalDates =
        data.enableReplication && data.replicateDates.length > 0
          ? data.replicateDates
              .filter((d) => format(d, "yyyy-MM-dd") !== dateStr)
              .map((date) => ({
                date: new Date(
                  `${format(date, "yyyy-MM-dd")}T${data.startTime}`,
                ).toISOString(),
                id: null,
              }))
          : undefined;

      let endDateTime: string;
      if (additionalDates && additionalDates.length > 0) {
        const lastDate = additionalDates[additionalDates.length - 1];
        const lastStart = new Date(lastDate.date);
        endDateTime = new Date(
          lastStart.getTime() + data.duration * 60 * 60 * 1000,
        ).toISOString();
      } else {
        endDateTime = new Date(
          new Date(`${dateStr}T${data.startTime}`).getTime() +
            data.duration * 60 * 60 * 1000,
        ).toISOString();
      }

      const jobData = {
        modality: data.modality.id,
        clinicalArea: data.clinicalArea.id,
        place: data.place.placeId,
        city: data.place.cityId!,
        startDateTime,
        endDateTime,
        durationInHours: data.duration,
        paymentMethod: data.paymentMethod as PaymentMethod,
        priceInCents,
        singlePaymentForMutipleDates: data.singlePaymentForMultipleDates,
        visibility: data.visibility,
        ...(additionalDates &&
          additionalDates.length > 0 && {
            additionalDates,
          }),
      };

      if (isEditing && jobToEdit) {
        await jobService.updateJob(jobToEdit.id, jobData as any);
        toast({
          title: "Agendamento atualizado!",
          description: "Seu agendamento foi atualizado com sucesso.",
          duration: 3000,
        });
      } else {
        await jobService.createJob(jobData);
        toast({
          title: "Agendamento criado!",
          description:
            additionalDates && additionalDates.length > 0
              ? "Agendamento em série criado com sucesso!"
              : "Agendamento criado com sucesso!",
          duration: 3000,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} agenda:`,
        error,
      );
      toast({
        title: `Erro ao ${isEditing ? "atualizar" : "criar"} agendamento`,
        description: `Não foi possível ${isEditing ? "atualizar" : "criar"} o agendamento. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-foreground mr-6"
                onClick={() => setShowTemplateSelector(true)}
                type="button"
              >
                <FileText className="w-4 h-4" />
                Modelos
              </Button>
            )}
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-4 border-b bg-muted/10 shrink-0 z-10 shadow-sm relative">
            <JobPreviewCard
              caption="Você está agendando"
              placeName={selectedPlace?.name}
              placeAddress={selectedPlace?.address || selectedPlace?.cityName}
              modality={selectedModality?.name}
              clinicalArea={selectedClinicalArea?.name}
              startDate={startDate}
              startTime={startTime}
              duration={duration}
              price={price}
              paymentMethod={paymentMethod as PaymentMethod}
              additionalDatesCount={
                enableReplication
                  ? replicateDates.filter(
                      (d) =>
                        d.toDateString() !== startDate.toDateString()
                    ).length
                  : 0
              }
              visibility={visibility}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelector<JobModality>
                label="Modalidade"
                icon={Activity}
                selected={selectedModality ?? null}
                onSelect={(item) =>
                  setValue("modality", item, { shouldValidate: true })
                }
                onClear={() =>
                  setValue("modality", undefined as any, {
                    shouldValidate: true,
                  })
                }
                searchFn={searchModalities}
                placeholder="Selecione a modalidade"
                errorMessage={(errors.modality as any)?.message}
              />

              <SearchableSelector<ClinicalArea>
                label="Atuação"
                icon={Stethoscope}
                selected={selectedClinicalArea ?? null}
                onSelect={(item) =>
                  setValue("clinicalArea", item, { shouldValidate: true })
                }
                onClear={() =>
                  setValue("clinicalArea", undefined as any, {
                    shouldValidate: true,
                  })
                }
                searchFn={searchClinicalAreas}
                placeholder="Selecione a atuação"
                errorMessage={(errors.clinicalArea as any)?.message}
              />
            </div>

            <PlaceSelector
              selected={selectedPlace ?? null}
              onSelect={(place) =>
                setValue("place", place, { shouldValidate: true })
              }
              onClear={() =>
                setValue("place", undefined as any, { shouldValidate: true })
              }
              errorMessage={(errors.place as any)?.message}
            />

            <DateTimeSection
              date={startDate}
              onDateChange={(date) => {
                if (date) setValue("startDate", date);
              }}
              startTime={startTime}
              onStartTimeChange={(val) => setValue("startTime", val)}
              duration={duration}
              onDurationChange={(val) => setValue("duration", val)}
            />

            <PaymentSection
              price={price}
              onPriceChange={(val) =>
                setValue("price", formatCurrencyInput(val))
              }
              paymentMethod={paymentMethod as PaymentMethod}
              onPaymentMethodChange={(val) => {
                setValue("paymentMethod", val);
                setShowPaymentPicker(false);
              }}
              showPaymentPicker={showPaymentPicker}
              onTogglePaymentPicker={() =>
                setShowPaymentPicker(!showPaymentPicker)
              }
            />

            {isEditing && (
              <VisibilitySection
                value={visibility as VisibilityType}
                onChange={(val) => setValue("visibility", val)}
              />
            )}

            <ReplicationSection
              enableReplication={enableReplication}
              onEnableReplicationChange={(checked) => {
                setValue("enableReplication", checked);
                if (checked && replicateDates.length === 0) {
                  setValue("replicateDates", [startDate]);
                }
              }}
              replicateDates={replicateDates}
              onReplicateDatesChange={(newDates) =>
                setValue("replicateDates", newDates)
              }
              startDate={startDate}
              price={price}
              singlePaymentForMultipleDates={singlePaymentForMultipleDates}
              onSinglePaymentChange={(val) =>
                setValue("singlePaymentForMultipleDates", val)
              }
            />
          </div>

          <div className="p-4 border-t bg-background shrink-0">
            <div className="flex items-center gap-2">
              {!isEditing && canSaveTemplate && (
                <>
                  <div className="flex gap-2">
                    {activeTemplateId ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleSaveAsTemplate(false)}
                          disabled={isSavingTemplate || !canSaveTemplate}
                          className="gap-1.5"
                          type="button"
                        >
                          {isSavingTemplate ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Atualizar Modelo
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleSaveAsTemplate(false)}
                        disabled={isSavingTemplate || !canSaveTemplate}
                        className="gap-1.5"
                        type="button"
                      >
                        {isSavingTemplate ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar Modelo
                      </Button>
                    )}
                  </div>
                  <Separator orientation="vertical" className="h-8 mx-1" />
                </>
              )}
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
                type="button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !isValid}
                className="flex-1 btn-lime"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? "Salvando..." : "Criando..."}
                  </>
                ) : isEditing ? (
                  "Salvar alterações"
                ) : (
                  "Criar agendamento"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Modal de seleção de templates */}
      <TemplateSelectorModal
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </Dialog>
  );
}
