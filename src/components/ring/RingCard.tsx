import { useState } from 'react';
import type { RingAttributes } from '../../types/ring';
import { attributeLabels, valueLabels } from '../../data/ring/labels';
import './ring-card.css';

interface Props { src: string; attributes: RingAttributes; onSelect: () => void; selected?: boolean; disabled?: boolean; testId?: string; }
export function RingCard({ src, attributes, onSelect, selected = false, disabled = false, testId }: Props) {
  const [loaded, setLoaded] = useState(false); const [failed, setFailed] = useState(false); const [retry, setRetry] = useState(0);
  const aria = Object.entries(attributes).map(([k,v]) => `${attributeLabels[k as keyof RingAttributes]} ${valueLabels[k as keyof RingAttributes][v]}`).join(', ');
  function click(){ if(failed){setFailed(false);setLoaded(false);setRetry(v=>v+1);return;} onSelect(); }
  return <button data-testid={testId} className={`ring-card ${selected ? 'is-selected' : ''}`} type="button" onClick={click} disabled={disabled} aria-label={failed?'반지 이미지를 다시 불러오기':`반지 선택: ${aria}`}>
    <span className="ring-image-wrap">
      {!loaded && !failed && <span className="ring-skeleton" />}
      {failed ? <span className="ring-error"><strong>이미지를 불러오지 못했어요</strong><span>카드를 눌러 다시 시도</span></span> : <img key={retry} src={src} alt="" loading="eager" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} />}
      {selected && <span className="ring-check" aria-hidden="true">✓</span>}
    </span>
    <span className="ring-pick-label">{failed?'다시 불러오기':selected ? '선택했어요' : '이쪽이 더 좋아요'}</span>
  </button>;
}
