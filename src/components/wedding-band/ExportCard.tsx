import { forwardRef } from 'react';
import type { WeddingBandCandidate, WeddingBandResult } from '../../types/weddingBand';

export const ExportCard = forwardRef<HTMLDivElement, { result: WeddingBandResult; winner: WeddingBandCandidate }>(
  function ExportCard({ result, winner }, ref) {
    return (
      <div className="export-offscreen" aria-hidden="true">
        <div className="export-card" ref={ref}>
          <div className="export-brand">RING PICK · WEDDING BAND</div>
          <div>
            <p className="export-kicker">내 웨딩밴드 취향은</p>
            <h2>{result.persona}</h2>
          </div>
          <div className="export-ring">
            <img src={winner.assets.pack768} alt="" width="768" height="768" />
          </div>
          <div className="export-chips">{result.topTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <p className="export-sentence">{result.storeSentence}</p>
          <div className="export-footer"><strong>링픽</strong><span>매일 끼고 싶은 웨딩밴드 취향 테스트</span></div>
        </div>
      </div>
    );
  },
);
