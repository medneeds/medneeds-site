import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RegisterData } from "@/contexts/auth/AuthContext";
import { useAuthContext } from "@/contexts/auth/useAuthContext";
import { useToast } from "@/hooks/ui/useToast";
import { MedneedsLogo } from "@/components/brand/MedneedsLogo";
import { UF_OPTIONS, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "@/utils/constants";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Briefcase,
  CreditCard,
  Hash,
  Lock,
  Mail,
  MapPin,
  User,
} from "lucide-react";

// ─── Role metadata ────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  institutional:  "Admin Institucional",
  administrative: "Administrativo",
  scheduler:      "Escalista",
  responsible:    "Responsável",
  CRM:            "Médico",
};

type RegisterType = "CRM" | "institutional" | "scheduler" | "responsible";

function roleToRegisterType(role: string): RegisterType {
  if (role === "CRM")         return "CRM";
  if (role === "scheduler")   return "scheduler";
  if (role === "responsible") return "responsible";
  return "institutional";
}

// ─── Schema (condicional ao cargo) ────────────────────────────────────────────

function buildSchema(requireCrm: boolean) {
  return z
    .object({
      name:            z.string().min(3, "Mínimo 3 caracteres"),
      email:           z.string().email("Email inválido"),
      cpf:             z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
      password:        z.string().min(6, "Mínimo 6 caracteres"),
      confirmPassword: z.string(),
      crmNumber: requireCrm
        ? z.coerce.number().min(1, "Número do CRM é obrigatório")
        : z.coerce.number().optional(),
      uf: requireCrm
        ? z.string().min(2, "UF é obrigatória").max(2, "UF inválida")
        : z.string().optional(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: "As senhas não conferem",
      path:    ["confirmPassword"],
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const INP =
  "h-12 bg-slate-800 border border-slate-700 pl-11 text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent rounded-lg";

// ─── Component ────────────────────────────────────────────────────────────────

export default function InstitutionalSignup() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp }     = useAuthContext();
  const { toast }      = useToast();
  const [loading, setLoading] = useState(false);

  const pendingInvite = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("pendingInvite");
      return raw ? (JSON.parse(raw) as { role?: string; email?: string; cpf?: string; institution?: string; token?: string }) : null;
    } catch {
      return null;
    }
  }, []);

  const role        = pendingInvite?.role ?? "";
  const inviteEmail = pendingInvite?.email ?? "";
  const cpfFromUrl  = searchParams.get("cpf") ?? "";
  const requireCrm  = role === "CRM";
  const cargoLabel  = ROLE_LABELS[role] ?? (role || null);

  const schema = useMemo(() => buildSchema(requireCrm), [requireCrm]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:            "",
      email:           inviteEmail,
      cpf:             cpfFromUrl,
      password:        "",
      confirmPassword: "",
      crmNumber:       undefined,
      uf:              "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const registerType = roleToRegisterType(role);
      const registerData: RegisterData = {
        name:        values.name,
        email:       values.email,
        password:    values.password,
        cpf:         values.cpf,
        register:    requireCrm
          ? { type: "CRM", number: values.crmNumber ?? 0, uf: values.uf ?? "" }
          : { type: registerType },
        accountType: "institutional",
      };

      const { error } = await signUp(registerData);
      if (error) {
        toast({
          title: error.message.includes("already registered")
            ? "Email já cadastrado"
            : "Erro ao cadastrar",
          description: error.message.includes("already registered")
            ? "Este email já está em uso. Tente fazer login."
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title:       "Cadastro realizado!",
          description: "Faça login para ativar seu acesso institucional.",
        });
        navigate("/auth", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <MedneedsLogo showText={false} size="sm" />
            </div>
            <div>
              <span className="text-xl font-bold text-primary">Med</span>
              <span className="text-xl font-bold text-accent">needs</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Acesso Institucional
          </p>
          <h1 className="text-2xl font-bold text-slate-100">Conclua seu cadastro</h1>
          <p className="text-slate-400 mt-1">
            Preencha seus dados para ativar o acesso institucional
          </p>
        </div>

        {/* Formulário */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Nome completo */}
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-200">
                    Nome completo
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        {...field}
                        className={cn(INP, fieldState.error && "border-destructive focus-visible:ring-destructive")}
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email + CPF */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-200">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          className={cn(INP, fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          placeholder="seu@email.com"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-200">CPF</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          {...field}
                          className={cn(INP, fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          placeholder="00000000000"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cargo (somente leitura) */}
            {cargoLabel && (
              <div>
                <p className="text-sm font-medium text-slate-200 mb-2">Cargo</p>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <div
                    className={cn(
                      INP,
                      "flex items-center rounded-lg text-slate-400 cursor-default select-none",
                    )}
                  >
                    {cargoLabel}
                  </div>
                </div>
              </div>
            )}

            {/* CRM + UF — apenas para cargo Médico */}
            {requireCrm && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="crmNumber"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-200">CRM (Número)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            className={cn(INP, fieldState.error && "border-destructive focus-visible:ring-destructive")}
                            placeholder="123456"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-200">Estado (UF)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                            <SelectTrigger
                              className={cn(
                                INP,
                                "rounded-lg",
                                fieldState.error && "border-destructive",
                              )}
                            >
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
                          {UF_OPTIONS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Senha + Confirmar */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-200">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          className={cn(INP, fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          placeholder="••••••"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-200">Confirmar senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          className={cn(INP, fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          placeholder="••••••"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Ao continuar, você concorda com nossos{" "}
          <a href={TERMS_OF_USE_URL} className="text-slate-300 hover:text-white hover:underline transition-colors">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href={PRIVACY_POLICY_URL} className="text-slate-300 hover:text-white hover:underline transition-colors">
            Política de Privacidade
          </a>
        </p>
      </motion.div>
    </div>
  );
}
