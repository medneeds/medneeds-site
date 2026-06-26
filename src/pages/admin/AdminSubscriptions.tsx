import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, CreditCard, Loader2, Building2, FolderTree, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin/AdminService.ts";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  max_institutions: number | null;
  max_sectors_per_institution: number | null;
  max_teams_per_sector: number | null;
  max_members_per_team: number | null;
  max_total_members: number | null;
  base_price_cents: number;
  price_per_institution_cents: number | null;
  price_per_sector_cents: number | null;
  price_per_team_cents: number | null;
  price_per_active_member_cents: number | null;
  billing_cycle: string;
  features: Record<string, boolean>;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
}

export default function AdminSubscriptions() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_sectors_per_institution: "",
    max_teams_per_sector: "",
    max_total_members: "",
    base_price_cents: "",
    price_per_sector_cents: "",
    price_per_team_cents: "",
    price_per_active_member_cents: "",
    billing_cycle: "monthly",
    is_active: true,
    is_public: true,
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const data = await adminService.getSubscriptionPlans();
      return data as SubscriptionPlan[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async (data: Partial<SubscriptionPlan>) => {
      await adminService.createSubscriptionPlan(data);
    },
    onSuccess: () => {
      toast.success("Plano criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao criar plano");
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SubscriptionPlan> & { id: string }) => {
      await adminService.updateSubscriptionPlan(id, data);
    },
    onSuccess: () => {
      toast.success("Plano atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      setEditingPlan(null);
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar plano");
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      await adminService.deleteSubscriptionPlan(id);
    },
    onSuccess: () => {
      toast.success("Plano removido!");
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao remover plano");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      max_sectors_per_institution: "",
      max_teams_per_sector: "",
      max_total_members: "",
      base_price_cents: "",
      price_per_sector_cents: "",
      price_per_team_cents: "",
      price_per_active_member_cents: "",
      billing_cycle: "monthly",
      is_active: true,
      is_public: true,
    });
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description || "",
      max_sectors_per_institution: plan.max_sectors_per_institution?.toString() || "",
      max_teams_per_sector: plan.max_teams_per_sector?.toString() || "",
      max_total_members: plan.max_total_members?.toString() || "",
      base_price_cents: (plan.base_price_cents / 100).toString(),
      price_per_sector_cents: plan.price_per_sector_cents ? (plan.price_per_sector_cents / 100).toString() : "",
      price_per_team_cents: plan.price_per_team_cents ? (plan.price_per_team_cents / 100).toString() : "",
      price_per_active_member_cents: plan.price_per_active_member_cents ? (plan.price_per_active_member_cents / 100).toString() : "",
      billing_cycle: plan.billing_cycle,
      is_active: plan.is_active,
      is_public: plan.is_public,
    });
    setEditingPlan(plan);
  };

  const handleSubmit = () => {
    const planData = {
      name: formData.name,
      description: formData.description || null,
      max_sectors_per_institution: formData.max_sectors_per_institution ? parseInt(formData.max_sectors_per_institution) : null,
      max_teams_per_sector: formData.max_teams_per_sector ? parseInt(formData.max_teams_per_sector) : null,
      max_total_members: formData.max_total_members ? parseInt(formData.max_total_members) : null,
      base_price_cents: Math.round(parseFloat(formData.base_price_cents || "0") * 100),
      price_per_sector_cents: formData.price_per_sector_cents ? Math.round(parseFloat(formData.price_per_sector_cents) * 100) : null,
      price_per_team_cents: formData.price_per_team_cents ? Math.round(parseFloat(formData.price_per_team_cents) * 100) : null,
      price_per_active_member_cents: formData.price_per_active_member_cents ? Math.round(parseFloat(formData.price_per_active_member_cents) * 100) : null,
      billing_cycle: formData.billing_cycle,
      is_active: formData.is_active,
      is_public: formData.is_public,
    };

    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, ...planData });
    } else {
      createPlan.mutate(planData);
    }
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatLimit = (value: number | null) => {
    if (value === null) return "∞";
    return value.toString();
  };

  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planos de Assinatura</h1>
            <p className="text-muted-foreground">
              Gerencie os planos e preços baseados na hierarquia
            </p>
          </div>
          <Button className="btn-lime gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo Plano
          </Button>
        </div>

        {/* Pricing Model Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Modelo de Precificação Hierárquico</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Preço Final = Base + (Setores × Preço/Setor) + (Equipes × Preço/Equipe) + (Membros Ativos × Preço/Membro)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Planos Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum plano configurado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Limites</TableHead>
                    <TableHead>Preço Base</TableHead>
                    <TableHead>Por Setor</TableHead>
                    <TableHead>Por Equipe</TableHead>
                    <TableHead>Por Membro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs gap-1">
                            <FolderTree className="w-3 h-3" />
                            {formatLimit(plan.max_sectors_per_institution)}
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Users className="w-3 h-3" />
                            {formatLimit(plan.max_total_members)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(plan.base_price_cents)}
                        <span className="text-xs text-muted-foreground">/{plan.billing_cycle === "monthly" ? "mês" : "ano"}</span>
                      </TableCell>
                      <TableCell>{formatPrice(plan.price_per_sector_cents)}</TableCell>
                      <TableCell>{formatPrice(plan.price_per_team_cents)}</TableCell>
                      <TableCell>{formatPrice(plan.price_per_active_member_cents)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          {plan.is_public && (
                            <Badge variant="outline">Público</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deletePlan.mutate(plan.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
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

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen || !!editingPlan} onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingPlan(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano de Assinatura"}</DialogTitle>
              <DialogDescription>
                Configure limites e preços baseados na hierarquia organizacional
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome do Plano *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Básico, Profissional, Enterprise"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do plano..."
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Limites (vazio = ilimitado)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4" />
                      Setores/Instituição
                    </Label>
                    <Input
                      type="number"
                      value={formData.max_sectors_per_institution}
                      onChange={(e) => setFormData({ ...formData, max_sectors_per_institution: e.target.value })}
                      placeholder="∞"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Equipes/Setor
                    </Label>
                    <Input
                      type="number"
                      value={formData.max_teams_per_sector}
                      onChange={(e) => setFormData({ ...formData, max_teams_per_sector: e.target.value })}
                      placeholder="∞"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Total de Membros
                    </Label>
                    <Input
                      type="number"
                      value={formData.max_total_members}
                      onChange={(e) => setFormData({ ...formData, max_total_members: e.target.value })}
                      placeholder="∞"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Precificação (R$)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço Base/mês *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.base_price_cents}
                      onChange={(e) => setFormData({ ...formData, base_price_cents: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Por Setor Adicional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_per_sector_cents}
                      onChange={(e) => setFormData({ ...formData, price_per_sector_cents: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Por Equipe Adicional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_per_team_cents}
                      onChange={(e) => setFormData({ ...formData, price_per_team_cents: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Por Membro Ativo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_per_active_member_cents}
                      onChange={(e) => setFormData({ ...formData, price_per_active_member_cents: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Plano Ativo</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                  <Label>Visível Publicamente</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCreateDialogOpen(false);
                setEditingPlan(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button
                className="btn-lime"
                onClick={handleSubmit}
                disabled={!formData.name || isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPlan ? "Salvar" : "Criar Plano"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
