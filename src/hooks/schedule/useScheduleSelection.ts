import { useState, useCallback } from 'react';
import { JobAgendaCardItem } from '@/services/jobs/utils/formatJob.ts';

export const useScheduleSelection = (jobs: JobAgendaCardItem[]) => {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const toggleSelectionMode = useCallback(() => {
        if (selectionMode) {
            setSelectionMode(false);
            setSelectedItems(new Set());
        } else {
            setSelectionMode(true);
            setSelectedItems(new Set(jobs.map((j) => j.originalJobId)));
        }
    }, [selectionMode, jobs]);

    const toggleItemSelection = useCallback((id: string) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const onLongPressItem = useCallback(
        (id: string) => {
            if (!selectionMode) {
                setSelectionMode(true);
                setSelectedItems(new Set([id]));
            } else {
                toggleItemSelection(id);
            }
        },
        [selectionMode, toggleItemSelection]
    );

    return {
        selectionMode,
        selectedItems,
        toggleSelectionMode,
        toggleItemSelection,
        onLongPressItem,
        setSelectionMode,
        setSelectedItems,
    };
};
