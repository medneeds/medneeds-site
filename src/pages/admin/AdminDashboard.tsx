import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ShiftsFeed } from "@/components/admin/ShiftsFeed";
import { ScalesStatusList } from "@/components/admin/ScalesStatusList";
import { useAdminStats } from "@/hooks/admin/useAdminStats.tsx";
import { useRecentShifts } from "@/hooks/shifts/useRecentShifts.tsx";
import { useScalesSummary } from "@/hooks/useScalesSummary";
import { 
  Users, 
  Building2, 
  Calendar, 
  Briefcase,
  ArrowRightLeft,
  Clock,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function AdminDashboardContent() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: shifts, isLoading: shiftsLoading, refetch: refetchShifts } = useRecentShifts();
  const { data: scales, isLoading: scalesLoading, refetch: refetchScales } = useScalesSummary();

  const handleRefresh = () => {
    refetchStats();
    refetchShifts();
    refetchScales();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral da plataforma Medneeds
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.activeUsers || 0} ativos nos últimos 30 dias`}
            icon={Users}
            variant="primary"
          />
          <AdminStatCard
            title="Instituições"
            value={stats?.totalInstitutions || 0}
            subtitle={`${stats?.totalGroups || 0} grupos cadastrados`}
            icon={Building2}
            variant="default"
          />
          <AdminStatCard
            title="Escalas Ativas"
            value={stats?.activeScales || 0}
            subtitle="Escalas publicadas"
            icon={Calendar}
            variant="success"
          />
          <AdminStatCard
            title="Plantões Abertos"
            value={stats?.openShifts || 0}
            subtitle={`${stats?.pendingApplications || 0} candidaturas pendentes`}
            icon={Briefcase}
            variant="warning"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingTransfers || 0}</p>
                <p className="text-sm text-muted-foreground">Permutas pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingApplications || 0}</p>
                <p className="text-sm text-muted-foreground">Candidaturas pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Usuários ativos (30d)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Shifts Feed */}
          <Card className="shadow-xl border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <CardTitle className="text-lg font-semibold">
                Feed de Plantões
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs hover:bg-accent/10">
                Ver todos →
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <ShiftsFeed shifts={shifts || []} isLoading={shiftsLoading} />
            </CardContent>
          </Card>

          {/* Scales Status */}
          <Card className="shadow-xl border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <CardTitle className="text-lg font-semibold">
                Status das Escalas
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs hover:bg-accent/10">
                Ver todas →
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <ScalesStatusList scales={scales || []} isLoading={scalesLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return (
    <AdminAuthGuard>
      <AdminDashboardContent />
    </AdminAuthGuard>
  );
}
