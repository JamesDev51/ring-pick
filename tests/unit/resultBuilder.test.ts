import { describe, expect, it } from 'vitest';
import { candidateById, candidates } from '../../src/data/wedding-band';
import { createNeutralProfile } from '../../src/features/wedding-band/preferenceEngine';
import { buildResult } from '../../src/features/wedding-band/resultBuilder';

describe('result builder', () => {
  it('builds store, partner and alternative guidance', () => {
    const winner = candidateById.get('WB052')!;
    const result = buildResult(createNeutralProfile(), winner, candidates, 'quick');
    expect(result.persona).toContain('투톤');
    expect(result.storeSentence).toContain('밴드');
    expect(result.partnerSentence).toContain('투톤');
    expect(result.alternatives).toHaveLength(3);
    expect(new Set(result.alternatives.map((item) => item.id)).size).toBe(3);
  });
});
