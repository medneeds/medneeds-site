import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RegisterData } from "@/contexts/auth/AuthContext.tsx";
import { useToast } from "@/hooks/ui/useToast.ts";
import { MedneedsLogo } from "@/components/brand/MedneedsLogo.tsx";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel.tsx";
import { AuthPortalLinks } from "@/components/auth/AuthPortalLinks.tsx";
import { AuthTabSwitcher } from "@/components/auth/AuthTabSwitcher.tsx";
import { LoginForm } from "@/components/auth/form/LoginForm.tsx";
import { SignupForm } from "@/components/auth/form/SignupForm.tsx";
import type {LoginFormValues, SignupFormValues, TokenFormValues} from "./schema/Auth.schema.ts";
import {TokenForm} from "@/components/auth/form/TokenForm.tsx";
import {PRIVACY_POLICY_URL, TERMS_OF_USE_URL} from "@/utils/constants.ts";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";
import { institutionalService } from "@/services/institution/InstitutionalService.ts";

const TAB_CONTENT = {
  login: {
    title: "Bem-vindo de volta!",
    description: "Entre para acessar sua agenda e plantões",
  },
  register: {
    title: "Crie sua conta",
    description: "Comece a organizar sua vida médica",
  },
  token: {
    title: "Verificar email",
    description: "Insira o token enviado para o e-mail que foi informado no cadastro",
  },
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signIn, signUp, verifyEmail } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "signup" | "token">("login");

  const urlToken = searchParams.get("token") ?? "";
  const urlInstitution = searchParams.get("institution") ?? "";

  const { title, description } = TAB_CONTENT[tab] ?? TAB_CONTENT.login;

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Se a URL contém token + institution (link de convite), abre aba de token automaticamente
  useEffect(() => {
    if (urlToken && urlInstitution) {
      setTab("token");
    }
  }, [urlToken, urlInstitution]);

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        toast({
          title: "Erro ao entrar",
          description: error.message === "Invalid login credentials"
            ? "Email ou senha incorretos."
            : error.message,
          variant: "destructive",
        });
        return;
      }

      // pendingInvite só existe quando o usuário passou pelo fluxo de convite institucional
      const pendingInviteRaw = sessionStorage.getItem("pendingInvite");
      if (pendingInviteRaw) {
        try {
          const pendingInvite = JSON.parse(pendingInviteRaw);
          await institutionalService.completeInvite(pendingInvite);
          toast({ title: "Acesso institucional ativado!", description: "Bem-vindo à instituição." });
        } catch (inviteErr: any) {
          console.error("[Auth] Falha ao completar convite:", inviteErr?.message);
        } finally {
          sessionStorage.removeItem("pendingInvite");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      const registerData: RegisterData = {
        name: values.name,
        email: values.email,
        password: values.password,
        cpf: values.cpf,
        register: {
          type: "CRM",
          number: values.crmNumber,
          uf: values.uf,
        },
      };

      const { error } = await signUp(registerData);
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está em uso. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao cadastrar",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email e insira o token para ativar sua conta.",
        });
        setTab("token");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (values: TokenFormValues) => {
    setLoading(true);
    try {
      if (values.loginType === "institutional") {
        // Fluxo institucional: valida convite e guarda para completar após login/cadastro
        try {
          const validated = await institutionalService.validateInvite({
            institution: urlInstitution || undefined,
            cpf: values.cpf ?? "",
            token: values.token,
          });

          sessionStorage.setItem("pendingInvite", JSON.stringify({
            institution: validated.institution,
            cpf: values.cpf ?? "",
            token: values.token,
            role: validated.role,
            email: validated.email,
          }));

          navigate(`/cadastro-institucional?cpf=${encodeURIComponent(values.cpf ?? "")}`);
        } catch (err: any) {
          const errCode = err?.response?.data?.error;
          const errMsg =
            errCode === "INVITE_NOT_FOUND"  ? "Nenhum convite encontrado para este CPF." :
            errCode === "INVITE_EXPIRED"    ? "Este convite expirou. Solicite um novo." :
            errCode === "INVITE_NOT_PENDING"? "Este convite já foi usado ou cancelado." :
            errCode === "INVALID_TOKEN"     ? "Token incorreto. Verifique e tente novamente." :
            err?.message || "Verifique o token e tente novamente.";
          toast({ title: "Token inválido", description: errMsg, variant: "destructive" });
        }
      } else {
        // Fluxo pessoal: verificação de email padrão (inalterado)
        const { error } = await verifyEmail(values.token);
        if (error) {
          toast({
            title: "Algo deu errado...",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email verificado!",
            description: "Faça login para acessar a plataforma.",
          });
          setTab("login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgetPassword = () => {
    navigate("/auth/forgot", { replace: true });
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case "login":
        return <LoginForm loading={loading} onSubmit={handleLogin} onForgetPassword={handleForgetPassword}/>;
      case "signup":
        return <SignupForm loading={loading} onSubmit={handleSignup}/>;
      case "token":
        return (
          <TokenForm
            loading={loading}
            onSubmit={handleVerifyEmail}
            defaultToken={urlToken}
            defaultLoginType={urlInstitution ? "institutional" : "personal"}
          />
        );
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative safe-area-inset">
      <AuthPortalLinks variant="desktop" />
      <AuthBrandPanel />

      {/* Right Panel — Auth Forms */}
      <div className="flex-1 flex flex-col justify-center bg-background p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
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
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Painel do Usuário
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {description}
            </p>
          </div>

          <AuthTabSwitcher activeTab={tab} onTabChange={setTab} />

          {renderTab()}

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos{" "}
            <a href={TERMS_OF_USE_URL} className="text-primary hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href={PRIVACY_POLICY_URL} className="text-primary hover:underline">
              Política de Privacidade
            </a>
          </p>

          <AuthPortalLinks variant="mobile" />
        </motion.div>
      </div>
    </div>
  );
}
