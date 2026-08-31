import type { RingView } from '../../types/weddingBand';

export function RingViewToggle({ value, onChange }: { value: RingView; onChange: (value: RingView) => void }) {
  return (
    <div className="view-toggle" role="group" aria-label="반지 이미지 보기 방식">
      <button type="button" className={value === 'pack' ? 'active' : ''} aria-pressed={value === 'pack'} onClick={() => onChange('pack')}>반지만</button>
      <button type="button" className={value === 'worn' ? 'active' : ''} aria-pressed={value === 'worn'} onClick={() => onChange('worn')}>착용 모습</button>
    </div>
  );
}
