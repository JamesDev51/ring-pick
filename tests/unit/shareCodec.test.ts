import { describe, expect, it } from 'vitest';
import { candidateById, candidates } from '../../src/data/wedding-band';
import { createNeutralProfile } from '../../src/features/wedding-band/preferenceEngine';
import { buildResult } from '../../src/features/wedding-band/resultBuilder';
import { decodeShareResult, encodeShareResult } from '../../src/features/wedding-band/shareCodec';

describe('v2 share codec', () => {
  it('round-trips a compact v2 payload', () => {
    const winner = candidateById.get('WB018')!;
    const result = buildResult(createNeutralProfile(), winner, candidates, 'quick');
    const payload = decodeShareResult(encodeShareResult(result, winner));
    expect(payload?.v).toBe(2);
    expect(payload?.w).toBe('WB018');
    expect(payload?.p.metalTone).toBeTruthy();
  });

  it('rejects malformed or legacy tokens', () => {
    expect(decodeShareResult('not-a-result')).toBeUndefined();
    const legacy = btoa(JSON.stringify({ v: 1, w: 'R001' }));
    expect(decodeShareResult(legacy)).toBeUndefined();
  });
});
