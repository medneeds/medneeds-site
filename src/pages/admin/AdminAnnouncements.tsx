import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Plus, 
  Send,
  Clock,
  CheckCircle,
  Users,
  Megaphone
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock data for demonstration
const mockAnnouncements = [
  {
    id: "1",
    title: "Manutenção programada",
    message: "O sistema passará por manutenção no dia 15/02 das 02:00 às 04:00.",
    status: "sent",
    audience: "all",
    sentAt: new Date("2025-01-28T10:00:00"),
    readCount: 145,
    totalRecipients: 200,
  },
  {
    id: "2",
    title: "Nova funcionalidade: Permutas",
    message: "Agora você pode solicitar e gerenciar permutas de plantão diretamente pelo app!",
    status: "sent",
    audience: "all",
    sentAt: new Date("2025-01-25T14:30:00"),
    readCount: 180,
    totalRecipients: 200,
  },
  {
    id: "3",
    title: "Atualização de termos de uso",
    message: "Os termos de uso foram atualizados. Confira as mudanças na seção de configurações.",
    status: "draft",
    audience: "all",
    sentAt: null,
    readCount: 0,
    totalRecipients: 200,
  },
];

function AdminAnnouncementsContent() {
  const [announcements] = useState(mockAnnouncements);

  const stats = {
    total: announcements.length,
    sent: announcements.filter(a => a.status === "sent").length,
    drafts: announcements.filter(a => a.status === "draft").length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comunicados</h1>
            <p className="text-muted-foreground">
              Envie comunicados em massa para os usuários
            </p>
          </div>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Novo Comunicado
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de comunicados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.drafts}</p>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements List */}
        <Card className="shadow-xl border-border/40">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Histórico de Comunicados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-foreground mb-1">Nenhum comunicado ainda</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie seu primeiro comunicado para os usuários
                </p>
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Comunicado
                </Button>
              </div>
            ) : (
              announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-x-1 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {announcement.title}
                        </h3>
                        {announcement.status === "sent" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Rascunho
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {announcement.audience === "all" ? "Todos os usuários" : announcement.audience}
                        </span>
                        {announcement.sentAt && (
                          <span>
                            Enviado em {format(announcement.sentAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                        {announcement.status === "sent" && (
                          <span className="text-emerald-600">
                            {announcement.readCount}/{announcement.totalRecipients} lidos
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {announcement.status === "draft" && (
                        <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          <Send className="h-4 w-4 mr-1" />
                          Enviar
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function AdminAnnouncements() {
  return (
    <AdminAuthGuard>
      <AdminAnnouncementsContent />
    </AdminAuthGuard>
  );
}
