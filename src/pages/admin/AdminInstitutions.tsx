import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin/AdminService.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Plus,
  MoreHorizontal,
  Building2,
  Users,
  Layers
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function AdminInstitutionsContent() {
  const [search, setSearch] = useState("");

  const { data: institutions, isLoading, refetch } = useQuery({
    queryKey: ["admin-institutions"],
    queryFn: async () => {
      return await adminService.getInstitutions();
    },
  });

  const { data: hierarchiesCount } = useQuery({
    queryKey: ["admin-hierarchies-count"],
    queryFn: async () => {
      const stats = await adminService.getStats();
      return stats?.hierarchiesCount || 0;
    },
  });

  const { data: groupsCount } = useQuery({
    queryKey: ["admin-groups-count"],
    queryFn: async () => {
      const stats = await adminService.getStats();
      return stats?.groupsCount || 0;
    },
  });

  const filteredInstitutions = institutions?.filter((inst: any) =>
    inst.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Instituições</h1>
            <p className="text-muted-foreground">
              Gerencie hospitais, clínicas e unidades de saúde
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nova Instituição
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{institutions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Instituições</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hierarchiesCount || 0}</p>
                <p className="text-sm text-muted-foreground">Setores/Unidades</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groupsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Grupos/Equipes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Institutions Table */}
        <Card className="shadow-xl border-border/40">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Instituições</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar instituição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
              </div>
            ) : filteredInstitutions?.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-foreground mb-1">Nenhuma instituição cadastrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece adicionando a primeira instituição
                </p>
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Instituição
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instituição</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions?.map((institution: any, index: number) => (
                    <TableRow
                      key={institution.id}
                      className={`hover:bg-accent/5 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarImage src={institution.logo_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                              <Building2 className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{institution.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(institution.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Ativa
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Gerenciar setores</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Desativar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function AdminInstitutions() {
  return (
    <AdminAuthGuard>
      <AdminInstitutionsContent />
    </AdminAuthGuard>
  );
}
