import type { Job } from "@/config/types.ts";
import type { JobModality, ClinicalArea } from "@/types/api.types.ts";

export type PaymentMethod = "AV" | "NR" | "AC";

export interface NewJobModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialDate?: Date;
    jobToEdit?: Job;
}

export interface PlaceOption {
    placeId: string;
    name: string;
    address: string;
    cityId?: string;
    cityName?: string;
}

export interface SearchableSelectorItem {
    id: string;
    name: string;
}
