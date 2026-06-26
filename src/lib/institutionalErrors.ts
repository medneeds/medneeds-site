/**
 * Mapeamento centralizado de erros do backend institucional para mensagens amigáveis.
 * Usado em todas as páginas do modo institution.
 */

export interface InstitutionalErrorInfo {
  title: string;
  description?: string;
  /** Se true, o erro é de acesso/permissão — exibir estado de bloqueio na UI */
  isAccessError?: boolean;
}

const ERROR_MAP: Record<string, InstitutionalErrorInfo> = {
  // ─── Autenticação ─────────────────────────────────────────────────────────
  UNAUTHORIZED: {
    title: 'Sessão expirada',
    description: 'Faça login novamente para continuar.',
    isAccessError: true,
  },

  // ─── Contexto / escopo institucional ──────────────────────────────────────
  INSTITUTIONAL_CONTEXT_REQUIRED: {
    title: 'Contexto institucional necessário',
    description: 'Você precisa de um vínculo ativo com uma instituição para acessar este recurso.',
    isAccessError: true,
  },
  INSTITUTION_FILTER_NOT_ALLOWED: {
    title: 'Acesso negado a esta instituição',
    description: 'Você não tem permissão para visualizar os dados desta instituição.',
    isAccessError: true,
  },

  // ─── Permissão de operação ─────────────────────────────────────────────────
  FORBIDDEN: {
    title: 'Sem permissão para esta ação',
    description: 'Você não tem as permissões necessárias para executar esta operação. Consulte o administrador da instituição.',
    isAccessError: true,
  },
  FORBIDDEN_INSTITUTION_SCOPE: {
    title: 'Operação fora do escopo',
    description: 'A operação não pode ser realizada porque a instituição não faz parte do seu contexto.',
    isAccessError: true,
  },
  FORBIDDEN_ROLE_ESCALATION: {
    title: 'Escalada de cargo não permitida',
    description: 'Você não tem autorização para convidar usuários para o cargo institucional (admin). Apenas o administrador pode realizar esta ação.',
    isAccessError: true,
  },

  // ─── Recursos não encontrados ─────────────────────────────────────────────
  INSTITUTION_NOT_FOUND: {
    title: 'Instituição não encontrada',
    description: 'A instituição solicitada não existe ou não está acessível.',
  },
  MEMBER_NOT_FOUND: {
    title: 'Membro não encontrado',
    description: 'O membro informado não foi localizado.',
  },
  INVITE_NOT_FOUND: {
    title: 'Convite não encontrado',
    description: 'O convite não existe ou já foi removido.',
  },
  MEMBER_WITHOUT_INSTITUTION: {
    title: 'Membro sem instituição',
    description: 'O membro não está vinculado a nenhuma instituição.',
  },

  // ─── Conflitos ────────────────────────────────────────────────────────────
  EMAIL_ALREADY_MEMBER: {
    title: 'E-mail já é membro',
    description: 'Este e-mail já está vinculado a um membro ativo desta instituição.',
  },
  CPF_ALREADY_MEMBER: {
    title: 'CPF já é membro',
    description: 'Este CPF já está vinculado a um membro ativo desta instituição.',
  },
  INVITE_ALREADY_USED: {
    title: 'Convite já utilizado',
    description: 'Este convite já foi aceito e não pode ser alterado.',
  },

  // ─── Validação ────────────────────────────────────────────────────────────
  MISSING_REQUIRED_FIELDS: {
    title: 'Campos obrigatórios faltando',
    description: 'Preencha todos os campos obrigatórios antes de continuar.',
  },
  MISSING_MEMBER_ID: {
    title: 'Membro não especificado',
    description: 'O identificador do membro é obrigatório.',
  },
  MISSING_INSTITUTION: {
    title: 'Instituição não especificada',
    description: 'Selecione uma instituição para continuar.',
  },
  MISSING_ID: {
    title: 'Identificador ausente',
    description: 'O ID do recurso não foi informado.',
  },
  MISSING_ROLE: {
    title: 'Cargo não especificado',
    description: 'Selecione um cargo para continuar.',
  },
  INVALID_ROLE: {
    title: 'Cargo inválido',
    description: 'O cargo informado não é reconhecido pelo sistema.',
  },
  INSTITUTION_NOT_ALLOWED: {
    title: 'Instituição não permitida',
    description: 'Você não tem acesso a esta instituição.',
  },

  // ─── Convite — adesão ────────────────────────────────────────────────────
  PROFILE_AUTH_REQUIRED: {
    title: 'Autenticação necessária',
    description: 'Faça login com seu perfil para continuar.',
    isAccessError: true,
  },
  INVITE_NOT_PENDING: {
    title: 'Convite indisponível',
    description: 'Este convite não está mais em aberto (já foi utilizado ou cancelado).',
  },
  INVITE_EXPIRED: {
    title: 'Convite expirado',
    description: 'O prazo deste convite expirou. Solicite um novo convite à instituição.',
  },
  INVALID_TOKEN: {
    title: 'Token inválido',
    description: 'O token informado está incorreto. Verifique e tente novamente.',
  },
  INVITE_INSTITUTION_MISSING: {
    title: 'Instituição do convite ausente',
    description: 'O convite não está associado a uma instituição válida.',
  },
  INVITE_MISMATCH: {
    title: 'Convite não corresponde',
    description: 'Os dados informados não correspondem ao convite. Verifique o CPF e o token.',
  },
  PROFILE_CPF_MISMATCH: {
    title: 'CPF não corresponde',
    description: 'O CPF informado não corresponde ao CPF do seu perfil cadastrado.',
  },
  PROFILE_EMAIL_MISMATCH: {
    title: 'E-mail não corresponde',
    description: 'O e-mail do seu perfil não corresponde ao e-mail do convite.',
  },
  PROFILE_NAME_MISSING: {
    title: 'Nome do perfil ausente',
    description: 'Seu perfil precisa ter um nome cadastrado para aceitar o convite.',
  },

  // ─── Agenda / jobs ────────────────────────────────────────────────────────
  PROFILE_REQUIRED_FOR_MEDICAL_VIEW: {
    title: 'Perfil médico necessário',
    description: 'Para visualizar sua agenda pessoal, é necessário ter um perfil médico vinculado.',
  },
};

/**
 * Retorna a mensagem de erro para um código do backend.
 * Aceita o código direto ou o objeto de resposta de erro.
 */
export function getInstitutionalError(
  errorCode: string | undefined | null,
  fallback?: Partial<InstitutionalErrorInfo>,
): InstitutionalErrorInfo {
  if (errorCode && ERROR_MAP[errorCode]) {
    return ERROR_MAP[errorCode];
  }
  return {
    title: fallback?.title ?? 'Erro inesperado',
    description: fallback?.description ?? 'Tente novamente. Se o problema persistir, contate o suporte.',
    isAccessError: fallback?.isAccessError,
  };
}

/**
 * Extrai o código de erro de uma resposta axios.
 */
export function extractErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const resp = (err as any)?.response?.data;
  return typeof resp?.error === 'string' ? resp.error : null;
}

/**
 * Retorna a InstitutionalErrorInfo de um erro axios.
 */
export function parseInstitutionalError(
  err: unknown,
  fallback?: Partial<InstitutionalErrorInfo>,
): InstitutionalErrorInfo {
  const code = extractErrorCode(err);
  return getInstitutionalError(code, fallback);
}
