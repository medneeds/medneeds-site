import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Chip } from "@/components/ui/Chip.tsx";
import { Input } from "@/components/ui/input.tsx";
import { motion } from "framer-motion";
import { ChevronRight, MessageCircle, MoreVertical, Plus, Search, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// Mock data
const mockGroups = [
  {
    id: "1",
    name: "Equipe UTI - Hospital São Lucas",
    city: "São Paulo",
    state: "SP",
    members: 12,
    role: "manager" as const,
    pendingShifts: 3,
    pendingSwaps: 1,
    avatar: null,
    specialty: "UTI",
  },
  {
    id: "2",
    name: "Plantonistas Emergência SP",
    city: "São Paulo",
    state: "SP",
    members: 24,
    role: "member" as const,
    pendingShifts: 5,
    pendingSwaps: 0,
    avatar: null,
    specialty: "Emergência",
  },
  {
    id: "3",
    name: "Clínica Médica Regional",
    city: "Campinas",
    state: "SP",
    members: 8,
    role: "member" as const,
    pendingShifts: 2,
    pendingSwaps: 2,
    avatar: null,
    specialty: "Clínica Médica",
  },
];

const roleLabels = {
  admin: "Admin",
  manager: "Gestor",
  member: "Membro",
};

const roleVariants: Record<string, "purple" | "blue" | "green"> = {
  admin: "purple",
  manager: "blue",
  member: "green",
};

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = mockGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="page-container">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="page-header mb-0">
            <h1 className="page-title">Grupos & Equipes</h1>
            <p className="page-subtitle">Gerencie suas equipes e colabore com colegas</p>
          </div>
          <Button className="btn-lime gap-2">
            <Plus className="w-4 h-4" />
            Criar grupo
          </Button>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-md border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow"
            >
              {/* Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={group.avatar || undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                        {group.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.city}, {group.state}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Chip variant={roleVariants[group.role]} size="sm">
                    {roleLabels[group.role]}
                  </Chip>
                  <Chip variant="blue" size="sm">{group.specialty}</Chip>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{group.members} membros</span>
                  </div>
                  {group.pendingShifts > 0 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <span>{group.pendingShifts} vagas</span>
                    </div>
                  )}
                  {group.pendingSwaps > 0 && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <span>{group.pendingSwaps} trocas</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border p-3 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 gap-2" asChild>
                  <Link to={`/chat/${group.id}`}>
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Link>
                </Button>
                {group.role !== "member" && (
                  <Button variant="ghost" size="sm" className="flex-1 gap-2" asChild>
                    <Link to={`/gestor/${group.id}`}>
                      <Settings className="w-4 h-4" />
                      Gerenciar
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="gap-1" asChild>
                  <Link to={`/grupos/${group.id}`}>
                    Ver <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Create Group Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredGroups.length * 0.05 }}
            className="bg-secondary/50 rounded-md border-2 border-dashed border-border p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/50 hover:bg-secondary transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Criar novo grupo</h3>
            <p className="text-sm text-muted-foreground">
              Organize sua equipe e gerencie escalas
            </p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
