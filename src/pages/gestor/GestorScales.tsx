import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { useScales, useGroupInfo, ScaleSlot } from "@/hooks/useScales";
import { useScaleConfirmations } from "@/hooks/scale/useScaleConfirmations.tsx";
import { DndScaleCalendar } from "@/components/gestor/DndScaleCalendar.tsx";
import { ScaleHeader } from "@/components/gestor/ScaleHeader";
import { ScaleStatusBar } from "@/components/gestor/ScaleStatusBar";
import { SlotDialog } from "@/components/gestor/SlotDialog.tsx";
import { VersionHistoryDialog } from "@/components/gestor/VersionHistoryDialog.tsx";
import { PublishDialog } from "@/components/gestor/PublishDialog.tsx";
import { PublishScaleHolesDialog } from "@/components/gestor/PublishScaleHolesDialog.tsx";
import { ConfirmationsPanel } from "@/components/gestor/ConfirmationsPanel.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, AlertCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function GestorScales() {
  const { groupId } = useParams<{ groupId: string }>();
  const {
    scale,
    slots,
    versions,
    members,
    latestVersion,
    daysInMonth,
    selectedMonth,
    setSelectedMonth,
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
  } = useScales(groupId);

  const { data: groupInfo, isLoading: isLoadingGroup } = useGroupInfo(groupId);
  const { data: confirmationsSummary, isLoading: isLoadingConfirmations } = useScaleConfirmations(scale?.id);
  // Dialog states
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScaleSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishHolesDialogOpen, setPublishHolesDialogOpen] = useState(false);

  const handleDayClick = (date: Date) => {
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
  }) => {
    saveSlot(slot);
    setSlotDialogOpen(false);
  };

  const handleRemoveSlot = (slotId: string) => {
    removeSlot(slotId);
  };

  const handleAssignMember = (slotId: string, userId: string | null) => {
    assignMember({ slotId, userId });
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

  const vacantSlots = slots.filter((s) => !s.userId);

  if (!groupId) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Grupo não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Selecione um grupo para gerenciar suas escalas.
            </p>
            <Button asChild>
              <Link to="/grupos">Ver Grupos</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading || isLoadingGroup) {
    return (
      <MainLayout>
        <div className="page-container">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Skeleton className="h-[600px] w-full" />
              </div>
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/gestor/${groupId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao painel
            </Link>
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ScaleHeader
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            scale={scale}
            latestVersion={latestVersion}
            isPublishing={isPublishing}
            onPublish={() => setPublishDialogOpen(true)}
            onShowVersions={() => setVersionHistoryOpen(true)}
            groupName={groupInfo?.name}
          />
        </motion.div>

        {/* Status bar with workflow actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <ScaleStatusBar
            scale={scale}
            slots={slots}
            onChangeStatus={handleChangeStatus}
            isUpdating={isChangingStatus}
          />

          {/* Publish holes button when there are vacancies */}
          {vacantSlots.length > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {vacantSlots.length} {vacantSlots.length !== 1 ? "plantões" : "plantão"} sem médico atribuído
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Publique como ofertas para que médicos do grupo possam se candidatar.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
                  onClick={() => setPublishHolesDialogOpen(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Publicar Furos
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Main content with DnD and Confirmations Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid lg:grid-cols-4 gap-6"
        >
          {/* Calendar */}
          <div className="lg:col-span-3">
            <DndScaleCalendar
              daysInMonth={daysInMonth}
              selectedMonth={selectedMonth}
              slots={slots}
              members={members || []}
              onDayClick={handleDayClick}
              onSlotClick={handleSlotClick}
              getSlotsForDay={getSlotsForDay}
              onAssignMember={handleAssignMember}
            />
          </div>

          {/* Confirmations Panel - visible when scale is provisional or published */}
          {(scale?.status === "provisional" || scale?.status === "published") && (
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ConfirmationsPanel 
                  summary={confirmationsSummary || { total: 0, confirmed: 0, declined: 0, pending: 0, confirmations: [] }} 
                  isLoading={isLoadingConfirmations} 
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Dialogs */}
        <SlotDialog
          open={slotDialogOpen}
          onOpenChange={setSlotDialogOpen}
          slot={selectedSlot}
          selectedDate={selectedDate}
          members={members || []}
          onSave={handleSaveSlot}
          onDelete={handleRemoveSlot}
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
          groupName={groupInfo?.name}
        />
      </div>
    </MainLayout>
  );
}
