import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ComparisonStage } from '../components/wedding-band/ComparisonStage';
import { MobileShell } from '../components/wedding-band/MobileShell';
import { ProgressHeader } from '../components/wedding-band/ProgressHeader';
import { RingViewToggle } from '../components/wedding-band/RingViewToggle';
import { RingZoomViewer } from '../components/wedding-band/RingZoomViewer';
import { Toast } from '../components/wedding-band/Toast';
import { candidateById, candidates, copy, diagnosticAssetById, diagnosticQuestions } from '../data/wedding-band';
import { currentPair, totalMatchesForRound, tournamentWinner } from '../features/wedding-band/bracketEngine';
import { combineProfiles, scoreDiagnostic, scoreTournament } from '../features/wedding-band/preferenceEngine';
import { buildResult } from '../features/wedding-band/resultBuilder';
import { useWeddingBandSession } from '../features/wedding-band/sessionContext';
import { track } from '../features/wedding-band/analytics';
import type { DiagnosticChoice, RingView, WeddingBandAssets } from '../types/weddingBand';
import './play.css';

interface ZoomState { assets: WeddingBandAssets | { image384: string; image768: string; fallback: string }; alt: string }

export function PlayPage() {
  const navigate = useNavigate();
  const { session, toast, answerDiagnostic, undoDiagnostic, beginQuickTournament, chooseWinner, undoMatch, finish } = useWeddingBandSession();
  const [selected, setSelected] = useState<'a' | 'b' | 'neutral'>();
  const [locked, setLocked] = useState(false);
  const [view, setView] = useState<RingView>('pack');
  const [zoom, setZoom] = useState<ZoomState>();
  const [roundNotice, setRoundNotice] = useState<string>();
  const previousRound = useRef<number>();
  const finalizing = useRef(false);
  const startedAt = useRef(Date.now());

  useEffect(() => { startedAt.current = Date.now(); }, [session?.diagnostic?.index, session?.tournament.currentMatchIndex, session?.tournament.roundSize]);

  useEffect(() => {
    if (session?.phase !== 'selecting') return;
    const timer = window.setTimeout(beginQuickTournament, 720);
    return () => window.clearTimeout(timer);
  }, [session?.phase, beginQuickTournament]);

  const winnerId = session ? tournamentWinner(session.tournament) : undefined;
  useEffect(() => {
    if (!session || session.phase !== 'tournament' || !winnerId || finalizing.current) return;
    const winner = candidateById.get(winnerId);
    if (!winner) return;
    finalizing.current = true;
    const tournamentProfile = scoreTournament(session.tournament.history, candidateById);
    const diagnosticProfile = session.mode === 'quick' && session.diagnostic ? scoreDiagnostic(session.diagnostic.answers) : undefined;
    const profile = combineProfiles(diagnosticProfile, tournamentProfile, session.mode, winner);
    finish(buildResult(profile, winner, candidates, session.mode));
    navigate('/result', { replace: true });
  }, [session, winnerId, finish, navigate]);

  useEffect(() => {
    if (!session || session.phase !== 'tournament') return;
    const current = session.tournament.roundSize;
    if (previousRound.current && current < previousRound.current) {
      setRoundNotice(`${current}강 진출`);
      const timer = window.setTimeout(() => setRoundNotice(undefined), 720);
      previousRound.current = current;
      return () => window.clearTimeout(timer);
    }
    previousRound.current = current;
    track('round_start', { mode: session.mode, roundSize: current });
  }, [session?.tournament.roundSize, session?.phase, session?.mode]);

  useEffect(() => {
    if (!session || session.phase !== 'tournament') return;
    const start = session.tournament.currentMatchIndex * 2 + 2;
    session.tournament.currentRoundIds.slice(start, start + 2).forEach((id) => {
      const candidate = candidateById.get(id);
      if (candidate) {
        const image = new Image();
        image.src = candidate.assets.pack384;
      }
    });
  }, [session?.tournament.currentMatchIndex, session?.tournament.currentRoundIds, session?.phase]);

  if (!session) return <Navigate to="/" replace />;
  if (session.phase === 'result') return <Navigate to="/result" replace />;

  function pickDiagnostic(choice: DiagnosticChoice) {
    if (locked) return;
    const question = session.diagnostic ? diagnosticQuestions[session.diagnostic.index] : undefined;
    track('diagnostic_answer', { questionId: question?.id, selected: choice, latencyMs: Date.now() - startedAt.current });
    setLocked(true);
    setSelected(choice);
    window.setTimeout(() => {
      answerDiagnostic(choice);
      setSelected(undefined);
      setLocked(false);
    }, 180);
  }

  if (session.phase === 'selecting') {
    return (
      <MobileShell><div className="page analysis-page">
        <div className="analysis-mark" aria-hidden="true"><span>◇</span><span>◇</span><span>◇</span></div>
        <p className="eyebrow">18개 선택 완료</p>
        <h1>내 취향에 가까운<br />16개를 고르는 중이에요</h1>
        <p>한쪽 스타일로만 몰리지 않도록<br />새로운 후보도 조금 섞어볼게요.</p>
        <div className="analysis-progress" aria-label="후보 분석 중"><span /></div>
      </div></MobileShell>
    );
  }

  if (session.phase === 'diagnostic' && session.diagnostic) {
    const question = diagnosticQuestions[session.diagnostic.index];
    const a = question ? diagnosticAssetById.get(question.assetA) : undefined;
    const b = question ? diagnosticAssetById.get(question.assetB) : undefined;
    if (!question || !a || !b) return <Navigate to="/" replace />;
    return (
      <MobileShell><div className="page has-sticky-header play-page">
        <ProgressHeader title={copy.diagnostic.title} current={session.diagnostic.index + 1} total={diagnosticQuestions.length} onBack={session.diagnostic.index ? undoDiagnostic : () => navigate('/')} />
        <section className="question-copy"><p>{question.prompt}</p>{session.diagnostic.index === 0 && <span>{copy.diagnostic.tip}</span>}</section>
        <ComparisonStage
          a={{ assets: a.assets, alt: '위 웨딩밴드 비교 이미지' }}
          b={{ assets: b.assets, alt: '아래 웨딩밴드 비교 이미지' }}
          view="pack"
          onA={() => pickDiagnostic('a')}
          onB={() => pickDiagnostic('b')}
          onZoomA={() => setZoom({ assets: a.assets, alt: '위 웨딩밴드 확대 이미지' })}
          onZoomB={() => setZoom({ assets: b.assets, alt: '아래 웨딩밴드 확대 이미지' })}
          selected={selected === 'a' || selected === 'b' ? selected : undefined}
          disabled={locked}
        />
        <button className={`neutral-button ${selected === 'neutral' ? 'is-selected' : ''}`} type="button" disabled={locked} onClick={() => pickDiagnostic('neutral')}>{selected === 'neutral' ? '✓ ' : ''}{copy.diagnostic.neutral}</button>
        <p className="comparison-note">{copy.diagnostic.note}</p>
        <RingZoomViewer open={Boolean(zoom)} assets={zoom?.assets} alt={zoom?.alt ?? ''} onClose={() => setZoom(undefined)} />
        <Toast message={toast} />
      </div></MobileShell>
    );
  }

  if (winnerId) {
    return <MobileShell><div className="page analysis-page"><div className="analysis-mark" aria-hidden="true"><span>◇</span><span>◇</span><span>◇</span></div><p className="eyebrow">FINAL PICK</p><h1>내 웨딩밴드 취향을<br />정리하고 있어요</h1></div></MobileShell>;
  }

  const [leftId, rightId] = currentPair(session.tournament);
  const left = leftId ? candidateById.get(leftId) : undefined;
  const right = rightId ? candidateById.get(rightId) : undefined;
  if (!left || !right) return <Navigate to="/" replace />;
  const roundMatches = totalMatchesForRound(session.tournament.roundSize);
  const currentMatch = Math.min(session.tournament.currentMatchIndex + 1, roundMatches);

  function pickTournament(id: string, side: 'a' | 'b') {
    if (locked) return;
    track('match_answer', { mode: session.mode, roundSize: session.tournament.roundSize, matchIndex: session.tournament.currentMatchIndex, view });
    setLocked(true);
    setSelected(side);
    window.setTimeout(() => {
      chooseWinner(id);
      setSelected(undefined);
      setLocked(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 180);
  }

  return (
    <MobileShell><div className="page has-sticky-header play-page">
      <ProgressHeader title={`${session.tournament.roundSize}강`} current={currentMatch} total={roundMatches} onBack={session.tournament.history.length ? undoMatch : () => navigate('/')} />
      <section className="tournament-intro"><p>{copy.tournament.helper}</p><RingViewToggle value={view} onChange={setView} /></section>
      <ComparisonStage
        a={{ assets: left.assets, alt: `위 후보 웨딩밴드 ${view === 'pack' ? '단독' : '착용'} 이미지` }}
        b={{ assets: right.assets, alt: `아래 후보 웨딩밴드 ${view === 'pack' ? '단독' : '착용'} 이미지` }}
        view={view}
        onA={() => pickTournament(left.id, 'a')}
        onB={() => pickTournament(right.id, 'b')}
        onZoomA={() => setZoom({ assets: left.assets, alt: '위 후보 웨딩밴드 확대 이미지' })}
        onZoomB={() => setZoom({ assets: right.assets, alt: '아래 후보 웨딩밴드 확대 이미지' })}
        selected={selected === 'a' || selected === 'b' ? selected : undefined}
        disabled={locked}
      />
      <p className="comparison-note">제품명과 가격 대신 실제로 매일 낄 모습을 떠올려보세요.</p>
      {roundNotice && <div className="round-notice" role="status"><span>◇</span><strong>{roundNotice}</strong></div>}
      <RingZoomViewer open={Boolean(zoom)} assets={zoom?.assets} initialView={view} alt={zoom?.alt ?? ''} onClose={() => setZoom(undefined)} />
      <Toast message={toast} />
    </div></MobileShell>
  );
}
