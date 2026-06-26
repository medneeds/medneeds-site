/**
 * Função auxiliar para fazer parse seguro de JSON de uma resposta HTTP
 * Verifica se a resposta é realmente JSON antes de fazer o parse
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  // Verificar Content-Type
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  // Ler o texto primeiro (só pode ser lido uma vez)
  const text = await response.text();
  
  // Se não for JSON, logar e tentar parse mesmo assim (pode ser que o Content-Type esteja errado)
  if (!isJson) {
    console.warn('[safeJsonParse] Resposta não é JSON. Content-Type:', contentType);
    console.warn('[safeJsonParse] Primeiros 200 caracteres da resposta:', text.substring(0, 200));
    
    // Tentar fazer parse mesmo assim (pode ser que o Content-Type esteja errado)
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      throw new Error(`Resposta não é JSON válido. Status: ${response.status}, Content-Type: ${contentType}`);
    }
  }
  
  // Se for JSON, fazer parse normalmente
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('[safeJsonParse] Erro ao fazer parse de JSON:', e);
    console.error('[safeJsonParse] Resposta recebida:', text.substring(0, 500));
    throw new Error(`Erro ao fazer parse de JSON: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
  }
}

