import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/ui/useToast.ts";
import { adminService } from "@/services/admin/AdminService.ts";
import { Shield, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await adminService.adminLogin(email, password);
      toast({
        title: "Bem-vindo, Admin!",
        description: "Redirecionando para o painel...",
      });
      navigate("/admin");
    } catch (err: any) {
      const message =
        err?.response?.data?.errors?.[0]?.message ||
        err?.message ||
        "Email ou senha incorretos.";
      toast({
        title: "Acesso negado",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 safe-area-inset">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md my-auto"
        >
          {/* Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/20 mb-3 sm:mb-4">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Acesso restrito a administradores</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@medneeds.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-accent focus:ring-accent text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-accent focus:ring-accent text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold group text-base"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-accent-foreground border-t-transparent rounded-full" />
                ) : (
                  <>
                    Acessar Painel
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Back to user login */}
            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700/50 h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para login de usuário
              </Button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 mt-4">
              Medneeds © 2025 • Painel de Administração
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
