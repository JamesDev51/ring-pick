import { useState } from 'react';
import type { RingView, WeddingBandCandidate, WeddingBandResult } from '../../types/weddingBand';
import { ResponsiveBandImage } from './ResponsiveBandImage';
import { RingViewToggle } from './RingViewToggle';

export function ResultHero({ result, winner }: { result: WeddingBandResult; winner: WeddingBandCandidate }) {
  const [view, setView] = useState<RingView>('pack');
  return (
    <section className="result-hero">
      <p className="eyebrow">내 웨딩밴드 취향은</p>
      <h1>{result.persona}</h1>
      <div className="result-winner-image card">
        <ResponsiveBandImage
          src384={view === 'pack' ? winner.assets.pack384 : winner.assets.worn384}
          src768={view === 'pack' ? winner.assets.pack768 : winner.assets.worn768}
          fallback={winner.assets.fallback}
          alt={view === 'pack' ? '내 취향 우승 웨딩밴드 이미지' : '내 취향 우승 웨딩밴드 착용 이미지'}
          eager
        />
      </div>
      <RingViewToggle value={view} onChange={setView} />
      <p className="result-description">{result.description}</p>
      <div className="result-tags" aria-label="핵심 취향 태그">
        {result.topTags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </section>
  );
}
