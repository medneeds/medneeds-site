import { STORAGE_KEYS } from '@/config/constants';

async function getCurrentUserId(): Promise<string | null> {
  try {
    const raw = await localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

async function scopedKey(baseKey: string): Promise<string> {
  const userId = await getCurrentUserId();
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export async function getScopedItem(baseKey: string): Promise<string | null> {
  const key = await scopedKey(baseKey);
  return localStorage.getItem(key);
}

export async function setScopedItem(baseKey: string, value: string): Promise<void> {
  const key = await scopedKey(baseKey);
  await localStorage.setItem(key, value);
}

export async function removeScopedItem(baseKey: string): Promise<void> {
  const key = await scopedKey(baseKey);
  await localStorage.removeItem(key);
}

export const USER_SCOPED_KEYS = {
  LAST_SELECTED_FILTER_ID: STORAGE_KEYS.LAST_SELECTED_FILTER_ID,
  // ONBOARDING_FILTER_ID agora será derivado do Profile.filters no servidor.
  // Mantemos a chave para compatibilidade, mas não é mais fonte da verdade.
  ONBOARDING_FILTER_ID: STORAGE_KEYS.ONBOARDING_FILTER_ID,
};

// Utilitário para limpar ponteiros do usuário atual (chamar em logout, opcional)
export async function clearUserFilterPointers() {
  try {
    await Promise.all([
      removeScopedItem(USER_SCOPED_KEYS.LAST_SELECTED_FILTER_ID),
      removeScopedItem(USER_SCOPED_KEYS.ONBOARDING_FILTER_ID),
    ]);
  } catch(e) {
    console.error(e);
  }
}


