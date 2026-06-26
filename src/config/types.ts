import type {
  User as PayloadUser,
  Profile as PayloadProfile,
  Job as PayloadJob,
  JobApplication as _PayloadJobApplication,
  ProfileConnection as PayloadProfileConnection,
  ProfileGroup as PayloadProfileGroup,
  ConnectionRequest as PayloadConnectionRequest,
  City as PayloadCity,
  Place as PayloadPlace,
  ClinicalArea as PayloadClinicalArea,
  JobModality as PayloadJobModality,
  JobCategory as PayloadJobCategory,
  Media as PayloadMedia,
  Notification as PayloadNotification,
} from './payload.types'

/**
 * Tipos garantidos pelo repositório
 * Remove as opções de string dos campos relacionais
 */

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users".
 */
export interface User extends Omit<PayloadUser, ''> {
  _base?: never
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "media".
 */
export interface Media extends Omit<PayloadMedia, ''> {
  _base?: never
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "profiles".
 */
export interface Profile extends Omit<PayloadProfile, ''> {
  _base?: never
  avatarUrl?: string
  accountType?: 'personal' | 'institutional'
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "cities".
 */
export interface City extends Omit<PayloadCity, ''> {
  _base?: never
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "places".
 */
export interface Place extends Omit<PayloadPlace, ''> {
  _base?: never
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "clinical-areas".
 */
export interface ClinicalArea extends Omit<PayloadClinicalArea, ''> {
  _base?: never
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "profile-connections".
 */
export interface ProfileConnection extends Omit<PayloadProfileConnection, 'from' | 'to' | 'groups'> {
  from: Profile
  to: Profile
  groups?: ProfileGroup[] | null
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "profile-groups".
 */
export interface ProfileGroup extends Omit<PayloadProfileGroup, 'owner' | 'members'> {
  owner: Profile
  members: Profile[]
}

export interface Notification extends Omit<PayloadNotification, 'to'> {
  to: Profile
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "connection-requests".
 */
export interface ConnectionRequest extends Omit<PayloadConnectionRequest, 'from' | 'to'> {
  from: Profile
  to: Profile
}


/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "jobs".
 */
export interface Job extends Omit<PayloadJob, 'from' | 'to' | 'place' | 'city' | 'restrictedToGuests' | 'restrictedToGroups' | 'clinicalArea' | 'modality'> {
  from: Profile
  to?: Profile | null
  place?: Place | null
  previewImage?: Media | string | null
  city: City
  restrictedToGuests?: Profile[] | null
  restrictedToGroups?: ProfileGroup[] | null
  clinicalArea: ClinicalArea
  modality: JobModality
  status?: string
  selectedApplication?: string | null
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "job-modalities".
 */
export interface JobModality extends Omit<PayloadJobModality, ''> {
  _base?: never
}


/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "job-categories".
 */
export interface JobCategory extends Omit<PayloadJobCategory, ''> {
  _base?: never
}

