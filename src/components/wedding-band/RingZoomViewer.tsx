import { useEffect, useRef, useState } from 'react';
import type { RingView, WeddingBandAssets } from '../../types/weddingBand';
import { ResponsiveBandImage } from './ResponsiveBandImage';
import { RingViewToggle } from './RingViewToggle';

interface SimpleAssets { image384: string; image768: string; fallback: string }
interface Props {
  open: boolean;
  assets?: WeddingBandAssets | SimpleAssets;
  initialView?: RingView;
  alt: string;
  onClose: () => void;
}

export function RingZoomViewer({ open, assets, initialView = 'pack', alt, onClose }: Props) {
  const [view, setView] = useState<RingView>(initialView);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) { setView(initialView); closeRef.current?.focus(); } }, [open, initialView]);
  useEffect(() => {
    if (!open) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('.zoom-viewer');
        const controls = dialog ? [...dialog.querySelectorAll<HTMLElement>('button')] : [];
        if (!controls.length) return;
        const first = controls[0];
        const last = controls.at(-1)!;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);
  if (!open || !assets) return null;
  const isCandidate = 'pack384' in assets;
  const src384 = isCandidate ? (view === 'pack' ? assets.pack384 : assets.worn384) : assets.image384;
  const src768 = isCandidate ? (view === 'pack' ? assets.pack768 : assets.worn768) : assets.image768;
  return (
    <div className="zoom-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="zoom-viewer" role="dialog" aria-modal="true" aria-label="반지 확대 보기">
        <header>
          <span>디테일 크게 보기</span>
          <button ref={closeRef} className="icon-button" type="button" aria-label="확대 보기 닫기" onClick={onClose}>×</button>
        </header>
        <ResponsiveBandImage src384={src384} src768={src768} fallback={assets.fallback} alt={alt} eager />
        {isCandidate && <RingViewToggle value={view} onChange={setView} />}
        <p>화면 색과 실제 합금 색은 다를 수 있어요.</p>
      </section>
    </div>
  );
}
