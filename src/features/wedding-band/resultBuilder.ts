import {
  bandProfileLabels,
  bandWidthLabels,
  diamondLayoutLabels,
  familyLabels,
  metalToneLabels,
  motifLabels,
  preferenceKeyLabels,
  surfaceFinishLabels,
  valueLabels,
} from '../../data/wedding-band/labels';
import type {
  PreferenceKey,
  PreferenceProfile,
  WeddingBandCandidate,
  WeddingBandResult,
} from '../../types/weddingBand';
import { attributeSimilarity } from './constants';
import { buildPartnerSentence } from './partnerRule';

function personaFor(candidate: WeddingBandCandidate) {
  const familyNames: Record<WeddingBandCandidate['family'], string> = {
    classic: '매일 손이 가는 클래식 밴드파',
    point: '절제된 한 점 포인트파',
    line: '선으로 반짝이는 라인 디테일파',
    pave: '잔잔하게 빛나는 파베 밴드파',
    structure: '면과 구조가 또렷한 모던 밴드파',
    texture: '결이 살아 있는 텍스처 밴드파',
    twoTone: '두 가지 색을 즐기는 투톤 밴드파',
    curve: '부드러운 흐름의 커브 밴드파',
    petiteCenter: '낮고 단정한 쁘띠 센터파',
  };
  return familyNames[candidate.family];
}

function descriptionFor(candidate: WeddingBandCandidate) {
  const tone = metalToneLabels[candidate.attributes.metalTone];
  const width = bandWidthLabels[candidate.attributes.bandWidth];
  const finish = surfaceFinishLabels[candidate.attributes.surfaceFinish];
  const diamond = diamondLayoutLabels[candidate.attributes.diamondLayout];
  return `${tone}의 ${width}에 ${finish}과 ${diamond}가 어우러진, 실제로 매일 착용하기 좋은 취향이에요.`;
}

function buildStoreSentence(candidate: WeddingBandCandidate, dislikes: string[]) {
  const a = candidate.attributes;
  const base = `${metalToneLabels[a.metalTone]} 계열의 ${bandWidthLabels[a.bandWidth]} 밴드에, ${surfaceFinishLabels[a.surfaceFinish]} 표면과 ${diamondLayoutLabels[a.diamondLayout]}가 들어간 ${motifLabels[a.motif]} 디자인을 먼저 보고 싶어요.`;
  return dislikes.length ? `${base} ${dislikes.slice(0, 2).join(' 또는 ')} 느낌은 우선 제외하고 싶어요.` : base;
}

function buildDislikes(profile: PreferenceProfile) {
  const candidates: { key: PreferenceKey; value: string; score: number }[] = [];
  for (const [key, axis] of Object.entries(profile) as [PreferenceKey, PreferenceProfile[PreferenceKey]][]) {
    const lowest = [...axis.values].sort((a, b) => a.score - b.score)[0];
    if (lowest && lowest.score <= 0.37 && lowest.exposures > 0) candidates.push({ key, value: lowest.value, score: lowest.score });
  }
  return candidates
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => `${preferenceKeyLabels[item.key]}의 ${valueLabels[item.key][item.value]}`);
}

function topTags(candidate: WeddingBandCandidate) {
  const a = candidate.attributes;
  return [
    metalToneLabels[a.metalTone],
    bandWidthLabels[a.bandWidth],
    surfaceFinishLabels[a.surfaceFinish],
    diamondLayoutLabels[a.diamondLayout],
    motifLabels[a.motif],
  ].slice(0, 4);
}

function alternatives(winner: WeddingBandCandidate, all: WeddingBandCandidate[]) {
  const ranked = all
    .filter((candidate) => candidate.id !== winner.id && candidate.enabled)
    .map((candidate) => ({ candidate, similarity: attributeSimilarity(winner.attributes, candidate.attributes) }))
    .sort((a, b) => b.similarity - a.similarity);
  const similar = ranked[0]?.candidate;
  const lessOrMore = ranked.find(({ candidate }) => candidate.attributes.diamondLayout !== winner.attributes.diamondLayout)?.candidate;
  const tone = ranked.find(({ candidate }) => candidate.attributes.metalTone !== winner.attributes.metalTone)?.candidate;
  const unique = [similar, lessOrMore, tone]
    .filter((item): item is WeddingBandCandidate => Boolean(item))
    .filter((item, index, array) => array.findIndex((other) => other.id === item.id) === index)
    .slice(0, 3);
  return unique.map((candidate, index) => ({
    id: candidate.id,
    reason: index === 0 ? '전체 분위기는 가장 비슷해요.' : index === 1 ? '반짝임의 강도를 다르게 비교해보세요.' : '같은 무드에서 금속 색감만 바꾼 대안이에요.',
  }));
}

export function buildResult(
  profile: PreferenceProfile,
  winner: WeddingBandCandidate,
  all: WeddingBandCandidate[],
  mode: 'quick' | 'full',
): WeddingBandResult {
  const strongDislikes = buildDislikes(profile);
  return {
    schemaVersion: 2,
    winnerId: winner.id,
    winnerFamily: winner.family,
    persona: personaFor(winner),
    description: descriptionFor(winner),
    mode,
    preferences: profile,
    topTags: topTags(winner),
    strongDislikes,
    storeSentence: buildStoreSentence(winner, strongDislikes),
    partnerSentence: buildPartnerSentence(winner),
    alternatives: alternatives(winner, all),
    createdAt: new Date().toISOString(),
  };
}

export function buildSharedResult(
  winner: WeddingBandCandidate,
  mode: 'quick' | 'full',
  partial: Partial<Record<PreferenceKey, string>>,
  all: WeddingBandCandidate[],
): WeddingBandResult {
  const preferences = Object.fromEntries(
    (Object.keys(partial) as PreferenceKey[]).map((key) => {
      const top = partial[key] ?? String(winner.attributes[key]);
      return [key, { key, values: [{ value: top, score: 0.78, exposures: 1, wins: 1, losses: 0, neutrals: 0 }], topValue: top, secondValue: top, score: 0.78, confidence: 'medium' }];
    }),
  ) as PreferenceProfile;
  // Guarantee all seven axes are available in shared results.
  for (const key of ['diamondLayout','metalTone','surfaceFinish','bandWidth','bandProfile','motif','colorLayout'] as PreferenceKey[]) {
    if (!preferences[key]) {
      const value = String(winner.attributes[key]);
      preferences[key] = { key, values: [{ value, score: 0.7, exposures: 1, wins: 1, losses: 0, neutrals: 0 }], topValue: value, secondValue: value, score: 0.7, confidence: 'medium' };
    }
  }
  return buildResult(preferences, winner, all, mode);
}

export function summarizeWinner(candidate: WeddingBandCandidate) {
  return `${familyLabels[candidate.family]} · ${bandProfileLabels[candidate.attributes.bandProfile]}`;
}
