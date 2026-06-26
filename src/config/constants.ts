
export const SERVER_HOST = 'https://medneedsapp.cloud';
//export const SERVER_HOST = 'http://localhost:3000';
// export const SERVER_HOST = 'http://192.168.1.11:3000';
export const API_HOST = `${SERVER_HOST}/api`;
export const MATRIX_DOMAIN = 'medneeds.cloud';
export const MATRIX_URL = `https://${MATRIX_DOMAIN}`;

export const GOOGLE_MAPS_API_KEY = "AIzaSyAdBVDCzJ6MRGUxfOBNwYMQqS3Qu-4hG1s";

export const PROFILE_PICTURE_PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

// Armazenamento
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@medneeds:auth_token',
  USER_DATA: '@medneeds:user_data',
  THEME: '@medneeds:theme',
  APPEARANCE: '@medneeds:appearance',
  MATRIX_ACCESS_TOKEN: '@medneeds:matrix_access_token',
  MATRIX_DEVICE_ID: '@medneeds:matrix_device_id',
  ONBOARDING_DONE: '@medneeds:onboarding_done',
  LAST_SELECTED_FILTER_ID: '@medneeds:last_filter_id',
  ONBOARDING_FILTER_ID: '@medneeds:onboarding_filter_id',
  PUSH_TOKEN: '@medneeds:push_token',
};

// Paginação
export const DEFAULT_PAGE_SIZE = 10;

// Timeouts
export const API_TIMEOUT = 15000; // 15 segundos
export const REFRESH_TOKEN_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Regex para validação
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// App
export const APP_VERSION = '2.0.33'; 

// Links e contatos
export const SUPPORT_WHATSAPP_NUMBER = '+559891169576'; // Número de WhatsApp de suporte (formato: 55 + DDD + número)
export const TERMS_OF_USE_URL = 'https://medneeds.com.br/conteudo/uso';
export const PRIVACY_POLICY_URL = 'https://medneeds.com.br/conteudo/privacidade';
export const APP_SHARE_URL = 'https://apps.apple.com/br/app/medneeds/id6482998782'; // Link para compartilhar o app

/** Deep link para abrir uma oferta no app (mesmo esquema da página web). */
export const APP_DEEP_LINK_OFFER = (jobId: string) =>
  `com.medneeds.meds://oferta/${jobId}`;

// Debug
export const DEBUG_MODE = false;