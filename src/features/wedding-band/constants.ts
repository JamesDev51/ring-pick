import { preferenceDomains } from '../../data/wedding-band/labels';
import { valueSimilarity } from '../../data/wedding-band';
import type { PreferenceKey, WeddingBandAttributes } from '../../types/weddingBand';

export const PREFERENCE_KEYS: PreferenceKey[] = [
  'diamondLayout',
  'metalTone',
  'surfaceFinish',
  'bandWidth',
  'bandProfile',
  'motif',
  'colorLayout',
];

export const ATTRIBUTE_WEIGHTS: Record<PreferenceKey, number> = {
  diamondLayout: 0.24,
  metalTone: 0.16,
  surfaceFinish: 0.15,
  bandWidth: 0.13,
  bandProfile: 0.12,
  motif: 0.12,
  colorLayout: 0.08,
};

export const VALUE_DOMAINS = preferenceDomains;

export const ROUND_WEIGHTS: Record<number, number> = {
  64: 0.7,
  32: 0.8,
  16: 1,
  8: 1.15,
  4: 1.3,
  2: 1.5,
};

export function valueAffinity(key: PreferenceKey, preferred: string, actual: string) {
  if (preferred === actual) return 1;
  return valueSimilarity[key]?.[preferred]?.[actual] ?? 0;
}

export function attributeSimilarity(a: WeddingBandAttributes, b: WeddingBandAttributes) {
  let total = 0;
  let score = 0;
  for (const key of PREFERENCE_KEYS) {
    const weight = ATTRIBUTE_WEIGHTS[key];
    total += weight;
    score += weight * valueAffinity(key, String(a[key]), String(b[key]));
  }
  return total ? score / total : 0;
}

export const WILDCARD_VALUES: Partial<Record<PreferenceKey, string[]>> = {
  diamondLayout: ['channel'],
  motif: ['segmented'],
  surfaceFinish: ['hairline'],
};
