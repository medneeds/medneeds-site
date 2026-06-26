import api from "@/lib/api.ts";
import type { Profile } from "@/types/api.types.ts";
import { useLoadingStore } from "@/hooks/ui/useLoadingStore.ts";

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const { startLoading, stopLoading } = useLoadingStore.getState();
    try {
      startLoading();
      const { data } = await api.get<Profile>(`/profiles/${userId}`);
      return data;
    } finally {
      stopLoading();
    }
  },

  async updateProfile(
    userId: string,
    payload: Partial<Profile>,
  ): Promise<Profile> {
    const { data } = await api.patch<Profile>(`/profiles/${userId}`, payload);
    return data;
  },

  async searchProfiles(
    query: string,
    excludeUserId?: string,
    limit = 10,
  ): Promise<Profile[]> {
    const where: Record<string, unknown> = {
      or: [{ name: { like: query } }, { email: { like: query } }],
    };
    if (excludeUserId) {
      where["id"] = { not_equals: excludeUserId };
    }
    const { data } = await api.get<{ docs: Profile[] }>("/profiles", {
      params: {
        where: JSON.stringify(where),
        limit,
      },
    });
    return data.docs || [];
  },

  async getProfilesByUserIds(userIds: string[]): Promise<Profile[]> {
    if (!userIds.length) return [];
    const where = JSON.stringify({ id: { in: userIds } });
    const { data } = await api.get<{ docs: Profile[] }>("/profiles", {
      params: { where, limit: userIds.length },
    });
    return data.docs || [];
  },
};
