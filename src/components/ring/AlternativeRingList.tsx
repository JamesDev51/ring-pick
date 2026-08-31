import type { RingResult } from '../../types/ring';
import { ringById } from '../../data/ring';
import './result.css';
export function AlternativeRingList({ alternatives }: { alternatives: RingResult['alternatives'] }) {return <section className="result-section"><div className="section-heading"><h2>이 스타일도 같이 비교해보세요</h2><p>우승 반지와 가까우면서 한 가지씩 다른 후보예요.</p></div><div className="alternative-list">{alternatives.map(a=>{const r=ringById.get(a.ringId);if(!r)return null;return <article className="alternative-card card" key={a.ringId}><img src={r.assets.thumb} alt={`${a.ringId} 대안 반지`} loading="lazy"/><div><strong>{a.ringId}</strong><p>{a.reason}</p></div></article>})}</div></section>}
