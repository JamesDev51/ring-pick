import type { WeddingBandSessionV2 } from '../../types/weddingBand';
import { MANIFEST_VERSION } from '../../data/wedding-band';
import { sessionSchema } from './schemas';

export const STORAGE_KEY = 'ringpick.session.v2';
export const LEGACY_STORAGE_KEY = 'ringpick.session.v1';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export function loadSession(): WeddingBandSessionV2 | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
    const session = parsed.data as WeddingBandSessionV2;
    const updatedAt = new Date(session.updatedAt).getTime();
    if (session.manifestVersion !== MANIFEST_VERSION || !Number.isFinite(updatedAt) || Date.now() - updatedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
    return session;
  } catch {
    return undefined;
  }
}

export function saveSession(session: WeddingBandSessionV2) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // The active in-memory session remains usable when storage is blocked.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Memory-only fallback.
  }
}

export function hasLegacySession() {
  try {
    return Boolean(localStorage.getItem(LEGACY_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function clearLegacySession() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore blocked storage.
  }
}
