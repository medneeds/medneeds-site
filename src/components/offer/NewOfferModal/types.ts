import { Job } from "@/config/types";

export type OfferPaymentMethod = "AV" | "NR" | "AC";
export type OfferVisibilityType = "PUBLIC" | "UNLISTED";

export interface NewOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  jobToEdit?: Job;
  institutionOptions?: { value: string; label: string }[];
}

export interface PlaceOption {
  placeId: string;
  name: string;
  address: string;
  cityId?: string;
  cityName?: string;
}
