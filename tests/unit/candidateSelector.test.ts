import { describe, expect, it } from 'vitest';
import { candidates, diagnosticQuestions } from '../../src/data/wedding-band';
import { selectPersonalizedCandidates } from '../../src/features/wedding-band/candidateSelector';
import { scoreDiagnostic } from '../../src/features/wedding-band/preferenceEngine';

describe('personalized 16 selector', () => {
  it('returns 16 unique and diverse candidates deterministically', () => {
    const profile = scoreDiagnostic(diagnosticQuestions.map((question, index) => ({ questionId: question.id, choice: index % 3 === 0 ? 'neutral' : index % 2 ? 'a' : 'b', answeredAt: new Date().toISOString() })));
    const first = selectPersonalizedCandidates(profile, candidates, 424242);
    const second = selectPersonalizedCandidates(profile, candidates, 424242);
    expect(first).toEqual(second);
    expect(first).toHaveLength(16);
    expect(new Set(first.map((item) => item.id)).size).toBe(16);
    const selected = first.map((score) => candidates.find((candidate) => candidate.id === score.id)!);
    const families = selected.reduce<Record<string, number>>((acc, item) => { acc[item.family] = (acc[item.family] ?? 0) + 1; return acc; }, {});
    const tones = selected.reduce<Record<string, number>>((acc, item) => { acc[item.attributes.metalTone] = (acc[item.attributes.metalTone] ?? 0) + 1; return acc; }, {});
    expect(Object.keys(families).length).toBeGreaterThanOrEqual(6);
    expect(Math.max(...Object.values(families))).toBeLessThanOrEqual(3);
    expect(Math.max(...Object.values(tones))).toBeLessThanOrEqual(5);
    expect(first.some((item) => item.origin === 'wildcard')).toBe(true);
  });
});
