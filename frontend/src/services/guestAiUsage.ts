export type GuestAiSystem = 'takhet-ai' | 'ai-browser' | 'mental-ai' | 'ai-video';

export const GUEST_AI_REQUEST_LIMIT = 3;

const STORAGE_KEY = 'takhet_guest_ai_usage_v1';
const memoryUsage: Partial<Record<GuestAiSystem, number>> = {};

export class GuestAiLimitError extends Error {
  readonly system: GuestAiSystem;

  constructor(system: GuestAiSystem) {
    super('GUEST_AI_LIMIT_REACHED');
    this.name = 'GuestAiLimitError';
    this.system = system;
  }
}

const readUsage = (): Partial<Record<GuestAiSystem, number>> => {
  if (typeof window === 'undefined') return memoryUsage;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Partial<Record<GuestAiSystem, number>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return memoryUsage;
  }
};

const writeUsage = (usage: Partial<Record<GuestAiSystem, number>>) => {
  Object.assign(memoryUsage, usage);
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // In-memory enforcement remains active when storage is unavailable.
  }
};

export const getGuestAiRequestsRemaining = (system: GuestAiSystem) =>
  Math.max(0, GUEST_AI_REQUEST_LIMIT - Math.max(0, Number(readUsage()[system] || 0)));

export const consumeGuestAiRequest = (system: GuestAiSystem) => {
  const usage = readUsage();
  const used = Math.max(0, Number(usage[system] || 0));
  if (used >= GUEST_AI_REQUEST_LIMIT) throw new GuestAiLimitError(system);

  const nextUsage = { ...usage, [system]: used + 1 };
  writeUsage(nextUsage);
  return GUEST_AI_REQUEST_LIMIT - used - 1;
};

export const isGuestAiLimitError = (error: unknown): error is GuestAiLimitError => error instanceof GuestAiLimitError;

export const guestAiLimitMessage =
  'Гостевой лимит этой ИИ-системы исчерпан: доступно 3 запроса. Войдите или зарегистрируйтесь, чтобы продолжить без гостевого ограничения.';
