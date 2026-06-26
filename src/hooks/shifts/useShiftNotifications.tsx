interface ShiftNotification {
  type: "new_application" | "application_accepted" | "application_rejected";
  shiftTitle: string;
  applicantName: string;
  timestamp: Date;
}

// NOTE: Realtime subscriptions (Supabase channels) have been removed.
// This hook now provides a no-op placeholder.
// To restore realtime functionality, integrate WebSocket or SSE from the backend.
export function useShiftNotifications(
  onNotification?: (notification: ShiftNotification) => void,
) {
  // No-op: realtime notifications require WebSocket/SSE from the backend
  // Polling-based notifications are handled by useNotifications hook instead
}

export function useShiftApplicationsRealtime(shiftId: string | null) {
  // No-op: realtime subscriptions removed — use polling or WebSocket instead
}
