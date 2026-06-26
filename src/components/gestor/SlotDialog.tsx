import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, User, X, Plus, Users, UserPlus } from "lucide-react";
import type { ScaleSlot, GroupMember } from "@/hooks/useScales";

interface SlotSaveData {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  sector?: string;
  notes?: string;
  maxDoctors?: number;
  initialAssignments?: string[]; // User IDs to assign when creating
}

interface SlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: ScaleSlot | null;
  selectedDate: Date | null;
  members: GroupMember[];
  onSave: (slot: SlotSaveData) => void;
  onDelete?: (slotId: string) => void;
  onAssignMember?: (slotId: string, userId: string | null, assignmentId?: string) => void;
  isSaving?: boolean;
}

export function SlotDialog({
  open,
  onOpenChange,
  slot,
  selectedDate,
  members,
  onSave,
  onDelete,
  onAssignMember,
  isSaving,
}: SlotDialogProps) {
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("19:00");
  const [sector, setSector] = useState("");
  const [notes, setNotes] = useState("");
  const [maxDoctors, setMaxDoctors] = useState<number>(1);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("none");
  const [pendingAssignments, setPendingAssignments] = useState<string[]>([]); // For new slots

  const isEditing = !!slot?.id;
  const assignments = slot?.assignments || [];

  // Get members not yet assigned to this slot
  const availableMembers = members.filter(
    m => !assignments.some(a => a.userId === m.userId) && !pendingAssignments.includes(m.userId)
  );

  // Get pending member info
  const pendingMembersInfo = pendingAssignments.map(userId => 
    members.find(m => m.userId === userId)
  ).filter(Boolean);

  useEffect(() => {
    if (slot) {
      setStartTime(slot.startTime || "07:00");
      setEndTime(slot.endTime || "19:00");
      setSector(slot.sector || "");
      setNotes(slot.notes || "");
      setMaxDoctors(slot.maxDoctors || 1);
    } else {
      setStartTime("07:00");
      setEndTime("19:00");
      setSector("");
      setNotes("");
      setMaxDoctors(1);
      setPendingAssignments([]);
    }
    setSelectedUserToAdd("none");
  }, [slot, open]);

  const handleSave = () => {
    const dateStr = selectedDate
      ? format(selectedDate, "yyyy-MM-dd")
      : slot?.date || "";

    onSave({
      id: slot?.id,
      date: dateStr,
      startTime,
      endTime,
      sector: sector || undefined,
      notes: notes || undefined,
      maxDoctors,
      initialAssignments: !isEditing ? pendingAssignments : undefined,
    });
  };

  const handleDelete = () => {
    if (slot?.id && onDelete) {
      onDelete(slot.id);
      onOpenChange(false);
    }
  };

  const handleAddDoctor = () => {
    if (selectedUserToAdd && selectedUserToAdd !== "none") {
      if (isEditing && slot?.id && onAssignMember) {
        onAssignMember(slot.id, selectedUserToAdd);
      } else {
        setPendingAssignments(prev => [...prev, selectedUserToAdd]);
      }
      setSelectedUserToAdd("none");
    }
  };

  const handleRemoveDoctor = (assignmentIdOrUserId: string, isAssignment: boolean = true) => {
    if (isEditing && slot?.id && onAssignMember) {
      onAssignMember(slot.id, null, assignmentIdOrUserId);
    } else {
      // Remove from pending (userId)
      setPendingAssignments(prev => prev.filter(id => id !== assignmentIdOrUserId));
    }
  };

  const displayDate = selectedDate || (slot?.date ? new Date(slot.date) : null);
  const totalAssigned = assignments.length + pendingAssignments.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Plantão" : "Novo Plantão"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date display */}
          {displayDate && (
            <div className="text-center p-2 bg-secondary/50 rounded-lg">
              <p className="font-semibold">
                {format(displayDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          )}

          {/* Time range and vacancies */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime" className="text-xs">Início</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime" className="text-xs">Término</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxDoctors" className="text-xs">Vagas</Label>
              <Input
                id="maxDoctors"
                type="number"
                min={1}
                max={99}
                value={maxDoctors}
                onChange={(e) => setMaxDoctors(parseInt(e.target.value) || 1)}
                className="h-9"
              />
            </div>
          </div>

          {/* Sector */}
          <div className="space-y-1.5">
            <Label htmlFor="sector" className="text-xs">Setor (opcional)</Label>
            <Input
              id="sector"
              placeholder="Ex: UTI, Emergência, PS..."
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Doctors section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              Médicos ({totalAssigned}/{maxDoctors} vagas)
            </Label>

            {/* Existing assignments (editing mode) */}
            {isEditing && assignments.length > 0 && (
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {assignments.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="flex items-center justify-between p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={assignment.userAvatar} />
                        <AvatarFallback className="text-[10px] bg-emerald-200 dark:bg-emerald-700">
                          {(assignment.userName || "M").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{assignment.userName || "Médico"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveDoctor(assignment.id, true)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending assignments (new slot mode) */}
            {!isEditing && pendingMembersInfo.length > 0 && (
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {pendingMembersInfo.map((member) => member && (
                  <div 
                    key={member.userId}
                    className="flex items-center justify-between p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback className="text-[10px] bg-emerald-200 dark:bg-emerald-700">
                          {member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{member.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveDoctor(member.userId, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {totalAssigned === 0 && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-center text-xs text-muted-foreground">
                <User className="h-4 w-4 mx-auto mb-0.5 opacity-50" />
                Nenhum médico atribuído (vago)
              </div>
            )}

            {/* Add doctor selector */}
            {availableMembers.length > 0 && (
              <div className="flex gap-2">
                <Select
                  value={selectedUserToAdd}
                  onValueChange={setSelectedUserToAdd}
                >
                  <SelectTrigger className="flex-1 h-9 text-xs">
                    <SelectValue placeholder="Adicionar médico..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Selecione...</span>
                    </SelectItem>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback className="text-[9px]">
                              {member.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{member.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddDoctor}
                  disabled={selectedUserToAdd === "none"}
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Observações (opcional)</Label>
            <Input
              id="notes"
              placeholder="Observações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="sm:mr-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Excluir
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="btn-lime">
            {isSaving ? "Salvando..." : isEditing ? "Salvar" : "Criar Plantão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
