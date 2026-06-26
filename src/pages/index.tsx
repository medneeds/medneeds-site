import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MedneedsLogo } from "@/components/brand/MedneedsLogo";
import { ArrowRight, Calendar, Heart, Shield } from "lucide-react";
import { motion } from "framer-motion";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 flex flex-col overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 sm:p-8">
        <MedneedsLogo size="lg" />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-accent font-medium tracking-widest uppercase text-sm mb-6"
          >
            Uma nova era na medicina
          </motion.p>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-8"
          >
            Viver a medicina.
            <br />
            <span className="text-accent">Não apenas viver dela.</span>
          </motion.h1>

          {/* Philosophy text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-lg sm:text-xl text-primary-foreground/80 leading-relaxed mb-12 max-w-2xl mx-auto"
          >
            O Medneeds nasceu da crença de que a organização não deve ser um fardo, 
            mas uma libertação. Escalas, plantões e finanças — tudo em harmonia, 
            para que você possa focar no que realmente importa: 
            <span className="text-accent font-medium"> cuidar de vidas.</span>
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg px-8 py-6 rounded-full shadow-2xl shadow-accent/30 group transition-all duration-300 hover:shadow-accent/50 hover:scale-105"
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mt-16"
        >
          <FeaturePill icon={Calendar} text="Escalas inteligentes" />
          <FeaturePill icon={Shield} text="Gestão simplificada" />
          <FeaturePill icon={Heart} text="Feito por médicos" />
        </motion.div>
      </main>

      {/* Footer */}
      {/*TODO: Será implementado posteriormente*/}
      {/*<footer className="relative z-10 p-6 sm:p-8 text-center">*/}
      {/*  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-primary-foreground/50 text-sm">*/}
      {/*    /!*<button*!/*/}
      {/*    /!*  onClick={() => navigate("/gestor/login")}*!/*/}
      {/*    /!*  className="hover:text-primary-foreground/80 transition-colors"*!/*/}
      {/*    /!*>*!/*/}
      {/*    /!*  Acesso Gestores*!/*/}
      {/*    /!*</button>*!/*/}
      {/*    /!*<span className="hidden sm:inline">•</span>*!/*/}
      {/*    /!*<button*!/*/}
      {/*    /!*  onClick={() => navigate("/admin/login")}*!/*/}
      {/*    /!*  className="hover:text-primary-foreground/80 transition-colors"*!/*/}
      {/*    /!*>*!/*/}
      {/*    /!*  Administração*!/*/}
      {/*    /!*</button>*!/*/}
      {/*  </div>*/}
      {/*</footer>*/}
    </div>
  );
};

function FeaturePill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground/90 px-4 py-2 rounded-full text-sm font-medium border border-primary-foreground/10">
      <Icon className="h-4 w-4 text-accent" />
      {text}
    </div>
  );
}

export default Index;
