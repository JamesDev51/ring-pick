import { useRef, useState } from 'react';
import type { WeddingBandCandidate, WeddingBandResult } from '../../types/weddingBand';
import { exportResultCard } from '../../features/wedding-band/exportAdapter';
import { encodeShareResult } from '../../features/wedding-band/shareCodec';
import { track } from '../../features/wedding-band/analytics';
import { ExportCard } from './ExportCard';

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

export function ShareActions({ result, winner, onToast }: { result: WeddingBandResult; winner: WeddingBandCandidate; onToast: (message: string) => void }) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const token = encodeShareResult(result, winner);
  const shareUrl = `${window.location.origin}/r/${token}`;

  async function saveImage() {
    if (!exportRef.current || saving) return;
    setSaving(true);
    try {
      await exportResultCard(exportRef.current);
      onToast('결과 이미지를 저장했어요.');
      track('image_save', { family: result.winnerFamily });
    } catch {
      onToast('이미지 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: '내 웨딩밴드 취향', text: result.persona, url: shareUrl });
      } else {
        await copyText(shareUrl);
        onToast('공유 링크를 복사했어요.');
      }
      track('share_click', { family: result.winnerFamily });
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') onToast('공유하지 못했어요. 링크를 복사해보세요.');
    }
  }

  async function copyLink() {
    await copyText(shareUrl);
    onToast('공유 링크를 복사했어요.');
    track('link_copy', { family: result.winnerFamily });
  }

  return (
    <>
      <section className="share-actions" aria-label="결과 저장과 공유">
        <button className="primary-button" type="button" disabled={saving} onClick={saveImage}>{saving ? '이미지 만드는 중…' : '결과 이미지 저장'}</button>
        <button className="secondary-button" type="button" onClick={share}>결과 공유하기</button>
        <button className="ghost-button share-link-button" type="button" onClick={copyLink}>링크 복사</button>
      </section>
      <ExportCard ref={exportRef} result={result} winner={winner} />
    </>
  );
}
