// ========== Auth ==========
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface AuthResponse {
  session: Session;
  user: User;
}

// ========== Enums (literal types) ==========
export type AppRole = "admin" | "gestor" | "user";
export type FinanceStatus = "received" | "pending" | "delayed" | "canceled";
export type PaymentType =
  | "pix"
  | "bank_transfer"
  | "cash"
  | "check"
  | "credit_card"
  | "debit_card"
  | "other";
export type ShiftStatus =
  | "draft"
  | "public"
  | "filled"
  | "canceled"
  | "completed";
export type ShiftCategory = "extra" | "regular" | "cover" | "scale_hole";
export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";
export type TransferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "canceled";
export type ScaleStatus = "draft" | "provisional" | "published";
export type AssignmentStatus = "draft" | "published" | "confirmed" | "declined";
export type EventStatus = "pending" | "received" | "canceled";
export type AnnouncementType = "info" | "warning" | "success" | "error";
export type SubscriptionStatus = "active" | "trial" | "canceled" | "expired";

// ========== Profile ==========
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string | null;
  specialty?: string | null;
  crm?: string | null;
  bio?: string | null;
  pix_key?: string | null;
  created_at: string;
  updated_at: string;
  profilePicture?: (string | null) | Media;
}

// ========== Groups & Memberships ==========
export interface Group {
  id: string;
  name: string;
  description?: string | null;
  created_by?: string;
  sector_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role?: string;
  created_at: string;
}

// ========== Institutions & Sectors ==========
export interface Institution {
  id: string;
  name: string;
  logo_url?: string | null;
  owner_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Sector {
  id: string;
  name: string;
  description?: string | null;
  institution_id: string;
  created_at: string;
  updated_at: string;
  institution?: Institution;
  groupCount?: number;
}

// ========== Scales ==========
export interface Scale {
  id: string;
  group_id: string;
  month: number;
  year: number;
  status: ScaleStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScaleSlot {
  id: string;
  scale_id: string;
  date: string;
  start_time: string;
  end_time: string;
  sector?: string | null;
  required_count?: number;
  created_at: string;
}

export interface ScaleAssignment {
  id: string;
  slot_id: string;
  user_id: string;
  status: AssignmentStatus;
  created_at: string;
}

export interface ScaleVersion {
  id: string;
  scale_id: string;
  version: number;
  version_data: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

// ========== Events ==========
export interface Event {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  color?: string | null;
  value?: number | null;
  status?: EventStatus;
  specialty?: string | null;
  scale_assignment_id?: string | null;
  all_day?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventTemplate {
  id: string;
  user_id: string;
  name: string;
  title: string;
  location?: string | null;
  value?: number | null;
  color?: string | null;
  default_start_time?: string | null;
  default_end_time?: string | null;
  default_all_day?: boolean;
  created_at: string;
  updated_at: string;
}

// ========== Finances ==========
export interface Finance {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  status: FinanceStatus;
  category?: string | null;
  payment_type?: PaymentType | null;
  due_date?: string | null;
  paid_date?: string | null;
  event_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ========== Shifts ==========
export interface Shift {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time: string;
  value?: number | null;
  status: ShiftStatus;
  category?: ShiftCategory;
  specialty?: string | null;
  creator_id: string;
  group_id?: string | null;
  source?: string;
  max_applications?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftApplication {
  id: string;
  shift_id: string;
  user_id: string;
  status: ApplicationStatus;
  message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftTransfer {
  id: string;
  shift_id?: string | null;
  from_user_id: string;
  to_user_id?: string | null;
  status: TransferStatus;
  reason?: string | null;
  proposed_date?: string | null;
  response_message?: string | null;
  created_at: string;
  updated_at: string;
}

// ========== Chats ==========
export interface Chat {
  id: string;
  name?: string | null;
  is_group?: boolean;
  sector_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
}

// ========== Notifications ==========
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
  priority?: string;
}

// ========== Admin ==========
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type?: AnnouncementType;
  active?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  max_institutions?: number | null;
  max_sectors_per_institution?: number | null;
  max_teams_per_sector?: number | null;
  max_members_per_team?: number | null;
  max_total_members?: number | null;
  price?: number | null;
  created_at: string;
  updated_at: string;
}

export interface InstitutionSubscription {
  id: string;
  institution_id: string;
  owner_user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  institution?: Institution;
  plan?: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

// ========== Comments ==========
export interface Comment {
  id: string;
  content: string;
  user_id: string;
  scale_id?: string | null;
  parent_id?: string | null;
  created_at: string;
}

// ========== Jobs ==========
export type JobVisibility =
  | "PUBLIC"
  | "UNLISTED"
  | "RESTRICTED_TO_GUESTS"
  | "RESTRICTED_TO_GROUPS"
  | "PRIVATE";
export type JobPaymentMethod = "AV" | "NR" | "AC";
export type JobApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Job {
  id: string;
  publisher?: string | Record<string, unknown>;
  modality?: string | Record<string, unknown>;
  clinicalArea?: string | Record<string, unknown>;
  place?: string;
  city?: string | Record<string, unknown>;
  startDateTime?: string;
  endDateTime?: string;
  durationInHours?: number;
  paymentMethod?: JobPaymentMethod;
  priceInCents?: number;
  description?: string;
  visibility?: JobVisibility;
  restrictedToGuests?: string[];
  restrictedToGroups?: string[];
  from?: string | Record<string, unknown>;
  to?: string | Record<string, unknown> | null;
  transferredAt?: string | null;
  status?: string;
  paidAt?: string | null;
  paidValue?: number | null;
  selectedApplication?: string | null;
  additionalDates?: Array<{ date: string }>;
  createdAt?: string;
  updatedAt?: string;
  parentRef?: string | null;
  singlePaymentForMutipleDates?: boolean;
}

export interface CreateJobData {
  modality: string;
  clinicalArea: string;
  place: string;
  city: string;
  startDateTime: string;
  durationInHours: number;
  paymentMethod: JobPaymentMethod;
  priceInCents?: number;
  description?: string;
  visibility: JobVisibility;
  restrictedToGuests?: string[];
  restrictedToGroups?: string[];
}

export interface JobApplication {
  id: string;
  job: string | Record<string, unknown>;
  publisher: string | Record<string, unknown>;
  applicant: string | Record<string, unknown>;
  status: JobApplicationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobTemplate {
  id: string;
  owner?: string | Record<string, unknown>;
  modality?: string | Record<string, unknown>;
  clinicalArea?: string | Record<string, unknown>;
  place?: string;
  city?: string | Record<string, unknown>;
  durationInHours?: number;
  paymentMethod?: JobPaymentMethod;
  priceInCents?: number;
  description?: string;
  visibility?: JobVisibility;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========== Contacts ==========
export interface ProfileConnection {
  id: string;
  from: string | Record<string, unknown>;
  relationship: string | Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// ========== Search ==========
export interface City {
  id: string;
  name: string;
  keys?: string;
  uf?: string;
}

export interface JobModality {
  id: string;
  name: string;
  slug?: string;
}

export interface ClinicalArea {
  id: string;
  name: string;
  slug?: string;
}

export interface ProfileGroup {
  id: string;
  name: string;
  owner?: string | Record<string, unknown>;
  members?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ========== Filters ==========
export interface CoreJobFilter {
  id: string;
  title: string;
  feeds?: Record<string, unknown>[];
  payments?: Record<string, unknown>[];
  transfers?: Record<string, unknown>[];
  [key: string]: unknown;
}

// ========== Upload ==========
export interface UploadResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Media {
  id: string;
  url: string;
  filename?: string;
  mimeType?: string;
  filesize?: number;
}

// ========== Generic ==========
export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page?: number;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
}
