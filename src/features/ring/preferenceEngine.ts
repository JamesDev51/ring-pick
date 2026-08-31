import type { AttributePreference, AttributeScores, DiagnosticAnswer, MatchRecord, Ring, ValueStats } from '../../types/ring';
import { questions, ringById } from '../../data/ring';
import { ATTRIBUTE_ORDER, VALUE_DOMAINS } from './constants';

function stat(): ValueStats { return { wins:0, losses:0, neutrals:0, comparisons:0, score:.5 }; }
export function emptyScores(): AttributeScores {
  return Object.fromEntries(ATTRIBUTE_ORDER.map(a=>[a,Object.fromEntries(VALUE_DOMAINS[a].map(v=>[v,stat()]))])) as AttributeScores;
}
function finalize(s: ValueStats) { s.comparisons = s.wins+s.losses+s.neutrals; s.score=(s.wins+.5*s.neutrals+1)/(s.wins+s.losses+s.neutrals+2); }

export function scoreDiagnostic(answers: DiagnosticAnswer[]): AttributeScores {
  const scores=emptyScores();
  for(const answer of answers){ const q=questions.find(x=>x.id===answer.questionId); if(!q) continue; const a=scores[q.attribute][q.a]!; const b=scores[q.attribute][q.b]!;
    if(answer.choice==='a'){a.wins++;b.losses++;} else if(answer.choice==='b'){b.wins++;a.losses++;} else {a.neutrals++;b.neutrals++;}
    finalize(a); finalize(b);
  }
  return scores;
}

export function scoreTournament(history: MatchRecord[]): AttributeScores {
  const scores=emptyScores();
  for(const match of history){ const winner=ringById.get(match.winnerId), loser=ringById.get(match.loserId); if(!winner||!loser) continue;
    for(const key of ATTRIBUTE_ORDER){ const wv=winner.attributes[key], lv=loser.attributes[key]; if(wv===lv) continue; const w=scores[key][wv]!; const l=scores[key][lv]!; w.wins+=match.weight; l.losses+=match.weight; finalize(w); finalize(l); }
  }
  return scores;
}

export function preferencesFromScores(scores: AttributeScores): AttributePreference[] {
  return ATTRIBUTE_ORDER.map(attribute=>{
    const ranked=Object.entries(scores[attribute]).sort((a,b)=>b[1].score-a[1].score || b[1].comparisons-a[1].comparisons || a[0].localeCompare(b[0]));
    const first=ranked[0]!; const second=ranked[1] ?? [first[0], { ...stat(), score:0 } satisfies ValueStats];
    const [topValue,top]=first; const [secondValue,secondStats]=second;
    const gap=top.score-secondStats.score; const exposure=top.comparisons; const confidence = gap>=.25 && exposure>=3 ? 'high' : gap>=.12 && exposure>=2 ? 'medium' : 'low';
    return {attribute,topValue,secondValue,score:top.score,secondScore:secondStats.score,confidence,exposure};
  });
}

export function combineScores(diagnostic: AttributeScores|undefined, tournament: AttributeScores, winner?: Ring, mode:'quick'|'full'='quick'): AttributeScores {
  const out=emptyScores();
  for(const key of ATTRIBUTE_ORDER){ for(const value of VALUE_DOMAINS[key]){
    const d=diagnostic?.[key][value]?.score ?? .5, t=tournament[key][value]?.score ?? .5; let score=mode==='quick' ? .6*d+.4*t : t;
    if(winner?.attributes[key]===value) score=Math.min(1,score+.05);
    const src=tournament[key][value] ?? stat(); out[key][value]={...src,score};
  }}
  return out;
}
