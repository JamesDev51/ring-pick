import type { ResultAlternative, WeddingBandCandidate } from '../../types/weddingBand';
import { ResponsiveBandImage } from './ResponsiveBandImage';

export function AlternativeBandList({ alternatives, lookup }: { alternatives: ResultAlternative[]; lookup: Map<string, WeddingBandCandidate> }) {
  return (
    <section className="result-section" aria-labelledby="alternatives-title">
      <div className="section-heading">
        <h2 id="alternatives-title">같이 비교해볼 대안 3개</h2>
        <p>매장에서는 아래 방향도 함께 껴보세요.</p>
      </div>
      <div className="alternative-list">
        {alternatives.map((alternative) => {
          const candidate = lookup.get(alternative.id);
          if (!candidate) return null;
          return (
            <article className="alternative-card card" key={candidate.id}>
              <ResponsiveBandImage src384={candidate.assets.pack384} src768={candidate.assets.pack768} fallback={candidate.assets.fallback} alt={`${candidate.title} 대안 웨딩밴드`} />
              <div>
                <strong>{candidate.title}</strong>
                <p>{alternative.reason}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
