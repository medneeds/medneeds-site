import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInstitutionalContext } from "@/contexts/institution/useInstitutionalContext";
import institutionalService from "@/services/institution/InstitutionalService";
import type { InviteListItem } from "@/services/institution/InstitutionalService";
import { useToast } from "@/hooks/ui/useToast";
import { parseInstitutionalError } from "@/lib/institutionalErrors";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const INVITE_ROLES = [
  { value: "institutional",  label: "Institucional" },
  { value: "administrative", label: "Administrativo" },
  { value: "scheduler",      label: "Escalista" },
  { value: "responsible",    label: "Responsável" },
  { value: "CRM",            label: "Médico" },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  INVITE_ROLES.map(r => [r.value, r.label])
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isExpired(invite: InviteListItem) {
  return invite.status === "pending" && new Date(invite.expiresAt) < new Date();
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function InviteStatusBadge({ invite }: { invite: InviteListItem }) {
  if (invite.status === "used") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Check className="w-3 h-3" /> Usado
      </span>
    );
  }
  if (invite.status === "canceled") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <X className="w-3 h-3" /> Cancelado
      </span>
    );
  }
  if (isExpired(invite)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <Clock className="w-3 h-3" /> Expirado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Clock className="w-3 h-3" /> Pendente
    </span>
  );
}

// ─── Invite row ───────────────────────────────────────────────────────────────

interface InviteRowProps {
  invite: InviteListItem;
  onCancel: (id: string) => Promise<void>;
  onResend: (id: string) => Promise<void>;
}

function InviteRow({ invite, onCancel, onResend }: InviteRowProps) {
  const [canceling, setCanceling] = useState(false);
  const [resending, setResending] = useState(false);

  const canAct = invite.status === "pending" && !isExpired(invite);

  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-card rounded-xl">
      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
        <Mail className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{invite.email}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-xs text-muted-foreground">{formatCpf(invite.cpf)}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs font-medium text-foreground">
            {ROLE_LABEL[invite.role] ?? invite.role}
          </span>
          {invite.status === "pending" && !isExpired(invite) && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                Expira {formatDate(invite.expiresAt)}
              </span>
            </>
          )}
        </div>
      </div>

      <InviteStatusBadge invite={invite} />

      {canAct && (
        <div className="flex gap-1.5 ml-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            disabled={resending}
            onClick={() => { setResending(true); onResend(invite.id).finally(() => setResending(false)); }}
            title="Reenviar convite"
          >
            {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-muted-foreground hover:text-destructive"
            disabled={canceling}
            onClick={() => { setCanceling(true); onCancel(invite.id).finally(() => setCanceling(false)); }}
            title="Cancelar convite"
          >
            {canceling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function InvitesContent() {
  const { toast } = useToast();
  const { institutions, institutionsLoading, selectedInstitutionId, setSelectedInstitutionId } =
    useInstitutionalContext();

  const [invites, setInvites]     = useState<InviteListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sending, setSending]     = useState(false);

  // Form state
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [cpf, setCpf]       = useState("");
  const [role, setRole]     = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const institutionName = institutions.find(i => i.value === selectedInstitutionId)?.label ?? "";

  const loadInvites = useCallback(async () => {
    if (!selectedInstitutionId) return;
    setLoadingList(true);
    try {
      const docs = await institutionalService.listInvites(selectedInstitutionId);
      setInvites(docs);
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao carregar convites.",
      });
      toast({ title, description, variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  }, [selectedInstitutionId]);

  useEffect(() => { loadInvites(); }, [loadInvites]);

  const handleSend = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim())              newErrors.name  = "Nome é obrigatório.";
    if (!email.trim())             newErrors.email = "E-mail é obrigatório.";
    if (cpf.replace(/\D/g, "").length !== 11) newErrors.cpf = "CPF deve ter 11 dígitos.";
    if (!role)                     newErrors.role  = "Cargo é obrigatório.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (!selectedInstitutionId) return;
    setSending(true);
    try {
      await institutionalService.createInvite(selectedInstitutionId, {
        email: email.trim(),
        cpf,
        role: role as any,
        name: name.trim(),
      });
      toast({ title: "Convite enviado!", description: `E-mail enviado para ${email}.` });
      setName(""); setEmail(""); setCpf(""); setRole(""); setErrors({});
      loadInvites();
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao enviar convite.",
      });
      toast({ title, description, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await institutionalService.cancelInvite(id);
      toast({ title: "Convite cancelado." });
      setInvites(prev => prev.map(i => i.id === id ? { ...i, status: "canceled" } : i));
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao cancelar convite.",
      });
      toast({ title, description, variant: "destructive" });
    }
  };

  const handleResend = async (id: string) => {
    try {
      await institutionalService.resendInvite(id);
      toast({ title: "Convite reenviado!" });
      loadInvites();
    } catch (err) {
      const { title, description } = parseInstitutionalError(err, {
        title: "Erro ao reenviar convite.",
      });
      toast({ title, description, variant: "destructive" });
    }
  };

  const pendingCount = invites.filter(i => i.status === "pending" && !isExpired(i)).length;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <UserPlus className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Convites</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Envie convites de acesso institucional por e-mail.
        </p>
      </motion.div>

      {/* Seletor de instituição */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="bg-card rounded-xl border px-5 py-4"
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Instituição
        </p>
        {institutionsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando instituições…
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
                <SelectItem key={inst.value} value={inst.value}>{inst.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Formulário de novo convite */}
      {selectedInstitutionId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border px-5 py-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">Novo convite</p>
            {institutionName && (
              <span className="text-xs text-muted-foreground">— o e-mail mencionará <strong>{institutionName}</strong></span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">Nome <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Nome do colaborador"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
                className={cn("h-10", errors.name && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">E-mail <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                placeholder="colaborador@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                className={cn("h-10", errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">CPF <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Digite apenas os números"
                value={cpf}
                onChange={e => { setCpf(e.target.value.replace(/\D/g, "").slice(0, 11)); setErrors(p => ({ ...p, cpf: "" })); }}
                className={cn("h-10", errors.cpf && "border-destructive focus-visible:ring-destructive")}
                inputMode="numeric"
                maxLength={11}
              />
              {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Cargo <span className="text-destructive">*</span></Label>
              <Select value={role} onValueChange={v => { setRole(v); setErrors(p => ({ ...p, role: "" })); }}>
                <SelectTrigger className={cn("h-10", errors.role && "border-destructive focus-visible:ring-destructive")}>
                  <SelectValue placeholder="Selecionar cargo" />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive mt-1">{errors.role}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending} size="sm">
              {sending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando…</>
                : <><Send className="w-4 h-4 mr-2" />Enviar convite</>
              }
            </Button>
          </div>
        </motion.div>
      )}

      {/* Lista de convites */}
      {selectedInstitutionId && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">
              {loadingList ? "Carregando…" : (
                <>
                  {invites.length} convite{invites.length !== 1 ? "s" : ""}
                  {pendingCount > 0 && <span className="ml-1 text-amber-600">({pendingCount} pendente{pendingCount !== 1 ? "s" : ""})</span>}
                </>
              )}
            </p>
            <Button variant="ghost" size="sm" onClick={loadInvites} disabled={loadingList} className="h-7 px-2">
              <RefreshCw className={cn("w-3.5 h-3.5", loadingList && "animate-spin")} />
            </Button>
          </div>

          {loadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : invites.length === 0 ? (
            <div className="bg-card rounded-xl p-10 text-center text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum convite enviado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invites.map(invite => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  onCancel={handleCancel}
                  onResend={handleResend}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function InstitutionalInvites() {
  return (
    <MainLayout>
      <InvitesContent />
    </MainLayout>
  );
}
