import { Job } from "@/config/types";
import { stringify } from 'qs-esm'
import type { Where } from 'payload'
import api from '@/lib/api';

const BASE_URL = '/jobs'

type QueryOptions = {
  where?: Where;
  page: number;
  limit?: number;
  sort?: string;
}

type CreateJobData = {
  modality: string;
  clinicalArea: string;
  place: string; // This should be the place_id from Google Places
  city: string;
  startDateTime: string;
  durationInHours: number;
  paymentMethod: 'AV' | 'NR' | 'AC';
  priceInCents?: number;
  description?: string;
  visibility: 'PUBLIC' | 'UNLISTED' | 'RESTRICTED_TO_GUESTS' | 'RESTRICTED_TO_GROUPS' | 'PRIVATE';
  restrictedToGuests?: string[];
  restrictedToGroups?: string[];
}

export default class JobService {

  async getJob(id: string): Promise<Job | undefined> {
    try {
      const response = await api.get<Job>(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async getJobs(options?: QueryOptions): Promise<{ docs: Job[], totalDocs: number, totalPages: number, hasNextPage: boolean }> {
    const where: Where = options?.where || {};

    const stringifiedQuery = stringify(
      {
        where,
        page: options?.page || 1,
        limit: options?.limit || 24,
        sort: options?.sort || '-startDateTime',
      },
      { addQueryPrefix: true },
    )

    try {
      const response = await api.get(`${BASE_URL}${stringifiedQuery}`);
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const isServerError = [502, 503, 504].includes(status);

      if (isServerError) {
        console.warn(`[JobService] Erro temporário do servidor ao buscar jobs: ${status}`);
      } else if (error.code === 'ERR_NETWORK') {
        console.warn('[JobService] Erro de rede ao buscar jobs - usando cache se disponível');
      } else {
        console.error('[JobService] Erro ao buscar jobs:', error);
      }

      return {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
      };
    }
  }

  async createJob(data: CreateJobData): Promise<Job> {
    try {
      const response = await api.post(BASE_URL, data);
      return response.data.doc;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    try {
      const response = await api.patch(`${BASE_URL}/${id}`, data);
      return response.data.doc;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  async deleteJob(id: string): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/${id}`, { timeout: 30000 });
    } catch (error: any) {
      console.error('Error deleting job:', error);

      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: A requisição demorou muito para responder. Verifique sua conexão.');
      }

      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network request failed: Sem conexão com o servidor. Verifique sua internet.');
      }

      throw error;
    }
  }

  async transferJob(jobId: string, applicationId: string) {
    try {
      const response = await api.post(`${BASE_URL}/${jobId}/transfer`, {
        application: applicationId
      });
      return response.data;
    } catch (error) {
      console.error('Error transferring job:', error);
      throw error;
    }
  }
}