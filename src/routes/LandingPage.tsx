import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { candidateById, copy } from '../data/wedding-band';
import { ConfirmSheet } from '../components/wedding-band/ConfirmSheet';
import { MobileShell } from '../components/wedding-band/MobileShell';
import { ResponsiveBandImage } from '../components/wedding-band/ResponsiveBandImage';
import { useWeddingBandSession } from '../features/wedding-band/sessionContext';
import './landing.css';

const previewIds = ['WB001', 'WB009', 'WB018', 'WB042'];

function resumeLabel(phase?: string, mode?: string) {
  if (phase === 'result') return '내 결과 다시 보기';
  if (mode === 'full') return '64강 이어서 하기';
  return '취향 찾기 이어서 하기';
}

export function LandingPage() {
  const navigate = useNavigate();
  const { session, legacyNotice, startQuick, startFull, dismissLegacy } = useWeddingBandSession();
  const [fullConfirm, setFullConfirm] = useState(false);

  function quick() {
    startQuick();
    navigate('/play');
  }

  function full() {
    startFull();
    setFullConfirm(false);
    navigate('/play');
  }

  function resume() {
    navigate(session?.phase === 'result' ? '/result' : '/play');
  }

  return (
    <MobileShell>
      <div className="page landing-page">
        <header className="landing-brand"><span className="brand-mark" aria-hidden="true">◇</span><strong>{copy.brand}</strong></header>

        {legacyNotice && (
          <aside className="legacy-banner" aria-label="이전 버전 안내">
            <div><strong>웨딩밴드 기준으로 새로 바뀌었어요</strong><p>이전 다이아 반지 결과는 새 취향과 섞지 않아요.</p></div>
            <div className="legacy-actions"><Link to="/legacy">자세히</Link><button type="button" onClick={() => dismissLegacy()}>닫기</button></div>
          </aside>
        )}

        <section className="landing-hero">
          <p className="eyebrow">{copy.landing.eyebrow}</p>
          <h1>매일 끼고 싶은<br />웨딩밴드는 어떤 스타일일까?</h1>
          <p>작은 다이아, 밴드 폭, 무광, 투톤까지.<br />둘 중 더 끌리는 반지를 고르면 내 취향을 정리해드려요.</p>
        </section>

        <section className="preview-grid" aria-label="현실적인 웨딩밴드 미리보기">
          {previewIds.map((id, index) => {
            const candidate = candidateById.get(id);
            if (!candidate) return null;
            return (
              <div className={`preview-card preview-${index + 1}`} key={id}>
                <ResponsiveBandImage src384={candidate.assets.pack384} src768={candidate.assets.pack768} fallback={candidate.assets.fallback} alt={`${candidate.description} 미리보기`} eager={index < 2} />
              </div>
            );
          })}
        </section>

        <section className="start-actions" aria-label="테스트 시작">
          {session ? (
            <>
              <button className="primary-button" type="button" onClick={resume}>{resumeLabel(session.phase, session.mode)}</button>
              <button className="link-button" type="button" onClick={quick}>처음부터 다시 시작</button>
            </>
          ) : (
            <>
              <button className="primary-button" type="button" onClick={quick}>2분 취향 찾기</button>
              <span>{copy.landing.quickMeta}</span>
              <button className="secondary-button" type="button" onClick={() => setFullConfirm(true)}>{copy.landing.full}</button>
              <span>{copy.landing.fullMeta}</span>
            </>
          )}
        </section>

        <div className="trust-row"><span>가입 없음</span><span>결과 이미지 저장</span><span>브랜드·가격 비노출</span></div>

        <section className="how-section">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>반지샵 가기 전, 취향부터 정리해요</h2>
          <ol>
            <li><span>01</span><div><strong>둘 중 더 끌리는 링 선택</strong><p>오래 고민하지 말고 첫인상으로 골라요.</p></div></li>
            <li><span>02</span><div><strong>내 취향에 맞춘 16강</strong><p>선택 데이터를 바탕으로 현실적인 후보를 추려요.</p></div></li>
            <li><span>03</span><div><strong>매장에서 보여줄 결과 완성</strong><p>톤·폭·표면·스톤 배치를 한 문장으로 정리해요.</p></div></li>
          </ol>
        </section>

        <footer className="landing-footer"><Link to="/privacy">개인정보 및 저장 안내</Link><span>화면 속 색감은 실제 합금과 다를 수 있어요.</span></footer>
      </div>
      <ConfirmSheet
        open={fullConfirm}
        title="64강으로 자세히 골라볼까요?"
        body="총 63번 선택하며 약 5분 정도 걸려요. 진행 상황은 이 기기에 자동 저장됩니다."
        confirmLabel="64강 시작"
        onConfirm={full}
        onCancel={() => setFullConfirm(false)}
      />
    </MobileShell>
  );
}
