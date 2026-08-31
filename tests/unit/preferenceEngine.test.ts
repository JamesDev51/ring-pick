import { describe, expect, it } from 'vitest';
import { questions, rings } from '../../src/data/ring';
import { scoreDiagnostic, preferencesFromScores, scoreTournament } from '../../src/features/ring/preferenceEngine';
import { selectQuickCandidates } from '../../src/features/ring/candidateSelector';
import { buildBracket, currentPair, recordMatch, tournamentWinner, undoLastMatch } from '../../src/features/ring/bracketEngine';

describe('diagnostic engine',()=>{
  it('uses Laplace smoothing and detects repeated preference',()=>{
    const answers=questions.map(q=>({questionId:q.id,choice:'a' as const,answeredAt:'2026-08-31T00:00:00Z'}));
    const scores=scoreDiagnostic(answers); expect(scores.metal.white!.score).toBeGreaterThan(.5); const prefs=preferencesFromScores(scores); expect(prefs).toHaveLength(8);
  });
  it('selects 16 unique deterministic quick candidates',()=>{
    const answers=questions.map((q,i)=>({questionId:q.id,choice:(i%3===0?'neutral':'a') as 'neutral'|'a',answeredAt:'2026-08-31T00:00:00Z'})); const s=scoreDiagnostic(answers); const a=selectQuickCandidates(rings,s,12345),b=selectQuickCandidates(rings,s,12345);expect(a).toEqual(b);expect(a).toHaveLength(16);expect(new Set(a).size).toBe(16);
  });
});

describe('bracket engine',()=>{
  it('completes full 64 bracket in exactly 63 matches',()=>{let state=buildBracket(rings.map(r=>r.id),77);for(let i=0;i<63;i++){const [left]=currentPair(state);state=recordMatch(state,left!,'full',Date.now()+i+1);}expect(state.history).toHaveLength(63);expect(tournamentWinner(state)).toBeTruthy();expect(scoreTournament(state.history).metal).toBeTruthy();});
  it('undo reconstructs the exact prior match',()=>{let s=buildBracket(rings.slice(0,16).map(r=>r.id),42);const [a]=currentPair(s);s=recordMatch(s,a!,'quick',1000);const [b]=currentPair(s);s=recordMatch(s,b!,'quick',1100);const u=undoLastMatch(s,'quick');expect(u.history).toHaveLength(1);expect(currentPair(u)).toEqual(currentPair(recordMatch(buildBracket(s.initialIds,1,true),a!,'quick',1000)));});
});
