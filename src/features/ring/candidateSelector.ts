import type { AttributeScores, Ring } from '../../types/ring';
import { ATTRIBUTE_ORDER, ATTRIBUTE_WEIGHTS, attributeSimilarity } from './constants';
import { seededShuffle } from './prng';

export function fitScore(ring: Ring, scores: AttributeScores) { return ATTRIBUTE_ORDER.reduce((s,k)=>s+ATTRIBUTE_WEIGHTS[k]*(scores[k][ring.attributes[k]]?.score ?? .5),0); }

export function selectQuickCandidates(rings: Ring[], scores: AttributeScores, seed: number): string[] {
  const enabled=rings.filter(r=>r.enabled); const ranked=enabled.map(r=>({r,fit:fitScore(r,scores)})).sort((a,b)=>b.fit-a.fit || a.r.id.localeCompare(b.r.id));
  const min=Math.min(...ranked.map(x=>x.fit)), max=Math.max(...ranked.map(x=>x.fit));
  const selected: typeof ranked=[];
  while(selected.length<12 && selected.length<ranked.length){ let best:typeof ranked[number]|undefined, bestM=-Infinity;
    for(const item of ranked){ if(selected.some(x=>x.r.id===item.r.id)) continue; const norm=max===min?1:(item.fit-min)/(max-min); const sim=selected.length?Math.max(...selected.map(x=>attributeSimilarity(item.r.attributes,x.r.attributes))):0; const mmr=.8*norm-.2*sim; if(mmr>bestM){bestM=mmr;best=item;} }
    if(best) selected.push(best); else break;
  }
  const lowAttrs=ATTRIBUTE_ORDER.filter(k=>{ const vals=Object.values(scores[k]).sort((a,b)=>b.score-a.score); const gap=(vals[0]?.score??.5)-(vals[1]?.score??.5); const exp=vals[0]?.comparisons??0; return !(gap>=.12&&exp>=2); });
  const explorePool=ranked.filter(x=>!selected.some(s=>s.r.id===x.r.id));
  for(const key of lowAttrs){ if(selected.length>=16) break; const top=selected[0]?.r; const candidate=explorePool.find(x=>top && x.r.attributes[key]!==top.attributes[key] && attributeSimilarity(x.r.attributes,top.attributes)>.55 && !selected.some(s=>s.r.id===x.r.id)); if(candidate) selected.push(candidate); }
  for(const x of ranked){ if(selected.length>=16) break; if(!selected.some(s=>s.r.id===x.r.id)) selected.push(x); }
  const top8=selected.slice(0,8), other=seededShuffle(selected.slice(8,16),seed^0x91e10da5); const pairs:string[]=[];
  for(let i=0;i<8;i++){ const left=top8[i]!; let idx=0, minSim=Infinity; other.forEach((o,j)=>{ const sim=attributeSimilarity(left.r.attributes,o.r.attributes); if(sim<minSim){minSim=sim;idx=j;} }); const [right]=other.splice(idx,1); if(!right) break; pairs.push(left.r.id,right.r.id); }
  return pairs;
}
