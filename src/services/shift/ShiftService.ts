import api from "@/lib/api.ts";
import type {
  Shift,
  ShiftApplication,
  ShiftTransfer,
} from "@/types/api.types.ts";

export const shiftService = {
  // -------- Shifts --------
  async getShifts(params?: Record<string, unknown>): Promise<Shift[]> {
    const { data } = await api.get<Shift[]>("/shifts", { params });
    return data;
  },

  async getShiftById(shiftId: string): Promise<Shift> {
    const { data } = await api.get<Shift>(`/shifts/${shiftId}`);
    return data;
  },

  async createShift(payload: Partial<Shift>): Promise<Shift> {
    const { data } = await api.post<Shift>("/shifts", payload);
    return data;
  },

  async updateShift(shiftId: string, payload: Partial<Shift>): Promise<Shift> {
    const { data } = await api.put<Shift>(`/shifts/${shiftId}`, payload);
    return data;
  },

  async deleteShift(shiftId: string): Promise<void> {
    await api.delete(`/shifts/${shiftId}`);
  },

  async getRecentShifts(limit?: number): Promise<any[]> {
    const { data } = await api.get<any[]>("/shifts/recent", {
      params: { limit },
    });
    return data;
  },

  // -------- Applications --------
  async getApplications(shiftId: string): Promise<ShiftApplication[]> {
    const { data } = await api.get<ShiftApplication[]>(
      `/shifts/${shiftId}/applications`,
    );
    return data;
  },

  async getMyApplications(userId: string): Promise<ShiftApplication[]> {
    const { data } = await api.get<ShiftApplication[]>(
      "/shift-applications/user",
      { params: { user_id: userId } },
    );
    return data;
  },

  async createApplication(payload: {
    shift_id: string;
    user_id: string;
    message?: string;
  }): Promise<ShiftApplication> {
    const { data } = await api.post<ShiftApplication>(
      "/shift-applications",
      payload,
    );
    return data;
  },

  async updateApplicationStatus(
    applicationId: string,
    status: string,
  ): Promise<void> {
    await api.patch(`/shift-applications/${applicationId}/status`, { status });
  },

  async withdrawApplication(applicationId: string): Promise<void> {
    await api.delete(`/shift-applications/${applicationId}`);
  },

  // -------- Transfers --------
  async getTransfers(
    params?: Record<string, unknown>,
  ): Promise<ShiftTransfer[]> {
    const { data } = await api.get<ShiftTransfer[]>("/shift-transfers", {
      params,
    });
    return data;
  },

  async createTransfer(
    payload: Partial<ShiftTransfer>,
  ): Promise<ShiftTransfer> {
    const { data } = await api.post<ShiftTransfer>("/shift-transfers", payload);
    return data;
  },

  async updateTransferStatus(
    transferId: string,
    status: string,
    responseMessage?: string,
  ): Promise<void> {
    await api.patch(`/shift-transfers/${transferId}/status`, {
      status,
      response_message: responseMessage,
    });
  },

  async deleteTransfer(transferId: string): Promise<void> {
    await api.delete(`/shift-transfers/${transferId}`);
  },

  // -------- User Shifts for Transfer --------
  async getUserShifts(userId: string): Promise<any[]> {
    const { data } = await api.get<any[]>("/shifts/user", {
      params: { user_id: userId, upcoming: true },
    });
    return data;
  },

  // -------- Gestor Transfers --------
  async getGroupTransfers(groupIds: string[], status?: string): Promise<any[]> {
    // This logic is complex to fully replicate with simple CRUD endpoints efficiently.
    // Ideally, backend should have /shift-transfers?group_ids=...
    // We will assume we can filter by group_id on transfers endpoint or we implement the fetch logic here.

    // Option 1: Fetch all transfers and filter (inefficient if many transfers)
    // Option 2: Fetch shifts for groups, then transfers for shifts.

    // Let's try to fetch transfers with a specialized param if backend supports it, otherwise replicate logic.
    // Since we are migrating, let's replicate the logic from the component but using cleaner API calls.

    // 1. Get shifts for these groups
    // We need an endpoint to get shifts by multiple group IDs.
    // If not available, we have to loop?
    // Or maybe POST /shifts/search

    // For now, let's assume we can fetch transfers and include shift data, then filter.
    // Or fetching all transfers might be too much.

    // Let's implement the "Fetch shifts then transfers" logic.
    // We need to fetch shifts for all these groups.
    // api.get("/shifts", { params: { group_id: ... } }) only takes one ID usually.

    // We will fallback to a simplified approach:
    // If the backend has a 'gestor-transfers' endpoint, use it.
    // If not, we might need to keep some supabase logic? NO, objective is REMOVE Supabase.

    // We will iterate group IDs to fetch shifts (parallel), then fetch transfers for those shifts.
    // This is heavy but removes Supabase.

    const shiftsPromises = groupIds.map((gid) =>
      this.getShifts({ group_id: gid }),
    );
    const shiftsArrays = await Promise.all(shiftsPromises);
    const shifts = shiftsArrays.flat();

    if (shifts.length === 0) return [];

    const shiftIds = shifts.map((s) => s.id);

    // Now fetch transfers for these shifts.
    // We need to fetch transfers by shift_id.
    // If we can't filter by multiple shift_ids, we iterate? That's too many requests.
    // Maybe we just fetch ALL transfers? (Bad)

    // A better way: GET /shift-transfers with expanded resources.
    // If we can't filter by shift_id list, we are stuck.

    // HACK: For now, we will return empty array and comment that backend support is needed,
    // OR we use the "getTransfers" and hope it allows filtering or returns enough data to filter client side IF the volume is low.
    // The component logic used `in("shift_id", shiftIds)`.

    // Let's assume we can pass `shift_id` as array/comma-separated?
    // Or we use a new endpoint /shift-transfers/search

    // I will implement a placeholder that fetches all transfers (warning: inefficient) and filters client side,
    // just to unblock migration. The proper fix is a backend endpoint.

    const { data: allTransfers } =
      await api.get<ShiftTransfer[]>("/shift-transfers");

    // Filter by shift IDs
    const shiftIdSet = new Set(shiftIds);
    const relevantTransfers = allTransfers.filter((t) =>
      shiftIdSet.has(t.shift_id),
    );

    if (status && status !== "all") {
      return relevantTransfers.filter((t) => t.status === status);
    }

    return relevantTransfers;
  },
};
