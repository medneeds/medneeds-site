import { StatsCard } from "@/components/dashboard/card/StatsCard.tsx";
import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Chip } from "@/components/ui/Chip.tsx";
import { StatusBadge } from "@/components/ui/StatusBadge.tsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Plus,
  Users
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// Mock data
const pendingSwaps = [
  { id: "1", requester: "Dr. Carlos", target: "Dra. Ana", date: new Date(Date.now() + 86400000), shift: "UTI Adulto", status: "pending" },
  { id: "2", requester: "Dr. Pedro", target: null, date: new Date(Date.now() + 172800000), shift: "Emergência", status: "open" },
];

const openShifts = [
  { id: "1", title: "UTI Adulto", date: new Date(Date.now() + 86400000), time: "19:00", duration: "12h", candidates: 3 },
  { id: "2", title: "Pronto Socorro", date: new Date(Date.now() + 259200000), time: "07:00", duration: "24h", candidates: 1 },
  { id: "3", title: "Clínica Médica", date: new Date(Date.now() + 345600000), time: "19:00", duration: "12h", candidates: 0 },
];

const recentActivity = [
  { id: "1", action: "Troca aprovada", actor: "Dr. Carlos → Dra. Ana", time: "há 2 horas", type: "swap" },
  { id: "2", action: "Plantão assumido", actor: "Dr. Pedro", time: "há 4 horas", type: "assigned" },
  { id: "3", action: "Escala publicada", actor: "Você", time: "há 1 dia", type: "schedule" },
];

export default function Gestor() {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="page-container">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-9 w-9 rounded-lg hover:bg-secondary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="page-header mb-0">
              <div className="flex items-center gap-2 mb-1">
                <Chip variant="blue" size="sm">Gestor</Chip>
              </div>
              <h1 className="page-title">Equipe UTI - Hospital São Lucas</h1>
              <p className="page-subtitle">Gerencie escalas, trocas e sua equipe</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/gestor/1/equipe">
                <Users className="w-4 h-4 mr-2" />
                Equipe
              </Link>
            </Button>
            <Button className="btn-lime" asChild>
              <Link to="/gestor/1/escalas">
                <Calendar className="w-4 h-4 mr-2" />
                Escalas
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid-stats mb-8"
        >
          <StatsCard
            title="Vagas em aberto"
            value="3"
            subtitle="2 urgentes"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="Trocas pendentes"
            value="2"
            subtitle="Aguardando aprovação"
            icon={ArrowLeftRight}
            variant="accent"
          />
          <StatsCard
            title="Membros da equipe"
            value="12"
            subtitle="2 novos este mês"
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Cobertura do mês"
            value="87%"
            subtitle="4 turnos descobertos"
            icon={CheckCircle2}
            variant="success"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Open Shifts */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-md p-6 border border-border shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h2 className="font-semibold text-lg text-foreground">Plantões em aberto</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-accent" asChild>
                  <Link to="/gestor/1/plantoes-abertos">
                    Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {openShifts.map((shift, index) => (
                  <motion.div
                    key={shift.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-card flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xs text-muted-foreground">
                          {format(shift.date, "MMM", { locale: ptBR }).toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-foreground">
                          {format(shift.date, "dd")}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{shift.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {shift.time} • {shift.duration}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={shift.candidates > 0 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                          {shift.candidates} candidato{shift.candidates !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <Button size="sm" className="btn-lime">
                        Atribuir
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Pending Swaps */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-md p-6 border border-border shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-accent" />
                  <h2 className="font-semibold text-lg text-foreground">Trocas pendentes</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-accent" asChild>
                  <Link to="/gestor/1/trocas">
                    Ver todas <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {pendingSwaps.map((swap, index) => (
                  <motion.div
                    key={swap.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <ArrowLeftRight className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {swap.requester} {swap.target ? `→ ${swap.target}` : "(cobertura)"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {swap.shift} • {format(swap.date, "dd/MM")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status="pending" />
                      <Button size="sm" variant="outline">
                        Revisar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-md p-5 border border-border shadow-card"
            >
              <h3 className="font-semibold text-foreground mb-4">Ações rápidas</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/gestor/1/escalas">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver calendário de escalas
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar plantão
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/gestor/1/relatorios">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Gerar relatório
                  </Link>
                </Button>
              </div>
            </motion.section>

            {/* Schedule Status */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-navy to-navy-light rounded-md p-5 text-primary-foreground"
            >
              <h3 className="font-semibold mb-2">Escala de Janeiro</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                  Publicada
                </span>
                <span className="text-xs text-primary-foreground/70">v3 • há 1 dia</span>
              </div>
              <div className="text-sm text-primary-foreground/70 mb-4">
                <p>28 plantões agendados</p>
                <p>4 vagas em aberto</p>
              </div>
              <Button size="sm" className="btn-lime w-full">
                Editar escala
              </Button>
            </motion.section>

            {/* Recent Activity */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-md p-5 border border-border shadow-card"
            >
              <h3 className="font-semibold text-foreground mb-4">Atividade recente</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.actor} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
