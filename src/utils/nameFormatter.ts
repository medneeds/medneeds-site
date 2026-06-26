/**
 * Utils de formatação de nomes de usuário
 * Contém funções para abreviar e formatar nomes de usuário em diferentes estilos
 */

/**
 * Obtém as iniciais de um nome (até 2 caracteres)
 * @param name Nome completo
 * @param maxChars Número máximo de caracteres (padrão: 2)
 * @returns Iniciais do nome
 */
export function getInitials(name: string, maxChars: number = 2): string {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  
  if (parts.length === 1) {
    // Se for apenas um nome, pega as primeiras letras
    return name.substring(0, maxChars).toUpperCase();
  }
  
  // Se tiver mais de um nome, pega a inicial do primeiro e do último
  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts[parts.length - 1].charAt(0);
  
  return (firstInitial + lastInitial).toUpperCase();
}

/**
 * Abrevia um nome para exibição em listas
 * Formato: Primeiro nome completo + conectivos + sobrenome
 * @param name Nome completo
 * @returns Nome abreviado
 */
export function abbreviateName(name: string): string {
  if (!name) return 'Usuário';
  
  const parts = name.trim().split(' ');
  
  // Se tiver apenas um nome ou dois, retorna o nome completo
  if (parts.length <= 2) return name;
  
  // Lista de conectivos, preposições e artigos que não devem ser abreviados
  const connectiveWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o'];
  
  // Se houver apenas 3 partes e a do meio for um conectivo, manter o nome completo
  if (parts.length === 3 && connectiveWords.includes(parts[1].toLowerCase())) {
    return name;
  }
  
  // Para nomes mais complexos
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  // Procura conectivos entre o primeiro e último nome
  const middleConnectives = [];
  
  // Verifica se há conectivos sequenciais no meio do nome
  // e adiciona todos os conectivos encontrados
  for (let i = 1; i < parts.length - 1; i++) {
    if (connectiveWords.includes(parts[i].toLowerCase())) {
      middleConnectives.push(parts[i]);
    } else if (middleConnectives.length > 0) {
      // Se encontramos um não-conectivo após conectivos, paramos a coleta
      break;
    }
  }
  
  // Se encontramos conectivos no meio, inclui-os na abreviação
  if (middleConnectives.length > 0) {
    return `${firstName} ${middleConnectives.join(' ')} ${lastName}`;
  }
  
  // Caso contrário, retorna primeiro + último nome
  return `${firstName} ${lastName}`;
}

/**
 * Formata um nome completo para exibição (estilo chat)
 * Primeiro nome completo, iniciais dos nomes do meio (exceto conectivos), último nome completo
 * @param name Nome completo
 * @returns Nome formatado
 */
export function formatFullName(name: string): string {
  if (!name) return 'Usuário';
  
  const parts = name.trim().split(' ');
  
  if (parts.length <= 2) return name; // Apenas um nome ou nome e sobrenome
  
  // Lista de conectivos, preposições e artigos que não devem ser abreviados
  const connectiveWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o'];
  
  // Para nomes com mais de duas partes
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleNames = parts.slice(1, parts.length - 1);
  
  // Transforma nomes do meio em iniciais, mas mantém conectivos completos
  const middleFormatted = middleNames.map(name => {
    // Se for um conectivo, retorna completo
    if (connectiveWords.includes(name.toLowerCase())) {
      return name;
    }
    // Caso contrário, retorna a inicial seguida de ponto
    return `${name.charAt(0)}.`;
  }).join(' ');
  
  return `${firstName} ${middleFormatted} ${lastName}`;
}

/**
 * Retorna apenas o primeiro nome
 * @param name Nome completo
 * @returns Primeiro nome
 */
export function getFirstName(name: string): string {
  if (!name) return 'Usuário';
  
  const parts = name.trim().split(' ');
  return parts[0];
}

/**
 * Formata um nome para exibição com base no contexto
 * @param name Nome completo
 * @param style Estilo de formatação
 * @returns Nome formatado de acordo com o estilo
 */
export function formatName(name: string, style: 'initials' | 'abbreviated' | 'full' | 'firstName' = 'abbreviated'): string {
  switch (style) {
    case 'initials':
      return getInitials(name);
    case 'full':
      return formatFullName(name);
    case 'firstName':
      return getFirstName(name);
    case 'abbreviated':
    default:
      return abbreviateName(name);
  }
} 