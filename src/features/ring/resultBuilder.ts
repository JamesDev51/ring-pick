import type { AttributePreference, AttributeScores, Ring, RingResult } from '../../types/ring';
import { attributeLabels, compactValueLabels, valueLabels } from '../../data/ring/labels';
import { ATTRIBUTE_ORDER, ATTRIBUTE_WEIGHTS, attributeSimilarity } from './constants';
import { preferencesFromScores } from './preferenceEngine';

function pmap(prefs:AttributePreference[]){return new Map(prefs.map(p=>[p.attribute,p]));}
export function personaName(winner:Ring,prefs:AttributePreference[]){ const map=pmap(prefs); const confident=(k:keyof Ring['attributes'])=>map.get(k)?.confidence!=='low'; let style='클래식 솔리테어';
  if(winner.attributes.halo==='halo'&&confident('halo')) style='화려한 헤일로'; else if(winner.attributes.setting==='bezel'&&confident('setting'))style='선이 또렷한 모던 베젤'; else if(winner.attributes.finish==='pave'&&winner.attributes.halo==='none'&&confident('finish'))style='은은하게 반짝이는 파베';
  let adjective='균형 잡힌'; if(winner.attributes.size==='large'&&confident('size')) adjective='존재감 있는'; else if(winner.attributes.size==='small'&&winner.attributes.width==='thin'&&confident('size')) adjective='섬세한'; else if(confident('metal')) adjective=winner.attributes.metal==='white'?'깔끔한':winner.attributes.metal==='yellow'?'따뜻한':'로맨틱한';
  return `${adjective} ${style}파`;
}
function storeSentence(w:Ring,prefs:AttributePreference[]){ const map=pmap(prefs); const bits:string[]=[]; const add=(k:keyof Ring['attributes'],suffix='')=>{const p=map.get(k);if(p&&p.confidence!=='low')bits.push(`${valueLabels[k][w.attributes[k]]}${suffix}`)};
  add('metal','에'); add('shape','형 센터 스톤,'); add('size',' 크기,'); add('width',' 밴드,'); add('finish',' 스타일,'); add('profile',' 세팅을');
  const base=bits.join(' ').replace(/\s+,/g,','); return `${base || '우승 반지와 비슷한 전체 인상의 디자인을'} 먼저 보고 싶어요.`;
}
function exclusionSentence(w:Ring,prefs:AttributePreference[]){ const lows=prefs.filter(p=>p.confidence==='low'); if(lows.length) return undefined; const avoid:string[]=[]; if(w.attributes.halo==='none') avoid.push('큰 헤일로'); if(w.attributes.width!=='thick') avoid.push('두꺼운 밴드'); if(w.attributes.finish==='plain') avoid.push('화려한 파베'); return avoid.length?`${avoid.slice(0,2).join('나 ')}는 우선 제외하고 싶어요.`:undefined; }
export function buildResult(scores:AttributeScores,winner:Ring,rings:Ring[]):RingResult{ const preferences=preferencesFromScores(scores); const topAttributes=[...preferences].sort((a,b)=>{const aa=ATTRIBUTE_WEIGHTS[a.attribute]*(a.score-.5),bb=ATTRIBUTE_WEIGHTS[b.attribute]*(b.score-.5);return bb-aa;}).slice(0,4).map(p=>({attribute:p.attribute,value:p.topValue,label:`${attributeLabels[p.attribute]} · ${compactValueLabels[p.attribute][p.topValue]}`,score:p.score,confidence:p.confidence}));
  const ranked=rings.filter(r=>r.id!==winner.id).map(r=>({r,sim:attributeSimilarity(r.attributes,winner.attributes)})).sort((a,b)=>b.sim-a.sim||a.r.id.localeCompare(b.r.id)); const alternatives:RingResult['alternatives']=[];
  for(const x of ranked){ if(alternatives.length>=3)break; if(alternatives.some(a=>{const ar=rings.find(r=>r.id===a.ringId)!;return attributeSimilarity(ar.attributes,x.r.attributes)>.9}))continue; const diff=ATTRIBUTE_ORDER.find(k=>x.r.attributes[k]!==winner.attributes[k]); alternatives.push({ringId:x.r.id,reason:diff?`${valueLabels[diff][winner.attributes[diff]]} 대신 ${valueLabels[diff][x.r.attributes[diff]]}도 같이 비교해보세요.`:'비슷한 균형의 디자인이에요.'}); }
  return {winnerId:winner.id,persona:personaName(winner,preferences),preferences,topAttributes,storeSentence:storeSentence(winner,preferences),exclusionSentence:exclusionSentence(winner,preferences),alternatives,generatedAt:new Date().toISOString()}; }
