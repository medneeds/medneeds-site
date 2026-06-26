import { useState, useEffect } from "react";
import { useScales, ScaleSlot } from "@/hooks/useScales";
import { DndScaleCalendar } from "./DndScaleCalendar";
import { WeeklyScaleView } from "./WeeklyScaleView";
import { ScaleStatsHeader } from "./ScaleStatsHeader";
import { HorizontalMembersBar } from "./HorizontalMembersBar";
import { SlotDialog } from "./SlotDialog";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { PublishDialog } from "./PublishDialog";
import { PublishScaleHolesDialog } from "./PublishScaleHolesDialog";
import { CreateScaleDialog } from "./CreateScaleDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addMonths, subMonths, addWeeks, subWeeks, startOfWeek } from "date-fns";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { DraggableMemberOverlay } from "./DraggableMember";
import type { GroupMember } from "@/hooks/useScales";
import type { ScaleViewMode } from "./ScaleViewToggle";
import {useGestorContext} from "@/contexts/gestor/useGestorContext.ts";

export function GestorEscalasContent() {
  const { selectedGroupId, selectedGroup, selectedMonth, setSelectedMonth } = useGestorContext();
  
  const {
    scale,
    slots,
    versions,
    members,
    latestVersion,
    daysInMonth,
    selectedMonth: hookMonth,
    setSelectedMonth: setHookMonth,
    isLoading,
    getSlotsForDay,
    saveSlot,
    removeSlot,
    assignMember,
    publishScale,
    changeStatus,
    publishScaleHoles,
    isSaving,
    isPublishing,
    isChangingStatus,
    isPublishingHoles,
  } = useScales(selectedGroupId || undefined);

  // Sync the context month with the hook month
  useEffect(() => {
    if (hookMonth.getTime() !== selectedMonth.getTime()) {
      setHookMonth(selectedMonth);
    }
  }, [selectedMonth, hookMonth, setHookMonth]);

  // Dialog states
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScaleSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishHolesDialogOpen, setPublishHolesDialogOpen] = useState(false);
  const [createScaleDialogOpen, setCreateScaleDialogOpen] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<ScaleViewMode>("month");
  const [selectedWeek, setSelectedWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));

  // DnD state
  const [activeMember, setActiveMember] = useState<GroupMember | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Selected day slots for sidebar
  const selectedDaySlots = selectedDate ? getSlotsForDay(selectedDate) : [];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddSlotForDay = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotDialogOpen(true);
  };

  const handleSlotClick = (slot: ScaleSlot) => {
    setSelectedSlot(slot);
    setSelectedDate(slot.date ? new Date(slot.date) : null);
    setSlotDialogOpen(true);
  };

  const handleSaveSlot = (slot: {
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
    sector?: string;
    notes?: string;
    maxDoctors?: number;
    initialAssignments?: string[];
  }) => {
    saveSlot(slot);
    setSlotDialogOpen(false);
  };

  const handleRemoveSlot = (slotId: string) => {
    removeSlot(slotId);
  };

  const handleAssignMember = (slotId: string, userId: string | null, assignmentId?: string) => {
    assignMember({ slotId, userId, assignmentId });
  };

  const handlePublish = (notes?: string) => {
    publishScale(notes);
    setPublishDialogOpen(false);
  };

  const handleChangeStatus = (status: "draft" | "provisional" | "published") => {
    if (status === "published") {
      setPublishDialogOpen(true);
    } else {
      changeStatus(status);
    }
  };

  const handlePublishHoles = (slotIds: string[]) => {
    publishScaleHoles(slotIds);
    setPublishHolesDialogOpen(false);
  };

  // Month navigation
  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  // Week navigation
  const handlePrevWeek = () => {
    setSelectedWeek(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    setSelectedWeek(addWeeks(selectedWeek, 1));
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ScaleViewMode) => {
    setViewMode(mode);
    if (mode === "week") {
      // Set week to include selected month
      setSelectedWeek(startOfWeek(selectedMonth, { weekStartsOn: 0 }));
    }
  };

  // Handler for editing slot from weekly view
  const handleEditSlotFromWeekly = (slot: ScaleSlot) => {
    setSelectedSlot(slot);
    setSelectedDate(slot.date ? new Date(slot.date) : null);
    setSlotDialogOpen(true);
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "member") {
      setActiveMember(active.data.current.member);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMember(null);

    if (!over) return;

    if (active.data.current?.type === "member" && over.data.current?.type === "slot") {
      const member = active.data.current.member as GroupMember;
      const slot = over.data.current.slot as ScaleSlot;
      handleAssignMember(slot.id, member.userId);
    }
  };

  // Create scale handlers
  const handleCreateFromPrevious = () => {
    setCreateScaleDialogOpen(false);
  };

  const handleCreateFromTemplate = () => {
    setCreateScaleDialogOpen(false);
  };

  const handleCreateEmpty = () => {
    setCreateScaleDialogOpen(false);
  };

  const vacantSlots = slots.filter((s) => !s.userId && (!s.assignments || s.assignments.length === 0));

  if (!selectedGroupId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma equipe</h2>
        <p className="text-muted-foreground">
          Escolha uma equipe no seletor acima para gerenciar suas escalas.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="flex-1 h-[calc(100vh-280px)] rounded-xl" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Stats header with status, navigation, and actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ScaleStatsHeader
            scale={scale}
            slots={slots}
            selectedMonth={selectedMonth}
            groupName={selectedGroup?.name}
            versionsCount={versions?.length || 0}
            isPublishing={isPublishing}
            isSaving={isSaving}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onPublish={() => setPublishDialogOpen(true)}
            onRevertToDraft={() => changeStatus("draft")}
            onShowVersions={() => setVersionHistoryOpen(true)}
            onPublishHoles={() => setPublishHolesDialogOpen(true)}
          />
        </motion.div>

        {/* Horizontal members bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <HorizontalMembersBar
            members={members || []}
            slots={slots}
          />
        </motion.div>

        {/* Calendar/Weekly view - expanded to fill remaining space */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-h-0"
        >
          <AnimatePresence mode="wait">
            {viewMode === "month" ? (
              <motion.div
                key="month-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <DndScaleCalendar
                  daysInMonth={daysInMonth}
                  selectedMonth={selectedMonth}
                  slots={slots}
                  members={members || []}
                  onDayClick={handleAddSlotForDay}
                  onSlotClick={handleSlotClick}
                  getSlotsForDay={getSlotsForDay}
                  onAssignMember={handleAssignMember}
                />
              </motion.div>
            ) : (
              <motion.div
                key="week-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <WeeklyScaleView
                  selectedMonth={selectedMonth}
                  selectedWeek={selectedWeek}
                  slots={slots}
                  members={members || []}
                  onSlotClick={handleSlotClick}
                  onAddSlot={handleAddSlotForDay}
                  onEditSlot={handleEditSlotFromWeekly}
                  onDeleteSlot={handleRemoveSlot}
                  onAssignMember={handleAssignMember}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeMember ? <DraggableMemberOverlay member={activeMember} /> : null}
      </DragOverlay>

      {/* Dialogs */}
      <CreateScaleDialog
        open={createScaleDialogOpen}
        onOpenChange={setCreateScaleDialogOpen}
        selectedMonth={selectedMonth}
        hasPreviousMonth={false}
        hasTeamTemplate={false}
        onCreateFromPrevious={handleCreateFromPrevious}
        onCreateFromTemplate={handleCreateFromTemplate}
        onCreateEmpty={handleCreateEmpty}
        isCreating={isSaving}
      />

      <SlotDialog
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        slot={selectedSlot}
        selectedDate={selectedDate}
        members={members || []}
        onSave={handleSaveSlot}
        onDelete={handleRemoveSlot}
        onAssignMember={handleAssignMember}
        isSaving={isSaving}
      />

      <VersionHistoryDialog
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        versions={versions || []}
      />

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        slots={slots}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />

      <PublishScaleHolesDialog
        open={publishHolesDialogOpen}
        onOpenChange={setPublishHolesDialogOpen}
        vacantSlots={vacantSlots}
        onPublish={handlePublishHoles}
        isPublishing={isPublishingHoles}
        groupName={selectedGroup?.name}
      />
    </DndContext>
  );
}
