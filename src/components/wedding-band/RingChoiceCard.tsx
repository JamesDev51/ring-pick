import { useState } from 'react';
import type { WeddingBandAssets } from '../../types/weddingBand';
import { ResponsiveBandImage } from './ResponsiveBandImage';

interface Props {
  side: 'a' | 'b';
  assets: Pick<WeddingBandAssets, 'pack384' | 'pack768' | 'worn384' | 'worn768' | 'fallback'> | { image384: string; image768: string; fallback: string };
  view: 'pack' | 'worn';
  alt: string;
  onSelect: () => void;
  onZoom: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function RingChoiceCard({ side, assets, view, alt, onSelect, onZoom, selected = false, disabled = false }: Props) {
  const [loaded, setLoaded] = useState(false);
  const isCandidate = 'pack384' in assets;
  const src384 = isCandidate ? (view === 'pack' ? assets.pack384 : assets.worn384) : assets.image384;
  const src768 = isCandidate ? (view === 'pack' ? assets.pack768 : assets.worn768) : assets.image768;
  return (
    <article className={`choice-card ${selected ? 'is-selected' : ''}`} data-testid={`choice-card-${side}`}>
      <button
        type="button"
        className="choice-select"
        data-testid={`choice-${side}`}
        onClick={onSelect}
        disabled={disabled || !loaded}
        aria-label={`${side === 'a' ? '위' : '아래'} 반지 선택`}
      >
        <ResponsiveBandImage src384={src384} src768={src768} fallback={assets.fallback} alt={alt} eager onLoadState={setLoaded} />
        <span className="choice-footer">
          <span className="choice-letter">{side.toUpperCase()}</span>
          <strong>{selected ? '선택했어요' : loaded ? '이 반지가 더 좋아요' : '이미지 불러오는 중'}</strong>
          {selected && <span className="choice-check" aria-hidden="true">✓</span>}
        </span>
      </button>
      <button className="zoom-button" type="button" aria-label={`${side === 'a' ? '위' : '아래'} 반지 크게 보기`} onClick={onZoom}>
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="5.8"/><path d="m15.2 15.2 4.2 4.2M10.8 8.2v5.2M8.2 10.8h5.2"/></svg>
      </button>
    </article>
  );
}
