import { describe, expect, it } from 'vitest';
import { candidates, diagnosticAssetById, diagnosticAssets, diagnosticQuestions } from '../../src/data/wedding-band';

describe('v2 wedding-band manifest', () => {
  it('contains the locked PRD counts and namespaces', () => {
    expect(candidates).toHaveLength(64);
    expect(diagnosticAssets).toHaveLength(25);
    expect(diagnosticQuestions).toHaveLength(18);
    expect(new Set(candidates.map((item) => item.id)).size).toBe(64);
    expect(candidates.every((item) => /^WB\d{3}$/.test(item.id))).toBe(true);
  });

  it('matches the required family distribution', () => {
    const counts = candidates.reduce<Record<string, number>>((acc, item) => { acc[item.family] = (acc[item.family] ?? 0) + 1; return acc; }, {});
    expect(counts).toEqual({ classic:8, point:8, line:8, pave:8, structure:8, texture:8, twoTone:6, curve:6, petiteCenter:4 });
  });

  it('keeps every diagnostic pair controlled to one attribute', () => {
    for (const question of diagnosticQuestions) {
      const a = diagnosticAssetById.get(question.assetA)!;
      const b = diagnosticAssetById.get(question.assetB)!;
      const differences = Object.keys(a.attributes).filter((key) => a.attributes[key as keyof typeof a.attributes] !== b.attributes[key as keyof typeof b.attributes]);
      expect(differences).toEqual([question.attribute]);
      expect(String(a.attributes[question.attribute])).toBe(question.aValue);
      expect(String(b.attributes[question.attribute])).toBe(question.bValue);
    }
  });

  it('keeps oversized engagement rings out of the main manifest', () => {
    expect(candidates.filter((item) => item.family === 'petiteCenter')).toHaveLength(4);
    expect(candidates.every((item) => item.attributes.diamondLayout !== 'petiteCenter' || item.family === 'petiteCenter')).toBe(true);
  });
});
