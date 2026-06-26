import { storageService } from "@/services/storage/StorageService";
import { Job } from "@/config/types";

/**
 * JobCacheService - Cache individual de jobs para carregamento rápido
 *
 * Este serviço complementa o AgendaCacheService focando em jobs individuais
 * para carregamento ultra-rápido da tela de detalhes (JobScreen)
 */

function getCacheKey(jobId: string): string {
  return `job:${jobId}:v1`;
}

export const JobCacheService = {
  /**
   * Salva um job no cache
   */
  async saveJob(job: Job): Promise<void> {
    try {
      const key = getCacheKey(job.id);
      await storageService.setJSON(key, {
        job,
        cachedAt: Date.now(),
      });
    } catch (error) {
      console.warn("[JobCache] Erro ao salvar job no cache:", error);
    }
  },

  /**
   * Busca um job do cache
   * Retorna null se não existir ou se estiver muito antigo (>24h)
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const key = getCacheKey(jobId);
      const cached = await storageService.getJSON<{
        job: Job;
        cachedAt: number;
      }>(key);

      // Verificação mais robusta para evitar erro de propriedade undefined
      if (
        !cached ||
        !cached.data ||
        !cached.data.job ||
        typeof cached.data.cachedAt !== "number"
      ) {
        return null;
      }

      // Verificar se o cache não está muito antigo (24 horas)
      const ageInHours = (Date.now() - cached.data.cachedAt) / (1000 * 60 * 60);
      if (ageInHours > 24) {
        // Cache muito antigo, remover
        await this.removeJob(jobId);
        return null;
      }

      return cached.data.job;
    } catch (error) {
      console.warn("[JobCache] Erro ao buscar job do cache:", error);
      return null;
    }
  },

  /**
   * Remove um job do cache
   */
  async removeJob(jobId: string): Promise<void> {
    try {
      const key = getCacheKey(jobId);
      await storageService.remove(key);
    } catch (error) {
      console.warn("[JobCache] Erro ao remover job do cache:", error);
    }
  },

  /**
   * Atualiza campos específicos de um job no cache
   */
  async updateJobFields(jobId: string, updates: Partial<Job>): Promise<void> {
    try {
      const cached = await this.getJob(jobId);
      if (!cached) return;

      const updatedJob = { ...cached, ...updates };
      await this.saveJob(updatedJob);
    } catch (error) {
      console.warn("[JobCache] Erro ao atualizar job no cache:", error);
    }
  },
};
