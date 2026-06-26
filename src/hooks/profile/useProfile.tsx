import { useState, useEffect, useCallback, useMemo } from "react";
import { profileService } from "@/services/profile/ProfileService.ts";
import type { Profile } from "@/types/api.types.ts";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

export function useProfile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await profileService.getProfile(user.id);
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const profileName = profile?.name || user?.name || "";

  const formattedName = useMemo(() => {
    if (!profileName) return "";
    return profileName
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }, [profileName]);

  const firstName = useMemo(() => {
    if (!profileName) return "";
    return profileName.split(" ")[0];
  }, [profileName]);

  const initials = useMemo(() => {
    if (!profileName) return "";
    const parts = profileName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }, [profileName]);

  const getAvatarUrl = useMemo(() => {
    if (profile && (profile as any).profilePicture) {
      const pic = (profile as any).profilePicture;
      if (typeof pic === "string") return pic;
      if (typeof pic === "object" && pic?.url) {
        let url = pic.url;
        if (url.includes("/api/api")) url = url.replace("/api/api", "/api");
        const apiBaseUrl =
          import.meta.env.VITE_APP_WEB_CLOUD_URL || "http://localhost:3000/api";
        const baseWithoutApi = apiBaseUrl.replace(/\/api$/, "");
        return url.startsWith("http") ? url : `${baseWithoutApi}${url}`;
      }
    }
    return undefined;
  }, [profile]);

  return {
    profile,
    loading,
    getProfile,
    formattedName,
    firstName,
    initials,
    getAvatarUrl,
  };
}
