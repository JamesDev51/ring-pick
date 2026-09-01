import { describe, expect, it } from 'vitest';
import { candidateById, diagnosticQuestions } from '../../src/data/wedding-band';
import { combineProfiles, scoreDiagnostic, scoreTournament } from '../../src/features/wedding-band/preferenceEngine';
import type { DiagnosticAnswer, TournamentMatch } from '../../src/types/weddingBand';

describe('preference engine', () => {
  it('normalizes repeated exposures instead of automatically favoring frequently shown values', () => {
    const answers: DiagnosticAnswer[] = diagnosticQuestions.map((question) => ({ questionId: question.id, choice: 'a', answeredAt: new Date().toISOString() }));
    const profile = scoreDiagnostic(answers);
    expect(profile.metalTone.topValue).toBe('silver');
    expect(profile.metalTone.values.find((value) => value.value === 'champagne')!.exposures).toBeGreaterThan(
      profile.metalTone.values.find((value) => value.value === 'silver')!.exposures,
    );
    expect(profile.bandWidth.topValue).toBe('slim');
    expect(profile.diamondLayout.values.find((value) => value.value === 'none')!.wins).toBeGreaterThan(0);
  });

  it('does not score axes that are identical between winner and loser', () => {
    const a = candidateById.get('WB001')!;
    const b = candidateById.get('WB009')!;
    const match: TournamentMatch = { roundSize:16, matchIndex:0, leftId:a.id, rightId:b.id, winnerId:b.id, loserId:a.id, answeredAt:new Date().toISOString() };
    const profile = scoreTournament([match], candidateById);
    expect(profile.metalTone.values.reduce((sum, item) => sum + item.exposures, 0)).toBe(0);
    expect(profile.diamondLayout.values.find((item) => item.value === 'singleFlush')!.wins).toBe(1);
  });

  it('combines quick mode at 60/40 and caps winner bonus', () => {
    const answers: DiagnosticAnswer[] = diagnosticQuestions.map((question) => ({ questionId: question.id, choice: 'a', answeredAt: new Date().toISOString() }));
    const diagnostic = scoreDiagnostic(answers);
    const tournament = scoreTournament([], candidateById);
    const winner = candidateById.get('WB001')!;
    const combined = combineProfiles(diagnostic, tournament, 'quick', winner);
    expect(combined.metalTone.values.every((item) => item.score <= 1)).toBe(true);
    expect(combined.metalTone.values.find((item) => item.value === 'silver')!.score).toBeGreaterThan(0.5);
  });
});
