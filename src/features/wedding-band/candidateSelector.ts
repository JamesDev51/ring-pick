import type {
  CandidateScore,
  PreferenceKey,
  PreferenceProfile,
  WeddingBandCandidate,
} from '../../types/weddingBand';
import { WILDCARD_VALUES, attributeSimilarity } from './constants';
import { candidateFit } from './preferenceEngine';
import { seededShuffle } from './prng';

const MAX_PER_FAMILY = 3;
const MAX_PER_TONE = 5;
const MIN_FAMILIES = 6;

function countBy<T>(items: T[], read: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = read(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function respectsCaps(selected: WeddingBandCandidate[], candidate: WeddingBandCandidate) {
  const families = countBy(selected, (item) => item.family);
  const tones = countBy(selected, (item) => item.attributes.metalTone);
  return (families[candidate.family] ?? 0) < MAX_PER_FAMILY && (tones[candidate.attributes.metalTone] ?? 0) < MAX_PER_TONE;
}

function mmrPick(
  pool: WeddingBandCandidate[],
  profile: PreferenceProfile,
  selected: WeddingBandCandidate[],
  target: number,
) {
  while (selected.length < target) {
    const available = pool.filter((candidate) => !selected.some((item) => item.id === candidate.id) && respectsCaps(selected, candidate));
    if (!available.length) break;
    const ranked = available
      .map((candidate) => {
        const fit = candidateFit(profile, candidate);
        const similarity = selected.length
          ? Math.max(...selected.map((item) => attributeSimilarity(item.attributes, candidate.attributes)))
          : 0;
        return { candidate, score: fit * 0.76 + (1 - similarity) * 0.24 };
      })
      .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
    selected.push(ranked[0].candidate);
  }
}

function candidateMatchesAxis(candidate: WeddingBandCandidate, key: PreferenceKey, values: string[]) {
  return values.includes(String(candidate.attributes[key]));
}

export function selectPersonalizedCandidates(
  profile: PreferenceProfile,
  source: WeddingBandCandidate[],
  seed: number,
): CandidateScore[] {
  const pool = seededShuffle(source.filter((item) => item.enabled), seed);
  const selected: WeddingBandCandidate[] = [];

  mmrPick(pool, profile, selected, 10);

  const lowConfidenceAxes = Object.values(profile)
    .filter((axis) => axis.confidence === 'low')
    .sort((a, b) => a.values.reduce((sum, value) => sum + value.exposures, 0) - b.values.reduce((sum, value) => sum + value.exposures, 0));

  for (const axis of lowConfidenceAxes) {
    if (selected.length >= 14) break;
    const options = pool
      .filter((candidate) => !selected.some((item) => item.id === candidate.id) && respectsCaps(selected, candidate))
      .sort((a, b) => {
        const av = String(a.attributes[axis.key]);
        const bv = String(b.attributes[axis.key]);
        const aNovel = av === axis.secondValue ? 1 : 0;
        const bNovel = bv === axis.secondValue ? 1 : 0;
        return bNovel - aNovel || candidateFit(profile, b) - candidateFit(profile, a);
      });
    if (options[0]) selected.push(options[0]);
  }

  while (selected.length < 14) {
    const option = pool
      .filter((candidate) => !selected.some((item) => item.id === candidate.id) && respectsCaps(selected, candidate))
      .sort((a, b) => candidateFit(profile, b) - candidateFit(profile, a))[0];
    if (!option) break;
    selected.push(option);
  }

  for (const [key, values] of Object.entries(WILDCARD_VALUES) as [PreferenceKey, string[]][]) {
    if (selected.length >= 16) break;
    const option = pool.find(
      (candidate) =>
        !selected.some((item) => item.id === candidate.id) &&
        respectsCaps(selected, candidate) &&
        candidateMatchesAxis(candidate, key, values),
    );
    if (option) selected.push(option);
  }

  const familyCounts = countBy(selected, (item) => item.family);
  if (Object.keys(familyCounts).length < MIN_FAMILIES) {
    const missingFamilies = [...new Set(pool.map((item) => item.family))].filter((family) => !(family in familyCounts));
    for (const family of missingFamilies) {
      if (Object.keys(countBy(selected, (item) => item.family)).length >= MIN_FAMILIES) break;
      const replacement = pool.find(
        (candidate) => candidate.family === family && !selected.some((item) => item.id === candidate.id) && respectsCaps(selected, candidate),
      );
      if (!replacement) continue;
      const removableIndex = [...selected]
        .map((item, index) => ({ item, index, score: candidateFit(profile, item) }))
        .filter(({ item }) => (countBy(selected, (current) => current.family)[item.family] ?? 0) > 1)
        .sort((a, b) => a.score - b.score)[0]?.index;
      if (removableIndex !== undefined) selected.splice(removableIndex, 1, replacement);
    }
  }

  while (selected.length < 16) {
    const option = pool.find((candidate) => !selected.some((item) => item.id === candidate.id));
    if (!option) break;
    selected.push(option);
  }

  const fitIds = new Set(selected.slice(0, 10).map((item) => item.id));
  const wildcardIds = new Set(
    selected
      .filter((candidate) =>
        Object.entries(WILDCARD_VALUES).some(([key, values]) =>
          (values as string[]).includes(String(candidate.attributes[key as PreferenceKey])),
        ),
      )
      .slice(-2)
      .map((item) => item.id),
  );

  return selected.slice(0, 16).map((candidate, index) => ({
    id: candidate.id,
    score: candidateFit(profile, candidate),
    origin: wildcardIds.has(candidate.id) ? 'wildcard' : fitIds.has(candidate.id) ? 'fit' : index < 14 ? 'explore' : 'fill',
  }));
}
