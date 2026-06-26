import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Chip } from "@/components/ui/Chip.tsx";
import {
  MapPin,
  Stethoscope,
  Building2,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  X,
  Loader2,
  Check,
  Activity,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useFiltersStore } from "@/services/filters/store/store.ts";
import { useFilterEditStore } from "@/services/filters/store/editStore.ts";
import { searchService } from "@/services/search/SearchService.ts";
import { City, ClinicalArea, JobModality } from "@/types/api.types.ts";
import { toast } from "sonner";
import { SearchableSelector } from "@/components/jobs/NewJobModal/components/SearchableSelector.tsx";
import { PlaceSelector } from "@/components/jobs/NewJobModal/components/PlaceSelector.tsx";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { cn } from "@/lib/utils.ts";
import { institutionalService } from "@/services/institution/InstitutionalService.ts";
import { parseInstitutionalError } from "@/lib/institutionalErrors.ts";
import { Link2 } from "lucide-react";

const STATES = [
  { id: "AC", name: "Acre" },
  { id: "AL", name: "Alagoas" },
  { id: "AP", name: "Amapá" },
  { id: "AM", name: "Amazonas" },
  { id: "BA", name: "Bahia" },
  { id: "CE", name: "Ceará" },
  { id: "DF", name: "Distrito Federal" },
  { id: "ES", name: "Espírito Santo" },
  { id: "GO", name: "Goiás" },
  { id: "MA", name: "Maranhão" },
  { id: "MT", name: "Mato Grosso" },
  { id: "MS", name: "Mato Grosso do Sul" },
  { id: "MG", name: "Minas Gerais" },
  { id: "PA", name: "Pará" },
  { id: "PB", name: "Paraíba" },
  { id: "PR", name: "Paraná" },
  { id: "PE", name: "Pernambuco" },
  { id: "PI", name: "Piauí" },
  { id: "RJ", name: "Rio de Janeiro" },
  { id: "RN", name: "Rio Grande do Norte" },
  { id: "RS", name: "Rio Grande do Sul" },
  { id: "RO", name: "Rondônia" },
  { id: "RR", name: "Roraima" },
  { id: "SC", name: "Santa Catarina" },
  { id: "SP", name: "São Paulo" },
  { id: "SE", name: "Sergipe" },
  { id: "TO", name: "Tocantins" },
];

const PAYMENT_METHODS = [
  { id: "AV", name: "À vista" },
  { id: "AC", name: "A combinar" },
  { id: "NR", name: "No mês referente" },
];

const DURATIONS = [
  { id: "6", name: "6 horas" },
  { id: "12", name: "12 horas" },
  { id: "24", name: "24 horas" },
  { id: "48", name: "48 horas" },
];

interface FilterCondition {
  inCities?: string[];
  inStates?: string[];
  inPlaces?: string[];
  inModalities?: string[];
  inClinicalAreas?: string[];
  inDurationsInHours?: number[];
  betweenDates?: [Date, Date] | Date[];
  betweenPriceInCents?: [number, number];
  inPaymentMethods?: string[];
  showPastJobs?: boolean;
}

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
      <Icon className="w-5 h-5 text-accent" />
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const SubSection = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
      {label}
    </Label>
    {children}
  </div>
);

function formatCpf(digits: string): string {
  const d = digits.slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function LinkInstitutionCard() {
  const [token, setToken] = useState('');
  const [cpfDisplay, setCpfDisplay] = useState('');
  const [cpfDigits, setCpfDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ institution: string; role: string; name: string } | null>(null);
  const [error, setError] = useState<{ title: string; description?: string } | null>(null);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCpfDigits(digits);
    setCpfDisplay(formatCpf(digits));
  };

  const canSubmit = token.trim().length > 0 && cpfDigits.length === 11;

  const handleLink = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await institutionalService.completeInvite({
        token: token.trim().toUpperCase(),
        cpf: cpfDigits,
      });
      setSuccess({ institution: result.institution, role: result.role, name: result.profileName });
      setToken('');
      setCpfDisplay('');
      setCpfDigits('');
    } catch (err) {
      const parsed = parseInstitutionalError(err);
      setError(parsed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4 md:col-span-2">
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <Link2 className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-foreground">Vincular a uma Nova Instituição</h3>
      </div>

      {success ? (
        <div className="flex items-start gap-3 rounded-lg bg-lime-500/10 border border-lime-500/30 p-4">
          <Check className="w-5 h-5 text-lime-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Vínculo realizado com sucesso!</p>
            <p className="text-muted-foreground mt-0.5">
              Bem-vindo à instituição <span className="font-medium text-foreground">{success.institution}</span> como <span className="font-medium text-foreground">{success.role}</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="link-token" className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Token do Convite
            </Label>
            <Input
              id="link-token"
              placeholder="Ex.: ABC123"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-cpf" className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              CPF
            </Label>
            <Input
              id="link-cpf"
              placeholder="000.000.000-00"
              value={cpfDisplay}
              onChange={handleCpfChange}
              disabled={loading}
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
            />
          </div>

          <Button
            className="btn-lime"
            disabled={!canSubmit || loading}
            onClick={handleLink}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vinculando...</>
            ) : (
              <><Link2 className="w-4 h-4 mr-2" /> Vincular</>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-3">
          <X className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-foreground">{error.title}</p>
            {error.description && <p className="text-muted-foreground mt-0.5">{error.description}</p>}
          </div>
          <button onClick={() => setError(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Preferences() {
  const {
    loadFilters,
    saveFilter,
    isLoading: isStoreLoading,
  } = useFiltersStore();
  const {
    id: editingId,
    conditions,
    updateCondition,
    addCondition,
    loadFilterForEdit,
    reset: resetEditStore,
  } = useFilterEditStore();

  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydratedData, setHydratedData] = useState<{ [key: string]: any[] }>(
    {},
  );

  const condition = (conditions[0] || {}) as FilterCondition;

  const hydrateValues = useCallback(async (cond: FilterCondition) => {
    if (!cond) return;
    const newHydrated: { [key: string]: any[] } = {};

    if (cond.inCities?.length) {
      const cities = await searchService.getCitiesByIds(cond.inCities);
      newHydrated.inCities = cities.map((c: City) => ({
        id: c.id,
        name: `${c.name}, ${c.uf || ""}`,
      }));
    }
    if (cond.inClinicalAreas?.length) {
      newHydrated.inClinicalAreas = await searchService.getClinicalAreasByIds(
        cond.inClinicalAreas,
      );
    }
    if (cond.inModalities?.length) {
      newHydrated.inModalities = await searchService.getModalitiesByIds(
        cond.inModalities,
      );
    }
    if (cond.inPlaces?.length) {
      const places = await Promise.all(
        (cond.inPlaces as string[]).map((id) =>
          searchService.getPlaceDetails(id),
        ),
      );
      newHydrated.inPlaces = places.filter(Boolean).map((p: any) => ({
        id: p.id || p.placeId,
        name: p.name,
      }));
    }

    setHydratedData(newHydrated);
  }, []);

  // Inicialização
  useEffect(() => {
    const init = async () => {
      await loadFilters();
      const onboardingFilter = useFiltersStore
        .getState()
        .filters.find(
          (f) =>
            f.type === "onboarding" ||
            (f.title || "").toLowerCase() === "para você" ||
            (f.title || "").toLowerCase() === "para voce",
        );

      if (onboardingFilter) {
        loadFilterForEdit(onboardingFilter);
        // Hidratar nomes para os chips
        hydrateValues(onboardingFilter.conditions[0]);
      } else {
        resetEditStore();
        addCondition();
      }
      setReady(true);
    };
    init();
  }, [
    loadFilters,
    loadFilterForEdit,
    addCondition,
    resetEditStore,
    hydrateValues,
  ]);

  const handleUpdateField = (field: keyof FilterCondition, value: any) => {
    const newCondition = { ...condition, [field]: value };
    // Se o valor for vazio/undefined, remove o campo
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete (newCondition as any)[field];
    }
    updateCondition(0, newCondition);
  };

  const handleToggleArrayValue = (
    field: keyof FilterCondition,
    val: string | number,
  ) => {
    const current = (condition as any)[field] || [];
    if (current.includes(val)) {
      handleUpdateField(
        field,
        current.filter((v: any) => v !== val),
      );
    } else {
      handleUpdateField(field, [...current, val]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const filterToSave = {
        id: editingId,
        title: "Para você",
        type: "onboarding" as const,
        conjunction: "or" as const,
        conditions: [{ ...condition, showPastJobs: true }],
      };
      await saveFilter(filterToSave as any);
      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar preferências.");
    } finally {
      setSaving(false);
    }
  };


  if (!ready || isStoreLoading) {
    return (
      <MainLayout mobileTitle="Preferências">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout mobileTitle="Preferências">
      <div className="page-container max-w-4xl">
        <div className="page-header mb-8">
          <h1 className="page-title">Minhas Preferências</h1>
          <p className="page-subtitle">
            Configure seu filtros para receber ofertas personalizadas.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12"
        >
          {/* LOCALIZAÇÃO */}
          <Section title="Localização" icon={MapPin}>
            <SubSection label="Estados">
              <div className="flex flex-wrap gap-2">
                {STATES.map((state) => (
                  <Chip
                    key={state.id}
                    variant={
                      condition.inStates?.includes(state.id)
                        ? "lime"
                        : "muted"
                    }
                    onClick={() => handleToggleArrayValue("inStates", state.id)}
                    className="cursor-pointer"
                  >
                    {state.id}
                  </Chip>
                ))}
              </div>
            </SubSection>

            <SubSection label="Cidades">
              <div className="space-y-3">
                <SearchableSelector
                  label="Cidade"
                  icon={MapPin}
                  placeholder="Adicionar cidade..."
                  selected={null}
                  onSelect={(item) => {
                    const current = condition.inCities || [];
                    if (!current.includes(item.id)) {
                      handleUpdateField("inCities", [...current, item.id]);
                      setHydratedData((prev) => ({
                        ...prev,
                        inCities: [...(prev.inCities || []), item],
                      }));
                    }
                  }}
                  onClear={() => {}}
                  searchFn={async (q) => {
                    const res = await searchService.getCities(q);
                    return res.docs.map((c) => ({
                      id: c.id,
                      name: `${c.name}, ${c.uf || ""}`,
                    }));
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {condition.inCities?.map((cityId: string) => {
                    const city = hydratedData.inCities?.find(
                      (c) => c.id === cityId,
                    );
                    return (
                      <Chip key={cityId} variant="lime" className="pr-1">
                        {city?.name || cityId}
                        <button
                          onClick={() =>
                            handleUpdateField(
                              "inCities",
                              condition.inCities?.filter(
                                (id: string) => id !== cityId,
                              ),
                            )
                          }
                        >
                          <X className="w-3 h-3 ml-1" />
                        </button>
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </SubSection>

            <SubSection label="Locais Específicos">
              <div className="space-y-3">
                <PlaceSelector
                  selected={null}
                  onSelect={(place) => {
                    const current = condition.inPlaces || [];
                    if (!current.includes(place.placeId)) {
                      handleUpdateField("inPlaces", [
                        ...current,
                        place.placeId,
                      ]);
                      setHydratedData((prev) => ({
                        ...prev,
                        inPlaces: [
                          ...(prev.inPlaces || []),
                          { id: place.placeId, name: place.name },
                        ],
                      }));
                    }
                  }}
                  onClear={() => {}}
                />
                <div className="flex flex-wrap gap-2">
                  {condition.inPlaces?.map((placeId: string) => {
                    const place = hydratedData.inPlaces?.find(
                      (p) => p.id === placeId,
                    );
                    return (
                      <Chip key={placeId} variant="lime" className="pr-1">
                        {place?.name || placeId}
                        <button
                          onClick={() =>
                            handleUpdateField(
                              "inPlaces",
                              condition.inPlaces?.filter(
                                (id: string) => id !== placeId,
                              ),
                            )
                          }
                        >
                          <X className="w-3 h-3 ml-1" />
                        </button>
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </SubSection>
          </Section>

          {/* ATUAÇÃO */}
          <Section title="Atuação" icon={Stethoscope}>
            <SubSection label="Modalidades">
              <div className="space-y-3">
                <SearchableSelector
                  label="Modalidade"
                  icon={Activity}
                  placeholder="Adicionar modalidade..."
                  selected={null}
                  onSelect={(item) => {
                    const current = condition.inModalities || [];
                    if (!current.includes(item.id)) {
                      handleUpdateField("inModalities", [...current, item.id]);
                      setHydratedData((prev) => ({
                        ...prev,
                        inModalities: [...(prev.inModalities || []), item],
                      }));
                    }
                  }}
                  onClear={() => {}}
                  searchFn={async (q) => {
                    const res = await searchService.getModalities(q);
                    return res.docs;
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {condition.inModalities?.map((modId: string) => {
                    const mod = hydratedData.inModalities?.find(
                      (m) => m.id === modId,
                    );
                    return (
                      <Chip key={modId} variant="lime" className="pr-1">
                        {mod?.name || modId}
                        <button
                          onClick={() =>
                            handleUpdateField(
                              "inModalities",
                              condition.inModalities?.filter(
                                (id: string) => id !== modId,
                              ),
                            )
                          }
                        >
                          <X className="w-3 h-3 ml-1" />
                        </button>
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </SubSection>

            <SubSection label="Especialidades / Áreas">
              <div className="space-y-3">
                <SearchableSelector
                  label="Especialidade/Área"
                  icon={Stethoscope}
                  placeholder="Adicionar atuação..."
                  selected={null}
                  onSelect={(item) => {
                    const current = condition.inClinicalAreas || [];
                    if (!current.includes(item.id)) {
                      handleUpdateField("inClinicalAreas", [
                        ...current,
                        item.id,
                      ]);
                      setHydratedData((prev) => ({
                        ...prev,
                        inClinicalAreas: [
                          ...(prev.inClinicalAreas || []),
                          item,
                        ],
                      }));
                    }
                  }}
                  onClear={() => {}}
                  searchFn={async (q) => {
                    const res = await searchService.getClinicalAreas(q);
                    return res.docs;
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {condition.inClinicalAreas?.map((areaId: string) => {
                    const area = hydratedData.inClinicalAreas?.find(
                      (a) => a.id === areaId,
                    );
                    return (
                      <Chip key={areaId} variant="purple" className="pr-1">
                        {area?.name || areaId}
                        <button
                          onClick={() =>
                            handleUpdateField(
                              "inClinicalAreas",
                              condition.inClinicalAreas?.filter(
                                (id: string) => id !== areaId,
                              ),
                            )
                          }
                        >
                          <X className="w-3 h-3 ml-1" />
                        </button>
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </SubSection>
          </Section>

          {/* TEMPO */}
          <Section title="Tempo" icon={Clock}>
            <SubSection label="Duração">
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((dur) => (
                  <Chip
                    key={dur.id}
                    variant={
                      condition.inDurationsInHours?.includes(parseInt(dur.id))
                        ? "default"
                        : "muted"
                    }
                    onClick={() => {
                      const val = parseInt(dur.id);
                      const current = condition.inDurationsInHours || [];
                      if (current.includes(val)) {
                        handleUpdateField(
                          "inDurationsInHours",
                          current.filter((v: number) => v !== val),
                        );
                      } else {
                        handleUpdateField("inDurationsInHours", [
                          ...current,
                          val,
                        ]);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {dur.name}
                  </Chip>
                ))}
              </div>
            </SubSection>

            <SubSection label="Período Disponível">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal gap-2 bg-input hover:bg-muted"
                  >
                    {condition.betweenDates?.[0] ? (
                      condition.betweenDates[1] ? (
                        <>
                          {format(condition.betweenDates[0], "dd/MM/yy")} -{" "}
                          {format(condition.betweenDates[1], "dd/MM/yy")}
                        </>
                      ) : (
                        format(condition.betweenDates[0], "dd/MM/yy")
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={condition.betweenDates?.[0]}
                    selected={{
                      from: condition.betweenDates?.[0],
                      to: condition.betweenDates?.[1],
                    }}
                    onSelect={(range: DateRange | undefined) => {
                      if (range?.from && range?.to) {
                        handleUpdateField("betweenDates", [
                          range.from,
                          range.to,
                        ] as [Date, Date]);
                      } else if (range?.from) {
                        handleUpdateField("betweenDates", [range.from]); // Temporário até ter o "to"
                      } else {
                        handleUpdateField("betweenDates", undefined);
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {condition.betweenDates && (
                <button
                  onClick={() => handleUpdateField("betweenDates", undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                >
                  <X className="w-3 h-3" /> Limpar período
                </button>
              )}
            </SubSection>
          </Section>

          {/* FINANCEIRO */}
          <Section title="Financeiro" icon={DollarSign}>
            <SubSection label="Métodos de Recebimento">
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer group border border-border"
                  >
                    <Checkbox
                      checked={condition.inPaymentMethods?.includes(method.id)}
                      onCheckedChange={() =>
                        handleToggleArrayValue("inPaymentMethods", method.id)
                      }
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        condition.inPaymentMethods?.includes(method.id)
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {method.name}
                    </span>
                  </label>
                ))}
              </div>
            </SubSection>

            <SubSection label="Faixa de preço">
              <p className="text-xs text-muted-foreground">
                Defina uma faixa de preço para filtrar as ofertas e agendamentos
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    className="pl-8"
                    value={
                      condition.betweenPriceInCents?.[0]
                        ? condition.betweenPriceInCents[0] / 100
                        : ""
                    }
                    onChange={(e) => {
                      const min = e.target.value
                        ? parseInt(e.target.value) * 100
                        : 0;
                      const max = condition.betweenPriceInCents?.[1] || 0;
                      handleUpdateField("betweenPriceInCents", [min, max] as [
                        number,
                        number,
                      ]);
                    }}
                  />
                </div>
                <span className="text-muted-foreground text-sm">até</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    placeholder="Máximo"
                    className="pl-8"
                    value={
                      condition.betweenPriceInCents?.[1]
                        ? condition.betweenPriceInCents[1] / 100
                        : ""
                    }
                    onChange={(e) => {
                      const max = e.target.value
                        ? parseInt(e.target.value) * 100
                        : 0;
                      const min = condition.betweenPriceInCents?.[0] || 0;
                      handleUpdateField("betweenPriceInCents", [min, max] as [
                        number,
                        number,
                      ]);
                    }}
                  />
                </div>
              </div>
            </SubSection>
          </Section>
          {/* VINCULAR INSTITUIÇÃO */}
          <LinkInstitutionCard />
        </motion.div>

        {/* Floating Actions Bar */}
        <div className="py-4 flex justify-center">
          <div className="max-w-4xl w-full flex justify-between gap-3 sm:justify-end">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Descartar
            </Button>
            <Button
              className="btn-lime min-w-[200px]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Salvar Preferências
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
