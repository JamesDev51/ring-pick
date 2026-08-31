import type { AttributePreference } from '../../types/ring';
import { attributeLabels, confidenceLabels, valueLabels } from '../../data/ring/labels';
import './result.css';
export function PreferenceBars({ preferences }: { preferences: AttributePreference[] }) {
  return <section className="result-section" aria-labelledby="preference-title"><div className="section-heading"><h2 id="preference-title">내 취향을 이렇게 읽었어요</h2><p>선택이 엇갈린 항목은 탐색 중으로 표시해요.</p></div><div className="preference-list">{preferences.map(p=><div className="preference-row" key={p.attribute}><div className="preference-copy"><strong>{attributeLabels[p.attribute]}</strong><span>{valueLabels[p.attribute][p.topValue]} · {confidenceLabels[p.confidence]}</span></div><div className="preference-meter" aria-label={`${Math.round(p.score*100)} 퍼센트`}><span style={{width:`${Math.round(p.score*100)}%`}} /></div><b>{p.confidence==='low'?'탐색 중':`${Math.round(p.score*100)}%`}</b></div>)}</div></section>;
}
