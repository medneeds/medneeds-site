import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { jobService, templateService } from "@/config/app";
import type { JobTemplate } from "@/config/payload.types";
import { useToast } from "@/hooks/ui/useToast.ts";
import { searchService } from "@/services/search/SearchService.ts";
import { ClinicalArea, JobModality } from "@/types/api.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  FileText,
  Loader2,
  Save,
  Stethoscope
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { DateTimeSection } from "@/components/jobs/NewJobModal/components/DateTimeSection";
import { JobPreviewCard } from "@/components/jobs/NewJobModal/components/JobPreviewCard";
import { PaymentSection } from "@/components/jobs/NewJobModal/components/PaymentSection";
import { PlaceSelector } from "@/components/jobs/NewJobModal/components/PlaceSelector";
import { ReplicationSection } from "@/components/jobs/NewJobModal/components/ReplicationSection";
import { SearchableSelector } from "@/components/jobs/NewJobModal/components/SearchableSelector";
import { TemplateSelectorModal } from "@/components/jobs/NewJobModal/components/TemplateSelectorModal";
import type { PaymentMethod } from "@/components/jobs/NewJobModal/NewJob.types";
import { Separator } from "@/components/ui/separator";
import { NewOfferFormData, newOfferSchema } from "./NewOfferModal.schema";
import {
  NewOfferModalProps,
  OfferPaymentMethod,
  OfferVisibilityType,
  PlaceOption,
} from "./types";

// ─── Visibility Section (apenas PUBLIC e UNLISTED — sem PRIVATE) ───────────────

import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/numberFormatter";
import institutionalService from "@/services/institution/InstitutionalService";
import type { TeamItem } from "@/services/institution/InstitutionalService";
import { Calendar, CheckCircle2 as CheckCircle2Icon, Earth, EyeOff } from "lucide-react";

const OFFER_VISIBILITY_OPTIONS = [
  {
    id: "PUBLIC" as OfferVisibilityType,
    label: "Pública",
    description: "Visível para todos os usuários",
    icon: Earth,
  },
  {
    id: "UNLISTED" as OfferVisibilityType,
    label: "Não listada",
    description: "Acessível por compartilhamento de link",
    icon: EyeOff,
  },
];

function OfferVisibilitySection({
  value,
  onChange,
}: {
  value: OfferVisibilityType;
  onChange: (v: OfferVisibilityType) => void;
}) {
  return (
    <div className="space-y-3 pt-2">
      <Label className="text-sm font-medium">Visibilidade</Label>
      <div className="grid grid-cols-2 gap-3">
        {OFFER_VISIBILITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left gap-2",
                isSelected
                  ? "border-accent bg-card"
                  : "border-border hover:border-accent/50",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{option.label}</span>
              </div>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── NewOfferModal ────────────────────────────────────────────────────────────

export function NewOfferModal({
  open,
  onClose,
  onSuccess,
  jobToEdit,
  institutionOptions,
}: NewOfferModalProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  // ── Institutional fields ──────────────────────────────────────────────────
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [agendaJobs, setAgendaJobs] = useState<import("@/services/institution/InstitutionalService").InstitutionalJob[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [selectedParentJobId, setSelectedParentJobId] = useState<string | null>(null);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>(
    undefined,
  );
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<NewOfferFormData>({
    resolver: zodResolver(newOfferSchema),
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
      visibility: "PUBLIC",
      enableReplication: false,
      replicateDates: [],
    },
  });

  const isInstitutional = !!(institutionOptions && institutionOptions.length > 0);

  const selectedModality = watch("modality") as JobModality | undefined;
  const selectedClinicalArea = watch("clinicalArea") as ClinicalArea | undefined;
  const selectedPlace = watch("place") as PlaceOption | undefined;
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

  // Reset ao abrir/fechar ou quando jobToEdit mudar
  useEffect(() => {
    if (open) {
      if (jobToEdit) {
        // Modo Edição
        const initialPrice = jobToEdit.priceInCents
          ? formatCurrency(jobToEdit.priceInCents / 100)
          : "";

        reset({
          modality: jobToEdit.modality,
          clinicalArea: jobToEdit.clinicalArea,
          place: jobToEdit.place
            ? ({
                placeId:
                  typeof jobToEdit.place === "string"
                    ? jobToEdit.place
                    : jobToEdit.place.id,
                name:
                  typeof jobToEdit.place === "object"
                    ? jobToEdit.place.name
                    : "",
                address:
                  typeof jobToEdit.place === "object"
                    ? jobToEdit.place.formattedAddress || ""
                    : "",
                cityId:
                  typeof jobToEdit.city === "object"
                    ? jobToEdit.city.id
                    : jobToEdit.city,
                cityName:
                  typeof jobToEdit.city === "object" ? jobToEdit.city.name : "",
              } as PlaceOption)
            : undefined,
          startDate: new Date(jobToEdit.startDateTime),
          startTime: format(new Date(jobToEdit.startDateTime), "HH:mm"),
          duration: jobToEdit.durationInHours,
          price: initialPrice,
          paymentMethod: jobToEdit.paymentMethod as OfferPaymentMethod,
          visibility: jobToEdit.visibility as OfferVisibilityType,
          singlePaymentForMultipleDates:
            (jobToEdit as any).singlePaymentForMutipleDates ?? null,
          enableReplication: !!(
            jobToEdit.additionalDates && jobToEdit.additionalDates.length > 0
          ),
          replicateDates:
            jobToEdit.additionalDates?.map((d) => new Date(d.date)) || [],
        });
      } else {
        // Modo Criação
        reset({
          modality: undefined,
          clinicalArea: undefined,
          place: undefined,
          startDate: new Date(),
          startTime: "07:00",
          duration: 12,
          price: "",
          paymentMethod: "AV",
          visibility: "PUBLIC",
          singlePaymentForMultipleDates: null,
          enableReplication: false,
          replicateDates: [],
        });
        setActiveTemplateId(undefined);
      }
      setShowPaymentPicker(false);
      setSelectedTeamId("");
      setTeams([]);
      setSelectedParentJobId(null);
      setAgendaJobs([]);
      if (institutionOptions && institutionOptions.length > 0) {
        setSelectedInstitutionId(institutionOptions[0].value);
      } else {
        setSelectedInstitutionId("");
      }
    }
  }, [open, reset, jobToEdit, institutionOptions]);

  useEffect(() => {
    if (!selectedInstitutionId) { setTeams([]); setSelectedTeamId(""); return; }
    setLoadingTeams(true);
    institutionalService.listTeams(selectedInstitutionId)
      .then(setTeams)
      .finally(() => setLoadingTeams(false));
  }, [selectedInstitutionId]);

  useEffect(() => {
    if (!isInstitutional || !selectedInstitutionId || !selectedTeamId || !user) {
      setAgendaJobs([]);
      setSelectedParentJobId(null);
      return;
    }
    setLoadingAgenda(true);
    institutionalService.getAgenda({ limit: 200 })
      .then(res => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filtered = (res.docs ?? []).filter((j: any) =>
          j.institutionId === selectedInstitutionId &&
          j.teamId === selectedTeamId &&
          j.toProfileId === user.id &&
          new Date(j.startDateTime) >= today
        );
        setAgendaJobs(filtered);
      })
      .catch(() => setAgendaJobs([]))
      .finally(() => setLoadingAgenda(false));
  }, [selectedInstitutionId, selectedTeamId, isInstitutional, user?.id]);

  // ===== Template Logic =====

  const canSaveTemplate = useMemo(() => {
    if (isInstitutional) return false;
    return !!selectedModality?.id && !!selectedClinicalArea?.id && !!selectedPlace?.placeId;
  }, [isInstitutional, selectedModality, selectedClinicalArea, selectedPlace]);

  const canSubmit = isValid && (
    isInstitutional
      ? !!selectedTeamId && (!!jobToEdit || !!selectedParentJobId)
      : !!selectedModality?.id && !!selectedClinicalArea?.id && !!selectedPlace?.placeId
  );

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
            {
              id: modalityObj.id,
              name: (modalityObj as any).name || "",
            } as any,
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
            {
              id: clinicalObj.id,
              name: (clinicalObj as any).name || "",
            } as any,
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
          } as any,
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
        setValue("paymentMethod", template.paymentMethod as any);
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
        // Ofertas não podem ser PRIVATE
        const visibility =
          template.visibility === "PRIVATE" ? "PUBLIC" : template.visibility;
        setValue("visibility", visibility as any);
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

  const onSubmit = async (data: NewOfferFormData) => {
    if (!user) {
      toast({ title: "Não autenticado", description: "Faça login para publicar uma oferta.", variant: "destructive" });
      return;
    }

    if (isInstitutional && !selectedTeamId) {
      toast({ title: "Time obrigatório", description: "Selecione o time para publicar a oferta institucional.", variant: "destructive" });
      return;
    }

    if (!isInstitutional && !data.place?.cityId) {
      toast({ title: "Erro", description: "A cidade para o local selecionado não foi encontrada. Selecione o local novamente.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(data.startDate, "yyyy-MM-dd");
      const startDateTime = new Date(`${dateStr}T${data.startTime}`).toISOString();
      const priceInCents = getPriceInCents();

      const additionalDates =
        data.enableReplication && data.replicateDates.length > 0
          ? data.replicateDates
              .filter((d) => format(d, "yyyy-MM-dd") !== dateStr)
              .map((date) => ({
                date: new Date(`${format(date, "yyyy-MM-dd")}T${data.startTime}`).toISOString(),
                id: null,
              }))
          : undefined;

      let endDateTime: string;
      if (additionalDates && additionalDates.length > 0) {
        const lastStart = new Date(additionalDates[additionalDates.length - 1].date);
        endDateTime = new Date(lastStart.getTime() + data.duration * 60 * 60 * 1000).toISOString();
      } else {
        endDateTime = new Date(
          new Date(`${dateStr}T${data.startTime}`).getTime() + data.duration * 60 * 60 * 1000,
        ).toISOString();
      }

      if (isInstitutional && !jobToEdit) {
        // Oferta institucional: sem modality/clinicalArea/place/visibility
        await institutionalService.createJob(selectedInstitutionId, {
          from: user.id,
          team: selectedTeamId,
          startDateTime,
          endDateTime,
          durationInHours: data.duration,
          paymentMethod: data.paymentMethod as OfferPaymentMethod,
          priceInCents,
          singlePaymentForMutipleDates: data.singlePaymentForMultipleDates,
          ...(selectedParentJobId && { parentRef: selectedParentJobId }),
          ...(additionalDates && additionalDates.length > 0 && { additionalDates }),
        });
      } else {
        // Oferta pessoal ou edição
        const jobData = {
          from: user.id,
          modality: data.modality!.id,
          clinicalArea: data.clinicalArea!.id,
          place: data.place!.placeId,
          city: data.place!.cityId!,
          startDateTime,
          endDateTime,
          durationInHours: data.duration,
          paymentMethod: data.paymentMethod as OfferPaymentMethod,
          priceInCents,
          singlePaymentForMutipleDates: data.singlePaymentForMultipleDates,
          visibility: (data.visibility ?? "PUBLIC") as "PUBLIC" | "UNLISTED",
          ...(additionalDates && additionalDates.length > 0 && { additionalDates }),
        };
        if (jobToEdit) {
          await jobService.updateJob(jobToEdit.id, jobData as any);
        } else {
          await jobService.createJob(jobData);
        }
      }

      toast({
        title: jobToEdit ? "Oferta atualizada!" : "Oferta publicada!",
        description:
          additionalDates && additionalDates.length > 0
            ? jobToEdit
              ? "Oferta em série atualizada com sucesso!"
              : "Oferta em série criada com sucesso!"
            : jobToEdit
              ? "Oferta atualizada com sucesso!"
              : "Oferta criada com sucesso!",
        duration: 3000,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating offer:", error);
      toast({
        title: "Erro ao publicar oferta",
        description: "Não foi possível criar a oferta. Tente novamente.",
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
              {jobToEdit ? "Editar Oferta" : "Nova Oferta"}
            </DialogTitle>
            {!jobToEdit && !isInstitutional && (
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
              caption="Você está publicando"
              placeName={!isInstitutional ? selectedPlace?.name : undefined}
              placeAddress={!isInstitutional ? (selectedPlace?.address || selectedPlace?.cityName) : undefined}
              modality={!isInstitutional ? (selectedModality as any)?.name : undefined}
              clinicalArea={!isInstitutional ? (selectedClinicalArea as any)?.name : undefined}
              institutionName={isInstitutional ? (institutionOptions?.find(i => i.value === selectedInstitutionId)?.label) : undefined}
              teamName={isInstitutional ? (teams.find(t => t.id === selectedTeamId)?.name) : undefined}
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
              visibility={!isInstitutional ? visibility : undefined}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Institucional: instituição + time (obrigatórios) */}
            {isInstitutional && !jobToEdit && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Instituição *</Label>
                  {institutionOptions!.length === 1 ? (
                    <div className={cn(
                      "w-full h-10 rounded-xl border border-input bg-muted/30 px-3 text-sm flex items-center"
                    )}>
                      {institutionOptions![0].label}
                    </div>
                  ) : (
                    <select
                      value={selectedInstitutionId}
                      onChange={(e) => { setSelectedInstitutionId(e.target.value); setSelectedTeamId(""); }}
                      className={cn(
                        "w-full h-10 rounded-xl border border-input bg-background px-3 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      )}
                    >
                      <option value="" disabled>Selecione a instituição</option>
                      {institutionOptions!.map((i) => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Time *</Label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={!selectedInstitutionId || loadingTeams}
                    className={cn(
                      "w-full h-10 rounded-xl border border-input bg-background px-3 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                      (!selectedInstitutionId || loadingTeams) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <option value="" disabled>
                      {loadingTeams ? "Carregando..." : "Selecione o time"}
                    </option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!isInstitutional && (
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelector<JobModality>
                  label="Modalidade"
                  icon={Activity}
                  selected={selectedModality ?? null}
                  onSelect={(item) =>
                    setValue("modality", item, { shouldValidate: true })
                  }
                  onClear={() =>
                    setValue("modality", undefined as unknown as JobModality, {
                      shouldValidate: true,
                    })
                  }
                  searchFn={searchModalities}
                  placeholder="Selecione a modalidade"
                  errorMessage={errors.modality?.message}
                />

                <SearchableSelector<ClinicalArea>
                  label="Atuação"
                  icon={Stethoscope}
                  selected={selectedClinicalArea ?? null}
                  onSelect={(item) =>
                    setValue("clinicalArea", item, { shouldValidate: true })
                  }
                  onClear={() =>
                    setValue(
                      "clinicalArea",
                      undefined as unknown as ClinicalArea,
                      { shouldValidate: true },
                    )
                  }
                  searchFn={searchClinicalAreas}
                  placeholder="Selecione a atuação"
                  errorMessage={errors.clinicalArea?.message}
                />
              </div>
            )}

            {!isInstitutional && (
              <PlaceSelector
                selected={selectedPlace ?? null}
                onSelect={(place) =>
                  setValue("place", place, { shouldValidate: true })
                }
                onClear={() =>
                  setValue("place", undefined as unknown as PlaceOption, {
                    shouldValidate: true,
                  })
                }
                errorMessage={errors.place?.message}
              />
            )}

            {isInstitutional && !jobToEdit ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plantão *</Label>
                {!selectedTeamId ? (
                  <p className="text-xs text-muted-foreground py-2">Selecione o time para ver seus plantões agendados.</p>
                ) : loadingAgenda ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : agendaJobs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center bg-muted/30 rounded-xl p-4">
                    Nenhum plantão agendado encontrado para este time.
                  </p>
                ) : (
                  <div className="grid gap-2 max-h-52 overflow-y-auto pr-1">
                    {agendaJobs.map((job) => {
                      const isSelected = selectedParentJobId === job.id;
                      const start = new Date(job.startDateTime);
                      const end = new Date(job.endDateTime);
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            setSelectedParentJobId(job.id);
                            setValue("startDate", start, { shouldValidate: true });
                            setValue("startTime", format(start, "HH:mm"), { shouldValidate: true });
                            setValue("duration", job.durationInHours, { shouldValidate: true });
                          }}
                          className={cn(
                            "text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 w-full",
                            isSelected ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            isSelected ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                          )}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm capitalize">
                              {format(start, "EEEE, dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(start, "HH:mm")} – {format(end, "HH:mm")} · {job.durationInHours}h
                            </p>
                          </div>
                          {isSelected && <CheckCircle2Icon className="w-4 h-4 text-accent shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
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
            )}

            <PaymentSection
              price={price}
              onPriceChange={(val) =>
                setValue("price", formatCurrencyInput(val))
              }
              paymentMethod={paymentMethod as OfferPaymentMethod}
              onPaymentMethodChange={(val) => {
                setValue("paymentMethod", val);
                setShowPaymentPicker(false);
              }}
              showPaymentPicker={showPaymentPicker}
              onTogglePaymentPicker={() =>
                setShowPaymentPicker(!showPaymentPicker)
              }
            />

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

            {!isInstitutional && (
              <OfferVisibilitySection
                value={visibility as OfferVisibilityType}
                onChange={(val) => setValue("visibility", val)}
              />
            )}
          </div>

          <div className="p-4 border-t bg-background shrink-0">
            <div className="flex items-center gap-2">
              {!jobToEdit && canSaveTemplate && (
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
                disabled={loading || !canSubmit}
                className="flex-1 btn-lime"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {jobToEdit ? "Salvando..." : "Publicando..."}
                  </>
                ) : jobToEdit ? (
                  "Salvar alterações"
                ) : (
                  "Publicar oferta"
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
