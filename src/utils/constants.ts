import { Calendar, Users, TrendingUp } from "lucide-react";

export const UF_OPTIONS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const AUTH_FEATURES = [
    {
        icon: Calendar,
        title: "Agenda Inteligente",
        description: "Organize plantões e compromissos em um só lugar",
    },
    {
        icon: Users,
        title: "Gestão de Equipes",
        description: "Coordene escalas e permutas com sua equipe",
    },
    {
        icon: TrendingUp,
        title: "Controle Financeiro",
        description: "Acompanhe recebimentos e pagamentos",
    },
] as const;

// Links e contatos
export const SUPPORT_WHATSAPP_NUMBER = '+559891169576'; // Número de WhatsApp de suporte (formato: 55 + DDD + número)
export const TERMS_OF_USE_URL = 'https://medneeds.com.br/conteudo/uso';
export const PRIVACY_POLICY_URL = 'https://medneeds.com.br/conteudo/privacidade';
