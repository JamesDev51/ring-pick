import type { RingView, WeddingBandAssets } from '../../types/weddingBand';
import { RingChoiceCard } from './RingChoiceCard';

interface ImageAssets { image384: string; image768: string; fallback: string }
interface Item { assets: WeddingBandAssets | ImageAssets; alt: string }
interface Props {
  a: Item;
  b: Item;
  view: RingView;
  onA: () => void;
  onB: () => void;
  onZoomA: () => void;
  onZoomB: () => void;
  selected?: 'a' | 'b';
  disabled?: boolean;
}

export function ComparisonStage({ a, b, view, onA, onB, onZoomA, onZoomB, selected, disabled }: Props) {
  return (
    <section className="comparison-stage" aria-label="웨딩밴드 두 개 비교">
      <RingChoiceCard side="a" assets={a.assets} view={view} alt={a.alt} onSelect={onA} onZoom={onZoomA} selected={selected === 'a'} disabled={disabled} />
      <div className="versus" aria-hidden="true"><span>VS</span></div>
      <RingChoiceCard side="b" assets={b.assets} view={view} alt={b.alt} onSelect={onB} onZoom={onZoomB} selected={selected === 'b'} disabled={disabled} />
    </section>
  );
}
