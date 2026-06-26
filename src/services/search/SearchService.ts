import api from "@/lib/api.ts";
import type {
  City,
  JobModality,
  Profile,
  ClinicalArea,
  ProfileGroup,
  PaginatedResponse,
} from "@/types/api.types.ts";
import { stringify } from "qs-esm";

export interface SearchQueryOptions {
  page?: number;
  limit?: number;
}

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas.
 */
function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Utilitário para formatar a query usando qs-esm e padrão payload
 */
function buildQueryString(
  endpoint: string,
  whereObj: any,
  options?: SearchQueryOptions,
  sort?: string,
) {
  const query = {
    where: Object.keys(whereObj).length > 0 ? whereObj : undefined,
    page: options?.page || 1,
    limit: options?.limit || 20,
    sort,
  };
  const stringified = stringify(query, { addQueryPrefix: true });
  return `${endpoint}${stringified}`;
}

export const searchService = {
  // -------- Cities --------
  async getCities(
    query: string,
    state?: string,
    options?: SearchQueryOptions,
  ): Promise<PaginatedResponse<City>> {
    try {
      const where: Record<string, unknown> = {};
      if (state) {
        where["keys"] = {
          equals: `${normalizeString(query)} ${normalizeString(state)}`,
        };
      } else if (query) {
        where["or"] = [
          { keys: { like: normalizeString(query) } },
          { name: { like: query } },
        ];
      }

      const url = buildQueryString("/cities", where, options, "keys");
      const { data } = await api.get<PaginatedResponse<City>>(url);
      return data;
    } catch (error) {
      console.error("[searchService] Error fetching cities:", error);
      return { docs: [], totalDocs: 0, totalPages: 0, hasNextPage: false };
    }
  },

  async getCitiesByIds(ids: string[]): Promise<City[]> {
    if (!ids.length) return [];
    try {
      const where = { id: { in: ids } };
      const limit = ids.length;
      const stringified = stringify({ where, limit }, { addQueryPrefix: true });
      const { data } = await api.get<PaginatedResponse<City>>(
        `/cities${stringified}`,
      );
      return data.docs || [];
    } catch (error) {
      console.error("[searchService] Error fetching cities by IDs:", error);
      return [];
    }
  },

  // -------- Modalities --------
  async getModalities(
    query?: string,
    options?: SearchQueryOptions,
  ): Promise<PaginatedResponse<JobModality>> {
    try {
      const where: Record<string, unknown> = {};
      if (query) {
        where["name"] = { like: normalizeString(query) };
      }

      const qsOptions = {
        ...options,
        limit: options?.limit || (query ? 20 : 100),
      };
      const url = buildQueryString("/job-modalities", where, qsOptions, "name");
      const { data } = await api.get<PaginatedResponse<JobModality>>(url);
      return data;
    } catch (error) {
      console.error("[searchService] Error fetching modalities:", error);
      return { docs: [], totalDocs: 0, totalPages: 0, hasNextPage: false };
    }
  },

  async getModalitiesByIds(ids: string[]): Promise<JobModality[]> {
    if (!ids.length) return [];
    try {
      const where = { id: { in: ids } };
      const limit = ids.length;
      const stringified = stringify({ where, limit }, { addQueryPrefix: true });
      const { data } = await api.get<PaginatedResponse<JobModality>>(
        `/job-modalities${stringified}`,
      );
      return data.docs || [];
    } catch (error) {
      console.error("[searchService] Error fetching modalities by IDs:", error);
      return [];
    }
  },

  // -------- Profiles --------
  async getProfiles(
    query?: string,
    options?: SearchQueryOptions,
  ): Promise<PaginatedResponse<Profile>> {
    try {
      const where: Record<string, unknown> = {};
      if (query) {
        where["or"] = [
          { name: { like: normalizeString(query) } },
          { email: { like: query } },
        ];
      }

      const url = buildQueryString("/profiles", where, options, "name");
      const { data } = await api.get<PaginatedResponse<Profile>>(url);
      return data;
    } catch (error) {
      console.error("[searchService] Error fetching profiles:", error);
      return { docs: [], totalDocs: 0, totalPages: 0, hasNextPage: false };
    }
  },

  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (!ids.length) return [];
    try {
      const where = { id: { in: ids } };
      const limit = ids.length;
      const stringified = stringify(
        { where, limit, depth: 1 },
        { addQueryPrefix: true },
      );
      const { data } = await api.get<PaginatedResponse<Profile>>(
        `/profiles${stringified}`,
      );
      return data.docs || [];
    } catch (error) {
      console.error("[searchService] Error fetching profiles by IDs:", error);
      return [];
    }
  },

  // -------- Profile Groups --------
  async getProfileGroups(
    query?: string,
    options?: SearchQueryOptions,
  ): Promise<PaginatedResponse<ProfileGroup>> {
    try {
      const where: Record<string, unknown> = {};
      if (query) {
        where["name"] = { like: normalizeString(query) };
      }

      const url = buildQueryString("/profile-groups", where, options, "name");
      const { data } = await api.get<PaginatedResponse<ProfileGroup>>(url);
      return data;
    } catch (error) {
      console.error("[searchService] Error fetching profile groups:", error);
      return { docs: [], totalDocs: 0, totalPages: 0, hasNextPage: false };
    }
  },

  async getProfileGroupsByIds(ids: string[]): Promise<ProfileGroup[]> {
    if (!ids.length) return [];
    try {
      const where = { id: { in: ids } };
      const limit = ids.length;
      const stringified = stringify(
        { where, limit, depth: 1 },
        { addQueryPrefix: true },
      );
      const { data } = await api.get<PaginatedResponse<ProfileGroup>>(
        `/profile-groups${stringified}`,
      );
      return data.docs || [];
    } catch (error) {
      console.error(
        "[searchService] Error fetching profile groups by IDs:",
        error,
      );
      return [];
    }
  },

  // -------- Clinical Areas --------
  async getClinicalAreas(
    query?: string,
    options?: SearchQueryOptions,
  ): Promise<PaginatedResponse<ClinicalArea>> {
    try {
      const where: Record<string, unknown> = {};
      if (query) {
        where["name"] = { like: normalizeString(query) };
      }

      const qsOptions = {
        ...options,
        limit: options?.limit || (query ? 20 : 100),
      };
      const url = buildQueryString("/clinical-areas", where, qsOptions, "name");
      const { data } = await api.get<PaginatedResponse<ClinicalArea>>(url);
      return data;
    } catch (error) {
      console.error("[searchService] Error fetching clinical areas:", error);
      return { docs: [], totalDocs: 0, totalPages: 0, hasNextPage: false };
    }
  },

  async getClinicalAreasByIds(ids: string[]): Promise<ClinicalArea[]> {
    if (!ids.length) return [];
    try {
      const where = { id: { in: ids } };
      const limit = ids.length;
      const stringified = stringify({ where, limit }, { addQueryPrefix: true });
      const { data } = await api.get<PaginatedResponse<ClinicalArea>>(
        `/clinical-areas${stringified}`,
      );
      return data.docs || [];
    } catch (error) {
      console.error(
        "[searchService] Error fetching clinical areas by IDs:",
        error,
      );
      return [];
    }
  },

  // -------- Google Places --------
  async searchPlaces(
    query: string,
    lat?: number,
    lon?: number,
  ): Promise<any[]> {
    try {
      const { data } = await api.get<any[]>("/search/places", {
        params: {
          q: query,
          lat,
          lon,
        },
      });
      return data;
    } catch (error) {
      console.error("[searchService] Error searching places:", error);
      return [];
    }
  },

  async getPlaceDetails(placeId: string): Promise<any | null> {
    try {
      const { data } = await api.get(`/search/places/${placeId}`);
      return data;
    } catch (error) {
      console.error("[searchService] Error getting place details:", error);
      return null;
    }
  },
};
