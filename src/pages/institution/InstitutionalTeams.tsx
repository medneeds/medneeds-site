import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext";
import institutionalService from "@/services/institution/InstitutionalService";
import type {
  InstitutionMemberParameter,
  TeamItem,
} from "@/services/institution/InstitutionalService";
import { useToast } from "@/hooks/ui/useToast";
import { parseInstitutionalError } from "@/lib/institutionalErrors";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const TEAM_TYPES = [
  { value: "assistential", label: "Assistencial" },
  { value: "administrative", label: "Administrativo" },
  { value: "operational", label: "Operacional" },
  { value: "other", label: "Outro" },
];

const TEAM_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TEAM_TYPES.map((t) => [t.value, t.label])
);

const TYPE_COLORS: Record<string, string> = {
  assistential:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  administrative:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  operational:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-muted text-muted-foreground",
};

const MEMBER_ROLE_LABEL: Record<string, string> = {
  institutional: "Institucional",
  administrative: "Administrativo",
  scheduler: "Escalista",
  responsible: "Responsável",
  CRM: "Médico",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TeamFormState {
  name: string;
  area: string;
  teamType: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  acceptsNewMembers: boolean;
  active: boolean;
  professionals: string[];
}

const emptyForm: TeamFormState = {
  name: "",
  area: "",
  teamType: "",
  description: "",
  contactEmail: "",
  contactPhone: "",
  acceptsNewMembers: true,
  active: true,
  professionals: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function TeamTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        TYPE_COLORS[type] ?? "bg-muted text-muted-foreground"
      )}
    >
      {TEAM_TYPE_LABEL[type] ?? type}
    </span>
  );
}

// ─── Member picker ────────────────────────────────────────────────────────────

interface MemberPickerProps {
  members: InstitutionMemberParameter[];
  loading: boolean;
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MemberPicker({
  members,
  loading,
  selected,
  onChange,
}: MemberPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const available = members.filter(
    (m) =>
      !selected.includes(m.userId) &&
      (search === "" ||
        m.profileName.toLowerCase().includes(search.toLowerCase()) ||
        (MEMBER_ROLE_LABEL[m.role] ?? m.role)
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  const add = (userId: string) => {
    onChange([...selected, userId]);
    setSearch("");
    inputRef.current?.focus();
  };

  const remove = (userId: string) => {
    onChange(selected.filter((id) => id !== userId));
  };

  const selectedMembers = selected
    .map((id) => members.find((m) => m.userId === id))
    .filter(Boolean) as InstitutionMemberParameter[];

  return (
    <div className="space-y-2">
      {/* Chips dos selecionados */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMembers.map((m) => (
            <span
              key={m.userId}
              className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-xs bg-accent/10 text-foreground border border-accent/20"
            >
              <span className="font-medium">{m.profileName}</span>
              <span className="text-muted-foreground text-[11px]">
                {MEMBER_ROLE_LABEL[m.role] ?? m.role}
              </span>
              <button
                type="button"
                onClick={() => remove(m.userId)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={
            loading
              ? "Carregando membros…"
              : "Buscar e adicionar colaborador…"
          }
          value={search}
          disabled={loading}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-9 pl-8"
        />

        {/* Dropdown */}
        {open && !loading && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            {available.length > 0 ? (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="max-h-52 overflow-y-auto">
                  {available.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent/10 text-left transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        add(m.userId);
                        setOpen(false);
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[11px] font-bold flex-shrink-0">
                        {m.profileName.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-foreground font-medium">
                        {m.profileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {MEMBER_ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : search ? (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-sm px-3 py-2.5 text-sm text-muted-foreground">
                Nenhum colaborador encontrado.
              </div>
            ) : null}
          </>
        )}
      </div>

      {!loading && members.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum membro ativo nesta instituição.
        </p>
      )}
    </div>
  );
}

// ─── Team row ─────────────────────────────────────────────────────────────────

interface TeamRowProps {
  team: TeamItem;
  members: InstitutionMemberParameter[];
  isEditing: boolean;
  onEdit: (team: TeamItem) => void;
  onDelete: (id: string) => Promise<void>;
}

function TeamRow({ team, members, isEditing, onEdit, onDelete }: TeamRowProps) {
  const [deleting, setDeleting] = useState(false);

  const profNames = (team.professionals ?? [])
    .map((id) => members.find((m) => m.userId === id)?.profileName)
    .filter(Boolean) as string[];

  return (
    <div
      className={cn(
        "flex items-start gap-4 px-5 py-4 bg-card rounded-xl transition-colors",
        isEditing && "ring-2 ring-accent/50"
      )}
    >
      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
        <Users className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-foreground">{team.name}</p>
          {team.area && (
            <span className="text-xs text-muted-foreground">— {team.area}</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <TeamTypeBadge type={team.teamType} />
          {team.active === false ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              Inativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Ativo
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            · criado {formatDate(team.createdAt)}
          </span>
        </div>

        {/* Colaboradores */}
        {profNames.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <UserCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {profNames.map((name) => (
              <span
                key={name}
                className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1.5 ml-2 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 px-2",
            isEditing
              ? "text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onEdit(team)}
          title="Editar time"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-muted-foreground hover:text-destructive"
          disabled={deleting}
          onClick={() => {
            setDeleting(true);
            onDelete(team.id).finally(() => setDeleting(false));
          }}
          title="Excluir time"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function TeamsContent() {
  const { toast } = useToast();
  const {
    institutions,
    institutionsLoading,
    selectedInstitutionId,
    setSelectedInstitutionId,
  } = useInstitutionalContext();

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [members, setMembers] = useState<InstitutionMemberParameter[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null);
  const [form, setForm] = useState<TeamFormState>(emptyForm);

  const loadTeams = useCallback(async () => {
    if (!selectedInstitutionId) return;
    setLoadingList(true);
    try {
      const docs = await institutionalService.listTeams(selectedInstitutionId);
      setTeams(docs);
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao carregar times.",
      });
      toast({ title, description, variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  }, [selectedInstitutionId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (!selectedInstitutionId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    institutionalService
      .getParameters(selectedInstitutionId)
      .then((items) => setMembers(items.filter((m) => m.status === "active")))
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, [selectedInstitutionId]);

  const startEdit = (team: TeamItem) => {
    setEditingTeam(team);
    setForm({
      name: team.name ?? "",
      area: team.area ?? "",
      teamType: team.teamType ?? "",
      description: team.description ?? "",
      contactEmail: team.contactEmail ?? "",
      contactPhone: team.contactPhone ?? "",
      acceptsNewMembers: team.acceptsNewMembers !== false,
      active: team.active !== false,
      professionals: team.professionals ?? [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!selectedInstitutionId || !form.name.trim()) {
      toast({ title: "Nome do time é obrigatório.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        area: form.area.trim() || undefined,
        teamType: form.teamType || undefined,
        description: form.description.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        acceptsNewMembers: form.acceptsNewMembers,
        active: form.active,
        professionals: form.professionals,
      };

      if (editingTeam) {
        const updated = await institutionalService.updateTeam(
          editingTeam.id,
          payload
        );
        setTeams((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        toast({ title: "Time atualizado com sucesso!" });
        cancelEdit();
      } else {
        const created = await institutionalService.createTeam(
          selectedInstitutionId,
          payload
        );
        setTeams((prev) => [created, ...prev]);
        toast({ title: "Time criado com sucesso!" });
        setForm(emptyForm);
      }
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: editingTeam ? "Erro ao atualizar time." : "Erro ao criar time.",
      });
      toast({ title, description, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await institutionalService.deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Time excluído." });
      if (editingTeam?.id === id) cancelEdit();
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao excluir time.",
      });
      toast({ title, description, variant: "destructive" });
    }
  };

  const activeCount = teams.filter((t) => t.active !== false).length;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Times</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie os times da sua instituição.
        </p>
      </motion.div>

      {/* Seletor de instituição */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
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
            onValueChange={setSelectedInstitutionId}
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

      {/* Formulário de criação / edição */}
      {selectedInstitutionId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border px-5 py-5 space-y-4"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {editingTeam ? (
                <Pencil className="w-4 h-4 text-accent" />
              ) : (
                <Plus className="w-4 h-4 text-accent" />
              )}
              <p className="text-sm font-semibold text-foreground">
                {editingTeam ? `Editando: ${editingTeam.name}` : "Novo time"}
              </p>
            </div>
            {editingTeam && (
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
                className="h-7 px-2 text-muted-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancelar edição
              </Button>
            )}
          </div>

          {/* Campos principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nome do time"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Área</Label>
              <Input
                placeholder="Ex: UTI, Pronto-Socorro"
                value={form.area}
                onChange={(e) =>
                  setForm((f) => ({ ...f, area: e.target.value }))
                }
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Tipo</Label>
              <Select
                value={form.teamType}
                onValueChange={(v) => setForm((f) => ({ ...f, teamType: v }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">E-mail de contato</Label>
              <Input
                type="email"
                placeholder="contato@email.com"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactEmail: e.target.value }))
                }
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">
                Telefone de contato
              </Label>
              <Input
                placeholder="(00) 00000-0000"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPhone: e.target.value }))
                }
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Descrição</Label>
              <Input
                placeholder="Descrição breve do time"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="h-10"
              />
            </div>
          </div>

          {/* Colaboradores */}
          <div>
            <Label className="text-xs mb-1.5 block">Colaboradores</Label>
            <MemberPicker
              members={members}
              loading={membersLoading}
              selected={form.professionals}
              onChange={(professionals) =>
                setForm((f) => ({ ...f, professionals }))
              }
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                id="acceptsNewMembers"
                checked={form.acceptsNewMembers}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, acceptsNewMembers: v }))
                }
                className="data-[state=checked]:bg-accent"
              />
              <Label
                htmlFor="acceptsNewMembers"
                className="text-xs cursor-pointer"
              >
                Aceita novos membros
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                className="data-[state=checked]:bg-accent"
              />
              <Label htmlFor="active" className="text-xs cursor-pointer">
                Ativo
              </Label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingTeam ? "Salvando…" : "Criando…"}
                </>
              ) : editingTeam ? (
                "Salvar alterações"
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar time
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Lista de times */}
      {selectedInstitutionId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">
              {loadingList ? (
                "Carregando…"
              ) : (
                <>
                  {teams.length} time{teams.length !== 1 ? "s" : ""}
                  {activeCount > 0 && (
                    <span className="ml-1 text-green-600">
                      ({activeCount} ativo{activeCount !== 1 ? "s" : ""})
                    </span>
                  )}
                </>
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTeams}
              disabled={loadingList}
              className="h-7 px-2"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", loadingList && "animate-spin")}
              />
            </Button>
          </div>

          {loadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-card rounded-xl p-10 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum time criado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  members={members}
                  isEditing={editingTeam?.id === team.id}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function InstitutionalTeams() {
  return (
    <MainLayout>
      <TeamsContent />
    </MainLayout>
  );
}
