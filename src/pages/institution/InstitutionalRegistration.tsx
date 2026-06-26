import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext";
import institutionalService from "@/services/institution/InstitutionalService";
import type {
  InstitutionProfile,
  MemberProfile,
  UpdateInstitutionProfilePayload,
  UpdateMemberProfilePayload,
} from "@/services/institution/InstitutionalService";
import { useToast } from "@/hooks/ui/useToast";
import {
  parseInstitutionalError,
  extractErrorCode,
} from "@/lib/institutionalErrors";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  Loader2,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  Search,
  Stethoscope,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INSTITUTION_TYPES: Record<string, string> = {
  hospital: "Hospital",
  clinic: "Clínica",
  upa: "UPA",
  ubs: "UBS",
  laboratory: "Laboratório",
  other: "Outro",
};

function typeLabel(type: string) {
  return INSTITUTION_TYPES[type] ?? type;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

// ─── Access Error Banner ───────────────────────────────────────────────────────

interface AccessBannerProps {
  title: string;
  description?: string;
  onRetry?: () => void;
}

function AccessBanner({ title, description, onRetry }: AccessBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 bg-destructive/8 border border-destructive/20 rounded-xl px-5 py-4"
    >
      <Lock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-destructive">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRetry}
          className="h-7 px-2 text-muted-foreground flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      )}
    </motion.div>
  );
}

// ─── Save Error Banner ─────────────────────────────────────────────────────────

function SaveErrorBanner({
  title,
  description,
  onDismiss,
}: {
  title: string;
  description?: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-lg px-4 py-3"
    >
      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-destructive">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

type FormState = Omit<UpdateInstitutionProfilePayload, "institutionId">;

function buildForm(profile: InstitutionProfile): FormState {
  return {
    tradeName: profile.tradeName,
    institutionType: profile.institutionType,
    cnes: profile.cnes,
    email: profile.email,
    phone: profile.phone,
    zipCode: profile.zipCode,
    state: profile.state,
    city: profile.city,
    street: profile.street,
    number: profile.number,
    complement: profile.complement,
    district: profile.district,
    notes: profile.notes,
  };
}

// ─── Role labels ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  institutional: "Admin Institucional",
  administrative: "Administrativo",
  scheduler: "Escalista",
  responsible: "Responsável",
  CRM: "Médico",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active:    { label: "Ativo",     className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  suspended: { label: "Suspenso",  className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  inactive:  { label: "Inativo",   className: "bg-muted text-muted-foreground" },
  pending:   { label: "Pendente",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

// ─── Collaborator card (inside modal) ─────────────────────────────────────────

interface CollaboratorCardProps {
  member: MemberProfile;
  onSaved: (updated: MemberProfile) => void;
}

function CollaboratorCard({ member, onSaved }: CollaboratorCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Pick<UpdateMemberProfilePayload, 'profileName' | 'phoneNumber' | 'whatsappNumber' | 'about'>>({
    profileName: member.profileName,
    phoneNumber: member.phoneNumber,
    whatsappNumber: member.whatsappNumber,
    about: member.about,
  });

  const roleInfo  = ROLE_LABELS[member.role] ?? member.role;
  const statusInfo = STATUS_LABELS[member.status] ?? { label: member.status, className: "bg-muted text-muted-foreground" };

  const initials = (member.profileName || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      await institutionalService.updateMemberProfile({ memberId: member.memberId, ...form });
      onSaved({ ...member, ...form });
      setEditing(false);
      toast({ title: "Colaborador atualizado." });
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, { title: "Erro ao salvar." });
      toast({ title, description, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({ profileName: member.profileName, phoneNumber: member.phoneNumber, whatsappNumber: member.whatsappNumber, about: member.about });
    setEditing(false);
  };

  const f = (key: keyof typeof form) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{member.profileName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{roleInfo}</span>
            {member.email && (
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">· {member.email}</span>
            )}
          </div>
        </div>
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0", statusInfo.className)}>
          {statusInfo.label}
        </span>
        <div className="text-muted-foreground flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-5 pb-5 pt-4 space-y-5">
          {/* Edit toggle */}
          <div className="flex justify-end">
            {editing ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-7">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving} className="h-7 text-muted-foreground">
                  <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5 h-7">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nome */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Nome
              </p>
              {editing ? (
                <Input className="h-9" {...f("profileName")} placeholder="Nome completo" />
              ) : (
                <p className="text-sm text-foreground">{member.profileName || "—"}</p>
              )}
            </div>

            {/* E-mail (somente leitura) */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> E-mail
              </p>
              <p className="text-sm text-foreground">{member.email || "—"}</p>
            </div>

            {/* CPF (somente leitura) */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">CPF</p>
              <p className="text-sm text-foreground">{member.cpf || "—"}</p>
            </div>

            {/* Telefone */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> Telefone
              </p>
              {editing ? (
                <Input className="h-9" {...f("phoneNumber")} placeholder="(00) 00000-0000" />
              ) : (
                <p className="text-sm text-foreground">{member.phoneNumber || "—"}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">WhatsApp</p>
              {editing ? (
                <Input className="h-9" {...f("whatsappNumber")} placeholder="(00) 00000-0000" />
              ) : (
                <p className="text-sm text-foreground">{member.whatsappNumber || "—"}</p>
              )}
            </div>

            {/* Formatura */}
            {member.graduationYear && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Ano de Formatura</p>
                <p className="text-sm text-foreground">{member.graduationYear}</p>
              </div>
            )}

            {/* Registro (CRM / tipo — somente leitura) */}
            {member.register && (
              <div className="sm:col-span-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3 h-3" /> Registro Profissional
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-foreground font-medium">{member.register.type}</span>
                  {member.register.number && (
                    <span className="text-sm text-foreground">{member.register.number} / {member.register.uf}</span>
                  )}
                  {member.register.verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Áreas clínicas (somente leitura) */}
            {member.clinicalAreas.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Áreas de Atuação</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.clinicalAreas.map((area) => (
                    <span key={area} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{area}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Sobre */}
            {(editing || member.about) && (
              <div className="sm:col-span-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Sobre</p>
                {editing ? (
                  <textarea
                    className="w-full min-h-[72px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Biografia / informações adicionais"
                    {...f("about")}
                  />
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{member.about || "—"}</p>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          {member.invitedAt && (
            <p className="text-xs text-muted-foreground pt-1 border-t">
              Vinculado em {new Date(member.invitedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal de colaboradores ────────────────────────────────────────────────────

interface CollaboratorsModalProps {
  open: boolean;
  onClose: () => void;
  institutionId: string;
  institutionName: string;
}

function CollaboratorsModal({ open, onClose, institutionId, institutionName }: CollaboratorsModalProps) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await institutionalService.getMembersProfiles(institutionId);
      setMembers(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? "Erro ao carregar colaboradores.");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    if (open) { load(); setSearch(""); }
  }, [open, load]);

  const handleSaved = (updated: MemberProfile) => {
    setMembers((prev) => prev.map((m) => m.memberId === updated.memberId ? updated : m));
  };

  const filtered = search.trim()
    ? members.filter((m) =>
        m.profileName.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Colaboradores — {institutionName}
          </DialogTitle>
        </DialogHeader>

        {/* Barra de pesquisa */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou e-mail…"
              className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="h-8 px-2 text-muted-foreground flex-shrink-0" title="Atualizar">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground flex-shrink-0">
          {loading
            ? "Carregando…"
            : search.trim()
              ? `${filtered.length} de ${members.length} colaborador${members.length !== 1 ? "es" : ""}`
              : `${members.length} colaborador${members.length !== 1 ? "es" : ""}`}
        </p>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">{search.trim() ? "Nenhum colaborador encontrado para essa pesquisa." : "Nenhum colaborador encontrado."}</p>
            </div>
          ) : (
            filtered.map((m) => (
              <CollaboratorCard key={m.memberId} member={m} onSaved={handleSaved} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

type AccessError = {
  title: string;
  description?: string;
} | null;

function RegistrationContent() {
  const { toast } = useToast();
  const {
    institutions,
    institutionsLoading,
    selectedInstitutionId,
    setSelectedInstitutionId,
  } = useInstitutionalContext();

  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessError, setAccessError] = useState<AccessError>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<AccessError>(null);
  const [form, setForm] = useState<FormState>({});
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!selectedInstitutionId) return;
    setLoading(true);
    setAccessError(null);
    setProfile(null);
    setEditing(false);
    setSaveError(null);
    try {
      const data = await institutionalService.getInstitutionProfile(
        selectedInstitutionId
      );
      setProfile(data);
    } catch (err) {
      const { title, description, isAccessError } = parseInstitutionalError(
        err,
        { title: "Erro ao carregar dados da instituição." }
      );
      if (isAccessError) {
        setAccessError({ title, description });
      } else {
        setAccessError({ title, description });
        toast({ title, description, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedInstitutionId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleInstitutionChange = (id: string) => {
    if (editing) {
      // Descarta edição ao trocar de instituição
      setEditing(false);
      setForm({});
      setSaveError(null);
    }
    setSelectedInstitutionId(id);
  };

  const startEditing = () => {
    if (!profile) return;
    setForm(buildForm(profile));
    setSaveError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setForm({});
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: UpdateInstitutionProfilePayload = {
        ...form,
        institutionId: profile.id,
      };
      const updated = await institutionalService.updateInstitutionProfile(payload);
      setProfile(updated);
      setEditing(false);
      setForm({});
      toast({ title: "Dados atualizados com sucesso!" });
    } catch (err) {
      const errorCode = extractErrorCode(err);
      const { title, description, isAccessError: isAccess } =
        parseInstitutionalError(err, { title: "Erro ao salvar." });

      if (isAccess) {
        // Erros de permissão ficam inline no formulário
        setSaveError({ title, description });
        // Erros de acesso total bloqueiam o modo edição
        if (errorCode === "FORBIDDEN" || errorCode === "INSTITUTIONAL_CONTEXT_REQUIRED") {
          setEditing(false);
          setAccessError({ title, description });
        }
      } else {
        toast({ title, description, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof FormState) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Building2 className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">
            Cadastro Institucional
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Visualize e edite as informações da sua instituição.
        </p>
      </motion.div>

      {/* Seletor de instituição */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="bg-card rounded-xl border px-5 py-4"
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Instituição
        </p>
        {institutionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando
            instituições…
          </div>
        ) : institutions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma instituição encontrada.
          </p>
        ) : (
          <Select
            value={selectedInstitutionId ?? institutions[0].value}
            onValueChange={handleInstitutionChange}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={institutions[0].label} />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((inst) => (
                <SelectItem key={inst.value} value={inst.value}>
                  {inst.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Acesso negado / erro de carregamento */}
      {!loading && accessError && (
        <AccessBanner
          title={accessError.title}
          description={accessError.description}
          onRetry={loadProfile}
        />
      )}

      {/* Visualização */}
      {!loading && profile && !editing && !accessError && (
        <>
          {/* Dados Gerais */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-card rounded-xl border px-5 py-5 space-y-4"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-foreground">
                Dados Gerais
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={loadProfile}
                  className="h-7 px-2 text-muted-foreground"
                  title="Atualizar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCollaboratorsOpen(true)}
                  className="h-7 gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Colaboradores
                </Button>
                <Button
                  size="sm"
                  onClick={startEditing}
                  className="h-7 gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Razão Social" value={profile.legalName} />
              <InfoRow label="Nome Fantasia" value={profile.tradeName} />
              <InfoRow label="CNPJ" value={profile.cnpj} />
              <InfoRow
                label="Tipo"
                value={typeLabel(profile.institutionType)}
              />
              <InfoRow label="CNES" value={profile.cnes} />
            </div>
          </motion.div>

          {/* Contato */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-card rounded-xl border px-5 py-5 space-y-4"
          >
            <p className="text-sm font-semibold text-foreground mb-1">
              Contato
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="E-mail" value={profile.email} />
              <InfoRow label="Telefone" value={profile.phone} />
            </div>
          </motion.div>

          {/* Endereço */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-card rounded-xl border px-5 py-5 space-y-4"
          >
            <p className="text-sm font-semibold text-foreground mb-1">
              Endereço
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="CEP" value={profile.zipCode} />
              <InfoRow label="Estado" value={profile.state} />
              <InfoRow label="Cidade" value={profile.city} />
              <InfoRow label="Bairro" value={profile.district} />
              <InfoRow label="Logradouro" value={profile.street} />
              <InfoRow label="Número" value={profile.number} />
              <InfoRow label="Complemento" value={profile.complement} />
            </div>
          </motion.div>

          {/* Observações */}
          {profile.notes && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border px-5 py-5"
            >
              <p className="text-sm font-semibold text-foreground mb-3">
                Observações
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {profile.notes}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* Modal de colaboradores */}
      {profile && (
        <CollaboratorsModal
          open={collaboratorsOpen}
          onClose={() => setCollaboratorsOpen(false)}
          institutionId={profile.id}
          institutionName={profile.tradeName || profile.legalName || ""}
        />
      )}

      {/* Formulário de edição */}
      {!loading && profile && editing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border px-5 py-5 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold text-foreground">
                Editar Cadastro
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEditing}
              className="h-7 px-2 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Cancelar
            </Button>
          </div>

          {/* Erro inline de salvamento */}
          {saveError && (
            <SaveErrorBanner
              title={saveError.title}
              description={saveError.description}
              onDismiss={() => setSaveError(null)}
            />
          )}

          {/* Campos somente leitura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg">
            <InfoRow label="Razão Social (não editável)" value={profile.legalName} />
            <InfoRow label="CNPJ (não editável)" value={profile.cnpj} />
          </div>

          {/* Dados Gerais */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Dados Gerais
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block">Nome Fantasia</Label>
                <Input
                  className="h-10"
                  placeholder="Nome fantasia"
                  {...field("tradeName")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">
                  Tipo de Instituição
                </Label>
                <Input
                  className="h-10"
                  placeholder="hospital, clinic, upa…"
                  {...field("institutionType")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">CNES</Label>
                <Input
                  className="h-10"
                  placeholder="Código CNES"
                  {...field("cnes")}
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Contato
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block">E-mail</Label>
                <Input
                  type="email"
                  className="h-10"
                  placeholder="email@instituicao.com"
                  {...field("email")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Telefone</Label>
                <Input
                  className="h-10"
                  placeholder="(00) 00000-0000"
                  {...field("phone")}
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Endereço
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block">CEP</Label>
                <Input
                  className="h-10"
                  placeholder="00000-000"
                  {...field("zipCode")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Estado</Label>
                <Input
                  className="h-10"
                  placeholder="UF"
                  {...field("state")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Cidade</Label>
                <Input
                  className="h-10"
                  placeholder="Cidade"
                  {...field("city")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Bairro</Label>
                <Input
                  className="h-10"
                  placeholder="Bairro"
                  {...field("district")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Logradouro</Label>
                <Input
                  className="h-10"
                  placeholder="Rua / Av."
                  {...field("street")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Número</Label>
                <Input
                  className="h-10"
                  placeholder="Nº"
                  {...field("number")}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs mb-1.5 block">Complemento</Label>
                <Input
                  className="h-10"
                  placeholder="Sala, bloco, andar…"
                  {...field("complement")}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-xs mb-1.5 block">Observações</Label>
            <Input
              className="h-10"
              placeholder="Informações adicionais"
              {...field("notes")}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar alterações
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function InstitutionalRegistration() {
  return (
    <MainLayout>
      <RegistrationContent />
    </MainLayout>
  );
}
