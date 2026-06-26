import { Button } from "@/components/ui/button.tsx";
import { Stethoscope, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ForgotPasswordForm } from "@/components/auth/form/ForgotPasswordForm.tsx";
import { ResetPasswordForm } from "@/components/auth/form/ResetPasswordForm.tsx";
import { ForgotPasswordFormValues, ResetPasswordFormValues } from "@/pages/auth/schema/Auth.schema.ts";
import { useToast } from "@/hooks/ui/useToast.ts";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forgotPassword, resetPassword } = useAuthContext();

  const [submitted, setSubmitted] = useState(false);
  const [resetSuccessful, setResetSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    setEmail(values.email);
    try {
      const { error } = await forgotPassword(values.email);
      if (error) {
        toast({
          title: "Algo deu errado...",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Código enviado!",
          description: "Verifique sua caixa de entrada.",
        });
        setSubmitted(true);
        setTimer(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0 || !email) return;

    setLoading(true);
    try {
      const { error } = await forgotPassword(email);
      if (error) {
        toast({
          title: "Algo deu errado...",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Código reenviado!",
          description: "Verifique sua caixa de entrada.",
        });
        setTimer(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(values.token, values.password);
      if (error) {
        toast({
          title: "Erro ao redefinir",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi atualizada com sucesso.",
        });
        setResetSuccessful(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccessful) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Senha redefinida!</h1>
          <p className="text-muted-foreground mb-8">
            Sua senha foi atualizada com sucesso. Você já pode fazer login com sua nova senha.
          </p>
          <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link to="/auth">Ir para o login</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back link */}
        <button
          onClick={() => submitted ? setSubmitted(false) : navigate("/auth")}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {submitted ? "Voltar ao e-mail" : "Voltar ao login"}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl text-foreground">Medneeds</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {submitted ? "Redefinir sua senha" : "Esqueceu sua senha?"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {submitted
            ? "Digite o código que enviamos para o seu e-mail e sua nova senha abaixo."
            : "Não se preocupe! Digite seu e-mail e enviaremos um código para redefinir sua senha."}
        </p>

        {submitted ? (
          <ResetPasswordForm
            loading={loading}
            onSubmit={handleResetPassword}
          />
        ) : (
          <ForgotPasswordForm
            loading={loading}
            onSubmit={handleForgotPassword}
          />
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {submitted ? (
              <>
                Não recebeu o código?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={timer > 0 || loading}
                  className="text-primary font-medium hover:underline disabled:opacity-50 disabled:hover:no-underline"
                >
                  {timer > 0 ? `Reenviar código (${timer}s)` : "Reenviar código"}
                </button>
              </>
            ) : (
              <>
                Lembrou sua senha?{" "}
                <Link to="/auth" className="text-primary font-medium hover:underline">
                  Faça login
                </Link>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
