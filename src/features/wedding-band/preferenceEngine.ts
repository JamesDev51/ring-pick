import { diagnosticQuestions } from '../../data/wedding-band';
import { preferenceDomains } from '../../data/wedding-band/labels';
import type {
  AxisPreference,
  DiagnosticAnswer,
  PreferenceKey,
  PreferenceProfile,
  TournamentMatch,
  ValuePreference,
  WeddingBandAttributes,
  WeddingBandCandidate,
} from '../../types/weddingBand';
import { ATTRIBUTE_WEIGHTS, PREFERENCE_KEYS, ROUND_WEIGHTS, valueAffinity } from './constants';

interface MutableValue extends ValuePreference {
  weightedWins: number;
  weightedLosses: number;
  weightedNeutrals: number;
}

type MutableProfile = Record<PreferenceKey, Record<string, MutableValue>>;

function createMutableProfile(): MutableProfile {
  return Object.fromEntries(
    PREFERENCE_KEYS.map((key) => [
      key,
      Object.fromEntries(
        preferenceDomains[key].map((value) => [
          value,
          {
            value,
            score: 0.5,
            exposures: 0,
            wins: 0,
            losses: 0,
            neutrals: 0,
            weightedWins: 0,
            weightedLosses: 0,
            weightedNeutrals: 0,
          },
        ]),
      ),
    ]),
  ) as MutableProfile;
}

function ensureValue(profile: MutableProfile, key: PreferenceKey, value: string) {
  if (!profile[key][value]) {
    profile[key][value] = {
      value,
      score: 0.5,
      exposures: 0,
      wins: 0,
      losses: 0,
      neutrals: 0,
      weightedWins: 0,
      weightedLosses: 0,
      weightedNeutrals: 0,
    };
  }
  return profile[key][value];
}

function addPairSignal(
  profile: MutableProfile,
  key: PreferenceKey,
  aValue: string,
  bValue: string,
  outcome: 'a' | 'b' | 'neutral',
  weight = 1,
) {
  const a = ensureValue(profile, key, aValue);
  const b = ensureValue(profile, key, bValue);
  a.exposures += 1;
  b.exposures += 1;
  if (outcome === 'neutral') {
    a.neutrals += 1;
    b.neutrals += 1;
    a.weightedNeutrals += weight;
    b.weightedNeutrals += weight;
    return;
  }
  const winner = outcome === 'a' ? a : b;
  const loser = outcome === 'a' ? b : a;
  winner.wins += 1;
  loser.losses += 1;
  winner.weightedWins += weight;
  loser.weightedLosses += weight;
}

function confidenceFor(values: ValuePreference[]): AxisPreference['confidence'] {
  const sorted = [...values].sort((a, b) => b.score - a.score);
  const gap = (sorted[0]?.score ?? 0.5) - (sorted[1]?.score ?? 0.5);
  const exposure = sorted.reduce((sum, value) => sum + value.exposures, 0);
  if (exposure >= 4 && gap >= 0.22) return 'high';
  if (exposure >= 2 && gap >= 0.1) return 'medium';
  return 'low';
}

function finalize(profile: MutableProfile): PreferenceProfile {
  return Object.fromEntries(
    PREFERENCE_KEYS.map((key) => {
      const values = Object.values(profile[key]).map<ValuePreference>((item) => {
        const positive = item.weightedWins + item.weightedNeutrals * 0.5 + 1;
        const denominator = item.weightedWins + item.weightedLosses + item.weightedNeutrals + 2;
        return { ...item, score: denominator ? positive / denominator : 0.5 };
      });
      values.sort((a, b) => b.score - a.score || b.exposures - a.exposures || a.value.localeCompare(b.value));
      const top = values[0] ?? { value: preferenceDomains[key][0], score: 0.5 };
      const second = values[1] ?? top;
      return [
        key,
        {
          key,
          values,
          topValue: top.value,
          secondValue: second.value,
          score: top.score,
          confidence: confidenceFor(values),
        },
      ];
    }),
  ) as PreferenceProfile;
}

export function createNeutralProfile(): PreferenceProfile {
  return finalize(createMutableProfile());
}

export function scoreDiagnostic(answers: DiagnosticAnswer[]): PreferenceProfile {
  const profile = createMutableProfile();
  for (const answer of answers) {
    const question = diagnosticQuestions.find((item) => item.id === answer.questionId);
    if (!question) continue;
    addPairSignal(profile, question.attribute, question.aValue, question.bValue, answer.choice, 1);
  }
  return finalize(profile);
}

export function scoreTournament(
  history: TournamentMatch[],
  candidateLookup: Map<string, WeddingBandCandidate>,
): PreferenceProfile {
  const profile = createMutableProfile();
  for (const match of history) {
    const winner = candidateLookup.get(match.winnerId);
    const loser = candidateLookup.get(match.loserId);
    if (!winner || !loser) continue;
    const weight = ROUND_WEIGHTS[match.roundSize] ?? 1;
    for (const key of PREFERENCE_KEYS) {
      const winnerValue = String(winner.attributes[key]);
      const loserValue = String(loser.attributes[key]);
      if (winnerValue === loserValue) continue;
      addPairSignal(profile, key, winnerValue, loserValue, 'a', weight);
    }
  }
  return finalize(profile);
}

function scoreByValue(profile: PreferenceProfile, key: PreferenceKey, value: string) {
  return profile[key].values.find((item) => item.value === value)?.score ?? 0.5;
}

export function combineProfiles(
  diagnostic: PreferenceProfile | undefined,
  tournament: PreferenceProfile,
  mode: 'quick' | 'full',
  winner?: WeddingBandCandidate,
): PreferenceProfile {
  if (mode === 'full' || !diagnostic) return applyWinnerBonus(tournament, winner);
  const combined = Object.fromEntries(
    PREFERENCE_KEYS.map((key) => {
      const values = preferenceDomains[key]
        .map<ValuePreference>((value) => {
          const d = diagnostic[key].values.find((item) => item.value === value);
          const t = tournament[key].values.find((item) => item.value === value);
          return {
            value,
            score: (d?.score ?? 0.5) * 0.6 + (t?.score ?? 0.5) * 0.4,
            exposures: (d?.exposures ?? 0) + (t?.exposures ?? 0),
            wins: (d?.wins ?? 0) + (t?.wins ?? 0),
            losses: (d?.losses ?? 0) + (t?.losses ?? 0),
            neutrals: (d?.neutrals ?? 0) + (t?.neutrals ?? 0),
          };
        })
        .sort((a, b) => b.score - a.score || b.exposures - a.exposures);
      const top = values[0];
      return [
        key,
        {
          key,
          values,
          topValue: top.value,
          secondValue: values[1]?.value ?? top.value,
          score: top.score,
          confidence: confidenceFor(values),
        },
      ];
    }),
  ) as PreferenceProfile;
  return applyWinnerBonus(combined, winner);
}

function applyWinnerBonus(profile: PreferenceProfile, winner?: WeddingBandCandidate): PreferenceProfile {
  if (!winner) return profile;
  return Object.fromEntries(
    PREFERENCE_KEYS.map((key) => {
      const winnerValue = String(winner.attributes[key]);
      const values = profile[key].values
        .map((item) => ({ ...item, score: Math.min(1, item.score + (item.value === winnerValue ? 0.05 : 0)) }))
        .sort((a, b) => b.score - a.score || b.exposures - a.exposures);
      return [
        key,
        {
          ...profile[key],
          values,
          topValue: values[0].value,
          secondValue: values[1]?.value ?? values[0].value,
          score: values[0].score,
          confidence: confidenceFor(values),
        },
      ];
    }),
  ) as PreferenceProfile;
}

export function candidateFit(profile: PreferenceProfile, candidate: WeddingBandCandidate) {
  let score = 0;
  let total = 0;
  for (const key of PREFERENCE_KEYS) {
    const weight = ATTRIBUTE_WEIGHTS[key];
    const axis = profile[key];
    const actual = String(candidate.attributes[key]);
    const weightedValueScore = axis.values.reduce(
      (sum, value) => sum + value.score * valueAffinity(key, value.value, actual),
      0,
    );
    const affinityTotal = axis.values.reduce(
      (sum, value) => sum + Math.max(0.05, valueAffinity(key, value.value, actual)),
      0,
    );
    score += weight * (affinityTotal ? weightedValueScore / affinityTotal : scoreByValue(profile, key, actual));
    total += weight;
  }
  return total ? score / total : 0;
}

export function attributeDistance(a: WeddingBandAttributes, b: WeddingBandAttributes) {
  let similarity = 0;
  let total = 0;
  for (const key of PREFERENCE_KEYS) {
    const weight = ATTRIBUTE_WEIGHTS[key];
    similarity += weight * valueAffinity(key, String(a[key]), String(b[key]));
    total += weight;
  }
  return 1 - (total ? similarity / total : 0);
}
