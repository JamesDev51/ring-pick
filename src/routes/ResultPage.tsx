import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlternativeBandList } from '../components/wedding-band/AlternativeBandList';
import { ConfirmSheet } from '../components/wedding-band/ConfirmSheet';
import { MobileShell } from '../components/wedding-band/MobileShell';
import { PartnerGuide } from '../components/wedding-band/PartnerGuide';
import { PreferenceMap } from '../components/wedding-band/PreferenceMap';
import { ResultHero } from '../components/wedding-band/ResultHero';
import { ShareActions } from '../components/wedding-band/ShareActions';
import { StoreSentence } from '../components/wedding-band/StoreSentence';
import { Toast } from '../components/wedding-band/Toast';
import { candidateById, candidates } from '../data/wedding-band';
import { decodeShareResult } from '../features/wedding-band/shareCodec';
import { buildSharedResult } from '../features/wedding-band/resultBuilder';
import { useWeddingBandSession } from '../features/wedding-band/sessionContext';
import { track } from '../features/wedding-band/analytics';
import './result.css';

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const input = document.createElement('textarea'); input.value = text; document.body.append(input); input.select(); document.execCommand('copy'); input.remove();
}

export function ResultPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, reset, toast, showToast } = useWeddingBandSession();
  const [restartOpen, setRestartOpen] = useState(false);
  const shared = useMemo(() => token ? decodeShareResult(token) : undefined, [token]);
  const sharedWinner = shared ? candidateById.get(shared.w) : undefined;
  const result = shared && sharedWinner ? buildSharedResult(sharedWinner, shared.m, shared.p, candidates) : session?.result;
  const winner = result ? candidateById.get(result.winnerId) : undefined;

  if (token && (!shared || !sharedWinner)) {
    return (
      <MobileShell><div className="page invalid-result-page">
        <span className="large-mark" aria-hidden="true">◇</span>
        <h1>결과 링크를 열 수 없어요</h1>
        <p>이전 버전 링크이거나 주소가 일부 잘렸을 수 있어요. 새 웨딩밴드 테스트를 시작해주세요.</p>
        <button className="primary-button" type="button" onClick={() => navigate('/')}>새 테스트 시작</button>
      </div></MobileShell>
    );
  }
  if (!result || !winner) return <Navigate to="/" replace />;

  async function copyStoreSentence() {
    await copyText(result!.storeSentence);
    showToast('매장용 문장을 복사했어요.');
    track('store_copy', { family: result!.winnerFamily });
  }

  function restart() {
    reset();
    setRestartOpen(false);
    navigate('/');
  }

  return (
    <MobileShell><div className="page result-page">
      <header className="result-header"><button className="icon-button" type="button" aria-label="홈으로 가기" onClick={() => navigate('/')}>‹</button><strong>링픽 결과</strong><span /></header>
      {token && <div className="shared-badge">공유받은 웨딩밴드 취향 결과예요</div>}
      <ResultHero result={result} winner={winner} />
      <PreferenceMap profile={result.preferences} />
      <StoreSentence sentence={result.storeSentence} dislikes={result.strongDislikes} onCopy={copyStoreSentence} />
      <PartnerGuide sentence={result.partnerSentence} />
      <AlternativeBandList alternatives={result.alternatives} lookup={candidateById} />
      <ShareActions result={result} winner={winner} onToast={showToast} />
      <button className="secondary-button restart-button" type="button" onClick={() => setRestartOpen(true)}>다시 취향 찾기</button>
      <p className="result-disclaimer">화면의 색감은 실제 합금과 다를 수 있어요. 소재, 착용감, 내구성, 사이즈 조절 가능 여부는 매장에서 확인해주세요.{winner.attributes.diamondLayout === 'fullEternity' ? ' 풀 이터니티 링은 사이즈 조절이 제한될 수 있어요.' : ''}</p>
      <ConfirmSheet open={restartOpen} title="현재 결과를 지우고 다시 시작할까요?" body="이 기기에 저장된 진행 상황과 결과가 삭제됩니다." confirmLabel="새로 시작" onConfirm={restart} onCancel={() => setRestartOpen(false)} danger />
      <Toast message={toast} />
    </div></MobileShell>
  );
}
