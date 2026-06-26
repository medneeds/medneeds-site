import {JobTemplate} from '@/config/payload.types';
import {stringify} from 'qs-esm';
import type {Where} from 'payload';
import api from "@/lib/api.ts";

const BASE_URL = `/job-templates`;

type QueryOptions = {
  where?: Where;
  page: number;
  limit?: number;
}

class JobTemplateService {
  async getTemplates(options?: QueryOptions): Promise<{ docs: JobTemplate[], totalDocs: number, totalPages: number, hasNextPage: boolean }> {
    const where: Where = options?.where || {};
    
    const stringifiedQuery = stringify(
      {
        where,
        page: options?.page || 1,
        limit: options?.limit || 24,
        sort: '-createdAt',
      },
      { addQueryPrefix: true },
    )
    
    try {
      const response = await api.get(`${BASE_URL}${stringifiedQuery}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
      };
    }
  }

  async createTemplate(templateData: Partial<JobTemplate>): Promise<JobTemplate> {
    try {
      const response = await api.post(BASE_URL, templateData);
      return response.data.doc;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, templateData: Partial<JobTemplate>): Promise<JobTemplate> {
    try {
      const response = await api.patch(`${BASE_URL}/${id}`, templateData);
      return response.data.doc;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
}

export default JobTemplateService; 