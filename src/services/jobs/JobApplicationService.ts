import { stringify } from "qs-esm";
import api from "@/lib/api.ts";
import type {
  JobApplication,
  JobApplicationStatus,
  PaginatedResponse,
} from "@/types/api.types.ts";

export interface CreateJobApplicationData {
  job: string;
  publisher: string;
  applicant: string;
  status?: JobApplicationStatus;
}

export interface JobApplicationQueryOptions {
  where?: Record<string, unknown>;
  page?: number;
  limit?: number;
  sort?: string;
  depth?: number;
}

export const jobApplicationService = {
  async createJobApplication(
    data: CreateJobApplicationData,
  ): Promise<JobApplication> {
    const { data: result } = await api.post<{ doc: JobApplication }>(
      "/job-applications",
      data,
    );
    return result.doc;
  },

  async getJobApplications(
    options?: JobApplicationQueryOptions,
  ): Promise<PaginatedResponse<JobApplication>> {
    try {
      const queryParams = {
        where: options?.where || {},
        page: options?.page || 1,
        limit: options?.limit || 20,
        sort: options?.sort || "-createdAt",
        depth: options?.depth ?? 2,
      };

      const queryString = stringify(queryParams, { addQueryPrefix: true });

      const { data } = await api.get<PaginatedResponse<JobApplication>>(
        `/job-applications${queryString}`,
      );
      return data;
    } catch (error) {
      console.error(
        "[jobApplicationService] Error fetching applications:",
        error,
      );
      return { docs: [], totalDocs: 0, totalPages: 0, hasNextPage: false };
    }
  },

  async getJobApplication(id: string): Promise<JobApplication | undefined> {
    try {
      const { data } = await api.get<JobApplication>(`/job-applications/${id}`);
      return data;
    } catch (error: unknown) {
      if ((error as any).response?.status === 404) return undefined;
      throw error;
    }
  },

  async updateJobApplicationStatus(
    id: string,
    status: JobApplicationStatus,
  ): Promise<JobApplication> {
    const { data } = await api.patch<{ doc: JobApplication }>(
      `/job-applications/${id}`,
      { status },
    );
    return data.doc;
  },

  async hasUserAppliedForJob(jobId: string, userId: string): Promise<boolean> {
    try {
      const result = await api.get<PaginatedResponse<JobApplication>>(
        "/job-applications",
        {
          params: {
            where: {
              job: { equals: jobId },
              applicant: { equals: userId },
            },
            page: 1,
            limit: 1,
          },
        },
      );
      return result.data.docs.length > 0;
    } catch {
      return false;
    }
  },

  async cancelJobApplication(jobId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.getJobApplications({
        where: {
          job: { equals: jobId },
          applicant: { equals: userId },
        },
        page: 1,
        limit: 1,
      });
      if (result.docs.length === 0) return false;
      await api.delete(`/job-applications/${result.docs[0].id}`);
      return true;
    } catch {
      return false;
    }
  },

  async deleteJobApplication(id: string): Promise<boolean> {
    try {
      await api.delete(`/job-applications/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getUserJobApplication(
    jobId: string,
    userId: string,
  ): Promise<JobApplication | undefined> {
    try {
      const result = await this.getJobApplications({
        where: {
          job: { equals: jobId },
          applicant: { equals: userId },
        },
        page: 1,
        limit: 1,
      });
      return result.docs[0] || undefined;
    } catch {
      return undefined;
    }
  },

  async getApplicationsForJob(
    jobId: string,
  ): Promise<PaginatedResponse<JobApplication>> {
    return this.getJobApplications({
      where: { job: { equals: jobId } },
      page: 1,
      limit: 100,
    });
  },
};
