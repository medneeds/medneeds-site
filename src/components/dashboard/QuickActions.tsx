import { IQuickActions } from "@/components/dashboard/types/QuickActions.interface.ts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  Calendar,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const actions: IQuickActions[] = [
  {
    title: "Agenda",
    description: "Configure sua agenda completa",
    icon: Calendar,
    href: "/agenda",
  },
  {
    title: "Ofertas",
    description: "Veja as ofertas disponíveis para você",
    icon: BriefcaseBusiness,
    href: "/ofertas",
  },
  {
    title: "Recebimentos",
    description: "Acompanhe os seus recebimentos",
    icon: Wallet,
    href: "/recebimentos",
  },
  {
    title: "Transferências",
    description: "Gerencie os seus pagamentos e transferências",
    icon: ArrowLeftRight,
    href: "/transferencias",
  },
  //TODO: Implementação para outro módulo
  // { title: "Chat", icon: MessageCircle, href: "/chat", color: "bg-pink-100 text-pink-600", soon: true },
  // { title: "Gestor", icon: ClipboardList, href: "/gestor", color: "bg-slate-100 text-slate-600", soon: true },
  // { title: "Postagens", icon: FileText, href: "/postagens", color: "bg-orange-100 text-orange-600", soon: true },
];

export function QuickActions() {
  return (
    <div className="px-4 sm:px-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            className="h-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Link
              to={action?.soon ? "#" : action.href}
              className={cn(
                "relative flex flex-col items-start justify-center sm:items-center p-4 rounded-2xl h-32 sm:h-full bg-card sm:border sm:border-foreground/10 shadow-sm transition-all hover:bg-muted/10 hover:shadow-md hover:border-foreground/20 group active:scale-[0.98]",
              )}
              onClick={(e) => action.soon && e.preventDefault()}
            >
              <div className="flex items-center gap-3 mb-2 sm:flex-col sm:gap-2 sm:w-full sm:justify-center">
                <div className="flex items-center justify-center text-gray-500 sm:w-12 sm:h-12 sm:rounded-xl sm:bg-muted/50 sm:group-hover:bg-primary/20 transition-colors">
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <span className="text-sm font-semibold text-foreground leading-tight">
                  {action.title}
                </span>
              </div>

              <span className="text-xs font-medium text-muted-foreground text-left sm:text-center leading-tight">
                {action?.description}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
