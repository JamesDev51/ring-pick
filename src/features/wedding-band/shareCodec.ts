import { sharePayloadSchema } from './schemas';
import type { PreferenceKey, SharePayloadV2, WeddingBandCandidate, WeddingBandResult } from '../../types/weddingBand';

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShareResult(result: WeddingBandResult, winner: WeddingBandCandidate) {
  const keys: PreferenceKey[] = ['diamondLayout','metalTone','surfaceFinish','bandWidth','bandProfile','motif','colorLayout'];
  const payload: SharePayloadV2 = {
    v: 2,
    w: winner.id,
    f: winner.family,
    tone: winner.attributes.metalTone,
    tags: result.topTags,
    p: Object.fromEntries(keys.map((key) => [key, result.preferences[key]?.topValue ?? String(winner.attributes[key])])),
    m: result.mode,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeShareResult(token: string): SharePayloadV2 | undefined {
  try {
    const parsed = sharePayloadSchema.safeParse(JSON.parse(fromBase64Url(token)));
    return parsed.success ? (parsed.data as SharePayloadV2) : undefined;
  } catch {
    return undefined;
  }
}
