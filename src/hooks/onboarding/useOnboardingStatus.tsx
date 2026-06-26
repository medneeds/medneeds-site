import { useMemo } from "react";
import {useAuthContext} from "@/contexts/auth/useAuthContext.ts";

/**
 * Web-adapted version of the mobile useOnboardingStatus hook.
 * Checks if the user profile is complete (avatar + phone).
 * No cache — reads directly from the auth user.
 */
export function useOnboardingStatus() {
    const { user } = useAuthContext();

    const hasProfilePicture = useMemo(() => {
        if (!user) return false;
        // Portal Profile uses avatar_url
        return Boolean((user as any).avatar_url || (user as any).profilePicture);
    }, [user]);

    const hasPhone = useMemo(() => {
        if (!user) return false;
        const phone =
            (user as any).phone ||
            (user as any).whatsappNumber ||
            (user as any).phoneNumber;
        return Boolean(phone && String(phone).trim());
    }, [user]);

    const needsOnboarding = useMemo(() => {
        if (!user) return false;
        return !hasProfilePicture || !hasPhone;
    }, [user, hasProfilePicture, hasPhone]);

    const missingFields = useMemo(() => {
        const fields: string[] = [];
        if (!hasProfilePicture) fields.push("profilePicture");
        if (!hasPhone) fields.push("phone");
        return fields;
    }, [hasProfilePicture, hasPhone]);

    return {
        needsOnboarding,
        hasProfilePicture,
        hasPhone,
        missingFields,
    };
}
