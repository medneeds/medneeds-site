import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useInstitutionalMembers } from "@/hooks/institution/useInstitutionalMembers";
import type { InstitutionMemberParameter } from "@/services/institution/InstitutionalService";
import institutionalService from "@/services/institution/InstitutionalService";
import { useToast } from "@/hooks/ui/useToast";
import { parseInstitutionalError } from "@/lib/institutionalErrors";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Stethoscope,
  User,
  UserPlus,
  UserX,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

// ─── Tipos e grupos de permissões ─────────────────────────────────────────────

type PermType = "operational" | "dashboard";

interface GroupedPermission {
  key: string;
  label: string;
  type: PermType;
}

interface PermissionGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  permissions: GroupedPermission[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permissions: [
      { key: "view_dashboard_overview",    label: "Visão geral",   type: "dashboard" },
      { key: "view_dashboard_financial",   label: "Financeiro",    type: "dashboard" },
      { key: "view_dashboard_operational", label: "Operacional",   type: "dashboard" },
      { key: "view_dashboard_people",      label: "Pessoas",       type: "dashboard" },
      { key: "view_dashboard_shifts",      label: "Plantões",      type: "dashboard" },
    ],
  },
  {
    key: "agenda",
    label: "Agenda",
    icon: Calendar,
    permissions: [
      { key: "manage_shifts", label: "Criar plantão",        type: "operational" },
      { key: "delete_shifts", label: "Excluir plantões",    type: "operational" },
      { key: "mark_absence",  label: "Marcar falta",        type: "operational" },
    ],
  },
  {
    key: "convites",
    label: "Convites",
    icon: Mail,
    permissions: [
      { key: "generate_invite_token", label: "Gerar convite",        type: "operational" },
      { key: "create_member_link",    label: "Criar vínculo direto", type: "operational" },
      { key: "manage_invites",        label: "Gerenciar convites",   type: "operational" },
      { key: "cancel_invites",        label: "Cancelar convites",    type: "operational" },
      { key: "resend_invites",        label: "Reenviar convites",    type: "operational" },
    ],
  },
  {
    key: "times",
    label: "Times",
    icon: Users,
    permissions: [
      { key: "manage_teams", label: "Gerenciar times (criar, editar, excluir)", type: "operational" },
    ],
  },
  {
    key: "ofertas",
    label: "Ofertas",
    icon: Briefcase,
    permissions: [
      { key: "create_offer", label: "Criar oferta", type: "operational" },
    ],
  },
  {
    key: "atuacao",
    label: "Atuação",
    icon: Stethoscope,
    permissions: [
      { key: "act_as_medico", label: "Atuar como médico", type: "operational" },
    ],
  },
  {
    key: "permissoes",
    label: "Permissões",
    icon: ShieldCheck,
    permissions: [
      { key: "manage_permissions", label: "Gerenciar permissões de acesso", type: "operational" },
    ],
  },
  {
    key: "cadastro",
    label: "Cadastro",
    icon: Settings2,
    permissions: [
      { key: "edit_institution_settings", label: "Editar dados cadastrais da instituição", type: "operational" },
    ],
  },
];

// ─── Presets ──────────────────────────────────────────────────────────────────

const ROLES = [
  { value: "administrative", label: "Administrativo" },
  { value: "scheduler",      label: "Escalista" },
  { value: "responsible",    label: "Responsável" },
  { value: "CRM",            label: "Médico" },
];

type PresetMap = Record<string, { operationalPermissions: string[]; dashboardPermissions: string[] }>;

const ALL_OP   = PERMISSION_GROUPS.flatMap(g => g.permissions.filter(p => p.type === "operational").map(p => p.key));
const ALL_DASH = PERMISSION_GROUPS.flatMap(g => g.permissions.filter(p => p.type === "dashboard").map(p => p.key));

const DEFAULT_PRESETS: PresetMap = {
  administrative: {
    operationalPermissions: [
      "manage_invites", "cancel_invites", "resend_invites",
      "manage_teams", "manage_shifts", "delete_shifts", "mark_absence",
      "create_offer", "manage_permissions",
    ],
    dashboardPermissions: ALL_DASH,
  },
  scheduler: {
    operationalPermissions: ["manage_teams", "manage_shifts", "delete_shifts", "create_offer"],
    dashboardPermissions:   ["view_dashboard_overview", "view_dashboard_shifts"],
  },
  responsible: {
    operationalPermissions: ["manage_shifts", "mark_absence"],
    dashboardPermissions:   ["view_dashboard_overview", "view_dashboard_shifts", "view_dashboard_people"],
  },
  CRM: {
    operationalPermissions: ["generate_invite_token", "manage_invites"],
    dashboardPermissions:   ["view_dashboard_overview"],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface EditState {
  role: string;
  operationalPermissions: string[];
  dashboardPermissions: string[];
}

function getGroupCounts(group: PermissionGroup, edit: EditState) {
  const total = group.permissions.length;
  const checked = group.permissions.filter(p =>
    p.type === "operational"
      ? edit.operationalPermissions.includes(p.key)
      : edit.dashboardPermissions.includes(p.key)
  ).length;
  return { total, checked, isAll: checked === total, isSome: checked > 0 && checked < total, hasAny: checked > 0 };
}

// ─── Accordion de grupo de permissões ────────────────────────────────────────

interface PermissionGroupAccordionProps {
  group: PermissionGroup;
  edit: EditState;
  onChange: (partial: Partial<EditState>) => void;
  defaultOpen?: boolean;
}

function PermissionGroupAccordion({ group, edit, onChange, defaultOpen = false }: PermissionGroupAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { total, checked, isAll, isSome } = getGroupCounts(group, edit);

  const opKeys   = group.permissions.filter(p => p.type === "operational").map(p => p.key);
  const dashKeys = group.permissions.filter(p => p.type === "dashboard").map(p => p.key);

  const handleGroupToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAll) {
      onChange({
        operationalPermissions: edit.operationalPermissions.filter(k => !opKeys.includes(k)),
        dashboardPermissions:   edit.dashboardPermissions.filter(k => !dashKeys.includes(k)),
      });
    } else {
      onChange({
        operationalPermissions: [...new Set([...edit.operationalPermissions, ...opKeys])],
        dashboardPermissions:   [...new Set([...edit.dashboardPermissions, ...dashKeys])],
      });
    }
  };

  const toggleItem = (key: string, type: PermType) => {
    if (type === "operational") {
      onChange({
        operationalPermissions: edit.operationalPermissions.includes(key)
          ? edit.operationalPermissions.filter(k => k !== key)
          : [...edit.operationalPermissions, key],
      });
    } else {
      onChange({
        dashboardPermissions: edit.dashboardPermissions.includes(key)
          ? edit.dashboardPermissions.filter(k => k !== key)
          : [...edit.dashboardPermissions, key],
      });
    }
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors select-none"
        onClick={() => setOpen(v => !v)}
      >
        <div onClick={handleGroupToggle}>
          <Checkbox
            checked={isAll ? true : isSome ? "indeterminate" : false}
            className="pointer-events-none"
          />
        </div>
        <group.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">{group.label}</span>
        {checked > 0 && (
          <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full">
            {checked}/{total}
          </span>
        )}
        {open
          ? <ChevronUp  className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </div>

      {open && (
        <div className="border-t px-4 py-3 space-y-2.5 bg-muted/10">
          {group.permissions.map(p => (
            <label key={p.key} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={
                  p.type === "operational"
                    ? edit.operationalPermissions.includes(p.key)
                    : edit.dashboardPermissions.includes(p.key)
                }
                onCheckedChange={() => toggleItem(p.key, p.type)}
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {p.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal de configuração de presets ────────────────────────────────────────

interface PresetConfigModalProps {
  open: boolean;
  presets: PresetMap;
  onSave: (updated: PresetMap) => void;
  onClose: () => void;
}

function PresetConfigModal({ open, presets, onSave, onClose }: PresetConfigModalProps) {
  const [local, setLocal]           = useState<PresetMap>(() => structuredClone(presets));
  const [activeRole, setActiveRole] = useState("institutional");

  const curEdit: EditState = {
    role: activeRole,
    operationalPermissions: local[activeRole]?.operationalPermissions ?? [],
    dashboardPermissions:   local[activeRole]?.dashboardPermissions   ?? [],
  };

  const handleChange = (partial: Partial<EditState>) => {
    setLocal(prev => ({
      ...prev,
      [activeRole]: {
        operationalPermissions: partial.operationalPermissions ?? prev[activeRole].operationalPermissions,
        dashboardPermissions:   partial.dashboardPermissions   ?? prev[activeRole].dashboardPermissions,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-accent" />
            Configurar permissões padrão por cargo
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">
          Defina quais permissões são pré-selecionadas ao aplicar cada cargo como preset.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setActiveRole(r.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                activeRole === r.value
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-border text-foreground hover:border-accent/60",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          {PERMISSION_GROUPS.map(group => (
            <PermissionGroupAccordion
              key={group.key}
              group={group}
              edit={curEdit}
              onChange={handleChange}
              defaultOpen={getGroupCounts(group, curEdit).hasAny}
            />
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button size="sm" onClick={() => { onSave(local); onClose(); }}>Salvar configuração</Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Preset chips ─────────────────────────────────────────────────────────────

interface PresetChipsProps {
  activeRole: string;
  onApply: (role: string) => void;
  onOpenConfig: () => void;
}

function PresetChips({ activeRole, onApply, onOpenConfig }: PresetChipsProps) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Adicionar permissões pré-configuradas
      </p>
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => {
          const isActive = activeRole === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onApply(r.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                isActive
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-border text-foreground hover:border-accent/60 hover:text-accent",
              )}
            >
              {isActive && <Check className="w-3 h-3" />}
              {r.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-accent/60 hover:text-accent transition-all"
        >
          <Plus className="w-3 h-3" />
          Personalizar
        </button>
      </div>
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      active
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-muted text-muted-foreground",
    )}>
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

interface MemberRowProps {
  member: InstitutionMemberParameter;
  presets: PresetMap;
  onSave: (memberId: string, state: EditState) => Promise<void>;
  onToggleStatus: (memberId: string, currentStatus: string) => Promise<void>;
  onOpenPresetConfig: () => void;
}

function MemberRow({ member, presets, onSave, onToggleStatus, onOpenPresetConfig }: MemberRowProps) {
  const [expanded, setExpanded]           = useState(false);
  const [saving, setSaving]               = useState(false);
  const [confirmDeactivate, setConfirm]   = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [edit, setEdit]                   = useState<EditState>({
    role:                   member.role,
    operationalPermissions: member.operationalPermissions ?? [],
    dashboardPermissions:   member.dashboardPermissions   ?? [],
  });

  const applyPreset = (role: string) => {
    const preset = presets[role];
    if (!preset) return;
    setEdit({ role, ...preset });
  };

  const handleChange = (partial: Partial<EditState>) =>
    setEdit(prev => ({ ...prev, ...partial }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(member.memberId, edit); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setEdit({
      role:                   member.role,
      operationalPermissions: member.operationalPermissions ?? [],
      dashboardPermissions:   member.dashboardPermissions   ?? [],
    });
    setExpanded(false);
  };

  const handleToggleStatus = async () => {
    setConfirm(false);
    setTogglingStatus(true);
    try { await onToggleStatus(member.memberId, member.status); }
    finally { setTogglingStatus(false); }
  };

  const isActive = member.status === 'active';
  const roleLabel = ROLES.find(r => r.value === member.role)?.label ?? member.role;

  // Grupos com ao menos 1 permissão (para o resumo no cabeçalho)
  const activeGroups = PERMISSION_GROUPS.filter(g => getGroupCounts(g, edit).hasAny);

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
          <User className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{member.profileName}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
            {!expanded && activeGroups.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {activeGroups.map(g => (
                  <span key={g.key} className="inline-flex items-center gap-1 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                    <g.icon className="w-2.5 h-2.5" />
                    {g.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <StatusBadge status={member.status} />

        {/* Botão desativar/reativar — inline sem propagar o click do accordion */}
        <div
          className="flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          {confirmDeactivate ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Confirmar?</span>
              <button
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className="text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                {togglingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sim"}
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/30 transition-colors"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              disabled={togglingStatus}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors",
                isActive
                  ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                  : "border-green-500/40 text-green-600 hover:bg-green-500/10",
              )}
              title={isActive ? "Desativar membro" : "Reativar membro"}
            >
              {isActive
                ? <UserX className="w-3.5 h-3.5" />
                : <UserCheck className="w-3.5 h-3.5" />
              }
              {isActive ? "Desativar" : "Reativar"}
            </button>
          )}
        </div>

        <div className="ml-1 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-5 pb-5 pt-4 space-y-5">
          <PresetChips
            activeRole={edit.role}
            onApply={applyPreset}
            onOpenConfig={onOpenPresetConfig}
          />

          <div className="space-y-2">
            {PERMISSION_GROUPS.map(group => (
              <PermissionGroupAccordion
                key={group.key}
                group={group}
                edit={edit}
                onChange={handleChange}
                defaultOpen={getGroupCounts(group, edit).hasAny}
              />
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal: Adicionar Colaborador ────────────────────────────────────────────

const REGISTER_TYPES = ["CRM", "RMS", "RMV", "COREN", "CRO", "CRF", "CRP"];

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

const MEMBER_ROLES_ADD = [
  { value: "institutional", label: "Admin Institucional" },
  { value: "administrative", label: "Administrativo" },
  { value: "scheduler",      label: "Escalista" },
  { value: "responsible",    label: "Responsável" },
  { value: "CRM",            label: "Médico (CRM)" },
];

interface AddCollaboratorForm {
  name: string; email: string; cpf: string; password: string;
  phoneNumber: string; whatsappNumber: string; role: string;
  registerType: string; registerNumber: string; registerUf: string;
}

const EMPTY_FORM: AddCollaboratorForm = {
  name: "", email: "", cpf: "", password: "",
  phoneNumber: "", whatsappNumber: "", role: "administrative",
  registerType: "", registerNumber: "", registerUf: "",
};

interface AddCollaboratorModalProps {
  open: boolean;
  onClose: () => void;
  institutionId: string;
  onSuccess: () => void;
}

function AddCollaboratorModal({ open, onClose, institutionId, onSuccess }: AddCollaboratorModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<AddCollaboratorForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const f = (key: keyof AddCollaboratorForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const handleClose = () => { setForm(EMPTY_FORM); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.cpf.trim() || !form.password.trim()) {
      toast({ title: "Campos obrigatórios", description: "Nome, e-mail, CPF e senha são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await institutionalService.createDirectMember({
        institutionId,
        name: form.name,
        email: form.email,
        cpf: form.cpf,
        password: form.password,
        role: form.role,
        phoneNumber: form.phoneNumber || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        registerType: form.registerType || undefined,
        registerNumber: form.registerNumber || undefined,
        registerUf: form.registerUf || undefined,
      });
      toast({ title: "Colaborador adicionado com sucesso!" });
      setForm(EMPTY_FORM);
      onSuccess();
      onClose();
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, { title: "Erro ao adicionar colaborador." });
      toast({ title, description, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent" />
            Adicionar Colaborador
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2">
          Cria o acesso e vincula diretamente à instituição, sem necessidade de convite.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Cargo */}
          <div>
            <Label className="text-xs mb-1.5 block">Cargo <span className="text-destructive">*</span></Label>
            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEMBER_ROLES_ADD.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1.5 block">Nome Completo <span className="text-destructive">*</span></Label>
              <Input className="h-9" placeholder="Nome completo" {...f("name")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">E-mail <span className="text-destructive">*</span></Label>
              <Input type="email" className="h-9" placeholder="email@exemplo.com" {...f("email")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">CPF <span className="text-destructive">*</span></Label>
              <Input className="h-9" placeholder="000.000.000-00" {...f("cpf")} />
            </div>
          </div>

          {/* Senha */}
          <div>
            <Label className="text-xs mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Senha Inicial <span className="text-destructive">*</span>
            </Label>
            <Input type="password" className="h-9" placeholder="Senha de acesso" {...f("password")} />
          </div>

          {/* Telefone + WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Telefone</Label>
              <Input className="h-9" placeholder="(00) 00000-0000" {...f("phoneNumber")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">WhatsApp</Label>
              <Input className="h-9" placeholder="(00) 00000-0000" {...f("whatsappNumber")} />
            </div>
          </div>

          {/* Registro profissional */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Registro Profissional (opcional)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Tipo</Label>
                <Select value={form.registerType} onValueChange={v => setForm(p => ({ ...p, registerType: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Ex: CRM" /></SelectTrigger>
                  <SelectContent>
                    {REGISTER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Número</Label>
                <Input className="h-9" placeholder="123456" {...f("registerNumber")} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">UF</Label>
                <Select value={form.registerUf} onValueChange={v => setForm(p => ({ ...p, registerUf: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {UF_OPTIONS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1 border-t">
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Adicionar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PermissionsContent() {
  const { toast } = useToast();
  const { institutions, institutionsLoading, selectedInstitutionId, setSelectedInstitutionId } =
    useInstitutionalContext();

  const { members, loading, saving, error, reload, savePermissions, syncMembers, toggleMemberStatus } =
    useInstitutionalMembers(selectedInstitutionId ?? undefined);

  const [presets, setPresets]             = useState<PresetMap>(DEFAULT_PRESETS);
  const [presetModalOpen, setPresetModal] = useState(false);
  const [addCollabOpen, setAddCollab]     = useState(false);

  const handleToggleStatus = async (memberId: string, currentStatus: string) => {
    try {
      await toggleMemberStatus(memberId, currentStatus);
      toast({ title: currentStatus === 'active' ? "Membro desativado." : "Membro reativado." });
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, { title: "Erro ao alterar status." });
      toast({ title, description, variant: "destructive" });
    }
  };

  const handleSave = async (memberId: string, state: EditState) => {
    try {
      await savePermissions({
        memberId,
        role: state.role,
        operationalPermissions: state.operationalPermissions,
        dashboardPermissions:   state.dashboardPermissions,
      });
      toast({ title: "Permissões salvas com sucesso." });
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao salvar permissões.",
      });
      toast({ title, description, variant: "destructive" });
    }
  };

  const handleSync = async () => {
    try {
      await syncMembers();
      toast({ title: "Membros sincronizados." });
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao sincronizar membros.",
      });
      toast({ title, description, variant: "destructive" });
    }
  };

  return (
    <div className="page-container space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Permissões de Acesso</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie os cargos e permissões dos colaboradores por instituição.
        </p>
      </motion.div>

      {/* Seletor de instituição */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-card rounded-xl border px-5 py-4"
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Instituição
        </p>
        {institutionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando instituições…
          </div>
        ) : institutions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma instituição encontrada.</p>
        ) : (
          <Select
            value={selectedInstitutionId ?? institutions[0].value}
            onValueChange={setSelectedInstitutionId}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={institutions[0].label} />
            </SelectTrigger>
            <SelectContent>
              {institutions.map(inst => (
                <SelectItem key={inst.value} value={inst.value}>
                  {inst.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Controles */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="flex gap-2 justify-end flex-wrap"
      >
        <Button
          size="sm"
          onClick={() => setAddCollab(true)}
          disabled={!selectedInstitutionId}
          className="gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Colaborador
        </Button>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={saving}>
          {saving
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <RefreshCw className="w-4 h-4 mr-2" />
          }
          Sincronizar membros
        </Button>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </motion.div>

      {/* Lista de membros */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        {!selectedInstitutionId ? (
          <div className="bg-card rounded-xl p-10 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Selecione uma instituição para ver os colaboradores.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive rounded-xl px-5 py-4 text-sm">{error}</div>
        ) : members.filter(m => m.role !== "institutional").length === 0 ? (
          <div className="bg-card rounded-xl p-10 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum colaborador encontrado.</p>
            <p className="text-xs mt-1">Clique em "Sincronizar membros" para importar os membros da instituição.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-1">
              {members.filter(m => m.role !== "institutional").length} colaborador{members.filter(m => m.role !== "institutional").length !== 1 ? "es" : ""}
            </p>
            {members.filter(m => m.role !== "institutional").map(m => (
              <MemberRow
                key={m.memberId}
                member={m}
                presets={presets}
                onSave={handleSave}
                onToggleStatus={handleToggleStatus}
                onOpenPresetConfig={() => setPresetModal(true)}
              />
            ))}
          </>
        )}
      </motion.div>

      <PresetConfigModal
        open={presetModalOpen}
        presets={presets}
        onSave={setPresets}
        onClose={() => setPresetModal(false)}
      />

      {selectedInstitutionId && (
        <AddCollaboratorModal
          open={addCollabOpen}
          onClose={() => setAddCollab(false)}
          institutionId={selectedInstitutionId}
          onSuccess={reload}
        />
      )}
    </div>
  );
}

export default function InstitutionalPermissions() {
  return (
    <MainLayout>
      <PermissionsContent />
    </MainLayout>
  );
}
