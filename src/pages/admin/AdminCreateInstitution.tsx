import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
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
import { useToast } from "@/hooks/ui/useToast";
import { adminService } from "@/services/admin/AdminService";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Loader2, Lock, LogOut, Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const INSTITUTION_TYPES = [
  { value: "hospital",          label: "Hospital" },
  { value: "clinic",            label: "Clínica" },
  { value: "laboratory",        label: "Laboratório" },
  { value: "diagnostic-center", label: "Centro de Diagnóstico" },
  { value: "outpatient",        label: "Ambulatório" },
  { value: "other",             label: "Outro" },
];


const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

interface InstForm {
  legalName: string; tradeName: string; cnpj: string;
  institutionType: string; cnes: string;
  email: string; phone: string;
  zipCode: string; state: string; city: string;
  district: string; street: string; number: string; complement: string;
}

interface CollabForm {
  name: string; email: string; cpf: string; password: string;
  phoneNumber: string; whatsappNumber: string;
}

const EMPTY_INST: InstForm = {
  legalName: "", tradeName: "", cnpj: "", institutionType: "", cnes: "",
  email: "", phone: "", zipCode: "", state: "", city: "",
  district: "", street: "", number: "", complement: "",
};

const EMPTY_COLLAB: CollabForm = {
  name: "", email: "", cpf: "", password: "",
  phoneNumber: "", whatsappNumber: "",
};

const INP = "h-8 bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-600 text-xs rounded-md";

function F({ label, req, children, className }: { label: React.ReactNode; req?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <Label className="text-[10px] text-slate-500 font-medium uppercase tracking-wide leading-none">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}


function AdminCreateInstitutionContent() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inst, setInst]     = useState<InstForm>(EMPTY_INST);
  const [collab, setCollab] = useState<CollabForm>(EMPTY_COLLAB);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const fi = (k: keyof InstForm)   => ({ value: inst[k],   onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInst(p  => ({ ...p, [k]: e.target.value })) });
  const fc = (k: keyof CollabForm) => ({ value: collab[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCollab(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingInst   = !inst.legalName.trim() || !inst.cnpj.trim() || !inst.institutionType;
    const missingCollab = !collab.name.trim() || !collab.email.trim() || !collab.cpf.trim() || !collab.password.trim();

    if (missingInst || missingCollab) {
      toast({
        title: "Campos obrigatórios",
        description: missingInst
          ? "Razão Social, CNPJ e Tipo são obrigatórios."
          : "Nome, e-mail, CPF e senha do colaborador são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const instPayload: Record<string, unknown> = { active: true };
      (Object.keys(inst) as (keyof InstForm)[]).forEach(k => {
        if (inst[k].trim()) instPayload[k] = inst[k].trim();
      });
      const instResp = await adminService.createInstitution(instPayload);
      const institutionId: string = instResp?.doc?.id ?? instResp?.id ?? "";
      if (!institutionId) throw new Error("ID da instituição não retornado.");

      const profilePayload: Record<string, unknown> = {
        name: collab.name.trim(),
        email: collab.email.trim().toLowerCase(),
        password: collab.password,
        cpf: collab.cpf.trim(),
        accountType: "institutional",
        _verified: true,
      };
      if (collab.phoneNumber.trim())    profilePayload.phoneNumber    = collab.phoneNumber.trim();
      if (collab.whatsappNumber.trim()) profilePayload.whatsappNumber = collab.whatsappNumber.trim();
      profilePayload.register = { type: "institutional" };
      const profileResp = await adminService.createProfile(profilePayload);
      const profileId: string = profileResp?.doc?.id ?? profileResp?.id ?? "";
      if (!profileId) throw new Error("ID do perfil não retornado.");

      await adminService.createInstitutionMember({
        user: profileId, institution: institutionId,
        role: "institutional", status: "active",
        profileName: collab.name.trim(),
      });

      setInst(EMPTY_INST);
      setCollab(EMPTY_COLLAB);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
      toast({ title: "Instituição criada com sucesso!" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: { message: string }[]; message?: string } }; message?: string };
      const msg = e?.response?.data?.errors?.[0]?.message || e?.response?.data?.message || e?.message || "Erro ao criar.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <header className="flex-shrink-0 border-b border-slate-800 px-6 h-11 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold">Medneeds Admin</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { adminService.adminLogout(); navigate("/auth"); }}
          className="h-7 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 gap-1.5">
          <LogOut className="w-3 h-3" /> Sair
        </Button>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden px-8 py-5">
        <div className="flex-shrink-0 flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-bold text-slate-100">Criar Instituição</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Preencha os dados da instituição e do primeiro colaborador.</p>
          </div>
          {done && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300">Instituição criada!</span>
            </motion.div>
          )}
        </div>

        {/*
          Grid unificado: [inst-col1][inst-col2][divider][colab-col1][colab-col2]
          Cada linha é compartilhada — campos dos dois lados ficam na mesma altura.
          Linhas 1-11 explícitas via row-start para garantir posicionamento correto.
        */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 grid grid-cols-[1fr_1fr_1px_1fr_1fr] [grid-template-rows:repeat(9,auto)] content-between gap-x-4 gap-y-2 min-h-0">

            {/* Divisor vertical */}
            <div className="col-start-3 [grid-row:1/10] bg-slate-800" />

            {/* L1: Títulos */}
            <div className="col-start-1 col-span-2 row-start-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-slate-300">Dados da Instituição</span>
            </div>
            <div className="col-start-4 col-span-2 row-start-1 flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-slate-300">Colaborador Institucional</span>
            </div>

            {/* L2: Razão Social | Cargo */}
            <F label="Razão Social" req className="col-start-1 col-span-2 row-start-2">
              <Input className={INP} placeholder="Razão social da instituição" {...fi("legalName")} />
            </F>
            <F label="Cargo" className="col-start-4 col-span-2 row-start-2">
              <div className={`${INP} flex items-center px-3 text-slate-400 cursor-default select-none`}>
                Admin Institucional
              </div>
            </F>

            {/* L3: Nome Fantasia + CNPJ | Nome Completo */}
            <F label="Nome Fantasia" className="col-start-1 row-start-3">
              <Input className={INP} placeholder="Nome fantasia" {...fi("tradeName")} />
            </F>
            <F label="CNPJ" req className="col-start-2 row-start-3">
              <Input className={INP} placeholder="00000000000000" inputMode="numeric" maxLength={14}
                value={inst.cnpj}
                onChange={e => setInst(p => ({ ...p, cnpj: e.target.value.replace(/\D/g, "").slice(0, 14) }))} />
            </F>
            <F label="Nome Completo" req className="col-start-4 col-span-2 row-start-3">
              <Input className={INP} placeholder="Nome completo" {...fc("name")} />
            </F>

            {/* L4: Tipo + CNES | E-mail + CPF */}
            <F label="Tipo" req className="col-start-1 row-start-4">
              <Select value={inst.institutionType} onValueChange={v => setInst(p => ({ ...p, institutionType: v }))}>
                <SelectTrigger className={INP}><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {INSTITUTION_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-slate-100 focus:bg-slate-700 text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="CNES" className="col-start-2 row-start-4">
              <Input className={INP} placeholder="0000000" inputMode="numeric" maxLength={7}
                value={inst.cnes}
                onChange={e => setInst(p => ({ ...p, cnes: e.target.value.replace(/\D/g, "").slice(0, 7) }))} />
            </F>
            <F label="E-mail" req className="col-start-4 row-start-4">
              <Input type="email" className={INP} placeholder="email@colab.com" {...fc("email")} />
            </F>
            <F label="CPF" req className="col-start-5 row-start-4">
              <Input className={INP} placeholder="00000000000" inputMode="numeric" maxLength={11}
                value={collab.cpf}
                onChange={e => setCollab(p => ({ ...p, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) }))} />
            </F>

            {/* L5: E-mail inst + Tel inst | Senha */}
            <F label="E-mail" className="col-start-1 row-start-5">
              <Input type="email" className={INP} placeholder="email@inst.com" {...fi("email")} />
            </F>
            <F label="Telefone" className="col-start-2 row-start-5">
              <Input className={INP} placeholder="00000000000" inputMode="numeric" maxLength={11}
                value={inst.phone}
                onChange={e => setInst(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))} />
            </F>
            <F label={<span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5" />Senha Inicial<span className="text-red-400 ml-0.5">*</span></span>} className="col-start-4 col-span-2 row-start-5">
              <Input type="password" className={INP} placeholder="Senha de acesso" {...fc("password")} />
            </F>

            {/* L6: CEP + Estado | Tel colab + WhatsApp */}
            <F label="CEP" className="col-start-1 row-start-6">
              <Input className={INP} placeholder="00000000" inputMode="numeric" maxLength={8}
                value={inst.zipCode}
                onChange={e => setInst(p => ({ ...p, zipCode: e.target.value.replace(/\D/g, "").slice(0, 8) }))} />
            </F>
            <F label="Estado" className="col-start-2 row-start-6">
              <Select value={inst.state} onValueChange={v => setInst(p => ({ ...p, state: v }))}>
                <SelectTrigger className={INP}><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-44">
                  {UF_OPTIONS.map(uf => <SelectItem key={uf} value={uf} className="text-slate-100 focus:bg-slate-700 text-xs">{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            <F label="Telefone" className="col-start-4 row-start-6">
              <Input className={INP} placeholder="00000000000" inputMode="numeric" maxLength={11}
                value={collab.phoneNumber}
                onChange={e => setCollab(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 11) }))} />
            </F>
            <F label="WhatsApp" className="col-start-5 row-start-6">
              <Input className={INP} placeholder="00000000000" inputMode="numeric" maxLength={11}
                value={collab.whatsappNumber}
                onChange={e => setCollab(p => ({ ...p, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 11) }))} />
            </F>

            {/* L7: Cidade + Bairro */}
            <F label="Cidade" className="col-start-1 row-start-7">
              <Input className={INP} placeholder="Cidade" {...fi("city")} />
            </F>
            <F label="Bairro" className="col-start-2 row-start-7">
              <Input className={INP} placeholder="Bairro" {...fi("district")} />
            </F>
            <div className="col-start-4 col-span-2 row-start-7" />

            {/* L8: Logradouro + Número */}
            <F label="Logradouro" className="col-start-1 row-start-[8]">
              <Input className={INP} placeholder="Rua / Av." {...fi("street")} />
            </F>
            <F label="Número" className="col-start-2 row-start-[8]">
              <Input className={INP} placeholder="Nº" maxLength={10} {...fi("number")} />
            </F>
            <div className="col-start-4 col-span-2 row-start-[8]" />

            {/* L9: Complemento */}
            <F label="Complemento" className="col-start-1 col-span-2 row-start-[9]">
              <Input className={INP} placeholder="Sala, bloco, andar…" {...fi("complement")} />
            </F>
            <div className="col-start-4 col-span-2 row-start-[9]" />

          </div>

          <div className="flex-shrink-0 pt-4 flex justify-end border-t border-slate-800 mt-4">
            <Button type="submit" disabled={saving}
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground h-9 px-6 text-sm">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</>
                : <><Save className="w-4 h-4" /> Criar Instituição</>
              }
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function AdminCreateInstitution() {
  return (
    <AdminAuthGuard>
      <AdminCreateInstitutionContent />
    </AdminAuthGuard>
  );
}
