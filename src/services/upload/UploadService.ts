import type { UploadResult, Media } from "@/types/api.types.ts";
import { STORAGE_KEYS } from "@/config/constants.ts";

export interface UploadOptions {
    onProgress?: (progress: number) => void;
    headers?: Record<string, string>;
}

/**
 * Serviço de upload de arquivos para o portal web.
 * Utiliza FormData nativo do browser e JWT para autenticação.
 * Baseado no mobile UploadService.ts
 */
export class UploadServiceClass<T = Media> {
    private baseUrl: string;
    private slug: string;

    /**
     * @param slug Slug do endpoint de upload (ex: 'message-media', 'media')
     * @param baseUrl URL base da API (opcional)
     */
    constructor(slug: string, baseUrl?: string) {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
        this.baseUrl = baseUrl || apiBaseUrl;

        // Garantir que a baseUrl não termina com barra
        if (this.baseUrl.endsWith("/")) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }

        // Evitar duplicação de '/api' no slug
        if (this.baseUrl.endsWith("/api") && slug.startsWith("api/")) {
            this.slug = slug.replace(/^api\//, "");
        } else {
            this.slug = slug;
        }
    }

    /**
     * Faz upload de arquivo usando FormData (browser nativo)
     */
    async upload(
        file: File | Blob | string,
        fileName?: string,
        fileType?: string,
        messageId?: string,
        options: UploadOptions = {}
    ): Promise<UploadResult<T>> {
        try {
            const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (!token) {
                return { success: false, error: "Usuário não autenticado" };
            }

            const formData = new FormData();

            // Incluir ID de mensagem se fornecido
            if (messageId) {
                formData.append("message", messageId);
            }

            // Anexar o arquivo
            if (typeof file === "string") {
                // Se for URI string, fetch para obter blob
                const response = await fetch(file);
                const blob = await response.blob();
                formData.append("file", blob, fileName || "file");
            } else if (file instanceof File) {
                formData.append("file", file);
            } else {
                formData.append("file", file, fileName || "file");
            }

            // URL completa: {baseUrl}/{slug}
            const uploadUrl = `${this.baseUrl}/${this.slug}`;

            const response = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...options.headers,
                },
            });

            if (response.ok) {
                const result = await response.json();
                // Mobile returns data inside .doc
                const data = (result?.doc ?? result) as T;
                return { success: true, data };
            } else {
                let errorMessage = "Erro ao fazer upload do arquivo";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    // keep default
                }
                return { success: false, error: `${errorMessage} (${response.status})` };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido durante o upload";
            console.error("[UploadService] Error:", message);
            return { success: false, error: message };
        }
    }

    /**
     * Determina o tipo MIME a partir da extensão do arquivo
     */
    getMimeTypeFromExtension(extension: string): string {
        const mimeTypes: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            svg: "image/svg+xml",
            pdf: "application/pdf",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ppt: "application/vnd.ms-powerpoint",
            pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            txt: "text/plain",
            mp3: "audio/mpeg",
            wav: "audio/wav",
            ogg: "audio/ogg",
            m4a: "audio/mp4",
            mp4: "video/mp4",
            webm: "video/webm",
            mov: "video/quicktime",
            avi: "video/x-msvideo",
            zip: "application/zip",
            json: "application/json",
            xml: "application/xml",
            csv: "text/csv",
        };
        return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
    }
}

/**
 * Cria um serviço de upload de mídia de mensagens
 */
export function createMessageMediaUploadService(): UploadServiceClass {
    return new UploadServiceClass("message-media");
}

/**
 * Cria um serviço de upload de mídia geral
 */
export function createMediaUploadService(): UploadServiceClass {
    return new UploadServiceClass("media");
}
