import { describe,expect,it } from 'vitest';
import { ringById } from '../../src/data/ring';
import { decodeShared, encodePreference } from '../../src/features/ring/shareCodec';

describe('share codec',()=>{
  it('round-trips a valid ring token',()=>{
    const r=ringById.get('R034')!;
    const p=encodePreference(r.attributes);
    expect(decodeShared(`?v=1&w=${r.id}&p=${p}`)?.id).toBe('R034');
  });
  it('rejects a token that does not match the winner attributes',()=>{
    expect(decodeShared('?v=1&w=R034&p=ye.ov.md.th.pl.pr.no.hi')).toBeUndefined();
  });
});
