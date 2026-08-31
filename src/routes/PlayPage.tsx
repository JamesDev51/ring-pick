import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ComparisonGrid } from '../components/ring/ComparisonGrid';
import { MobileShell } from '../components/ring/MobileShell';
import { ProgressHeader } from '../components/ring/ProgressHeader';
import { Toast } from '../components/ring/Toast';
import { copy, diagnosticAssetById, questions, ringById, rings } from '../data/ring';
import { buildResult } from '../features/ring/resultBuilder';
import { combineScores, scoreDiagnostic, scoreTournament } from '../features/ring/preferenceEngine';
import { currentPair, totalMatchesForRound, tournamentWinner } from '../features/ring/bracketEngine';
import { useRingSession } from '../features/ring/sessionContext';
import { track } from '../features/ring/analytics';
import type { DiagnosticChoice } from '../types/ring';
import './play.css';

export function PlayPage() {
  const nav = useNavigate();
  const { state, answer, undoDiagnostic, beginQuickTournament, chooseWinner, undoMatch, finish, toast } = useRingSession();
  const session = state.session;
  const [selected, setSelected] = useState<'a'|'b'|'neutral'>();
  const [locked, setLocked] = useState(false);
  const [transition, setTransition] = useState<string>();
  const previousRound = useRef<number | undefined>(undefined);
  const finishing = useRef(false);
  const questionStartedAt = useRef(Date.now());

  useEffect(() => { questionStartedAt.current=Date.now(); }, [session?.diagnostic?.index, session?.tournament.currentMatchIndex, session?.tournament.roundSize]);

  useEffect(() => {
    if (session?.phase === 'diagnostic' && session.diagnostic?.index === questions.length) beginQuickTournament();
  }, [session?.phase, session?.diagnostic?.index, beginQuickTournament]);

  const winnerId = session ? tournamentWinner(session.tournament) : undefined;
  useEffect(() => {
    if (!session || session.phase !== 'tournament' || !winnerId || finishing.current) return;
    const winner = ringById.get(winnerId);
    if (!winner) return;
    finishing.current = true;
    const tournamentScores = scoreTournament(session.tournament.history);
    const diagnosticScores = session.mode === 'quick' && session.diagnostic ? scoreDiagnostic(session.diagnostic.answers) : undefined;
    const combined = combineScores(diagnosticScores, tournamentScores, winner, session.mode);
    finish(buildResult(combined, winner, rings));
    nav('/result', { replace: true });
  }, [session, winnerId, finish, nav]);

  useEffect(() => {
    if (!session || session.phase !== 'tournament') return;
    const current = session.tournament.roundSize;
    if (previousRound.current && current < previousRound.current) {
      setTransition(`${current}강 진출`);
      const timer = window.setTimeout(() => setTransition(undefined), 520);
      previousRound.current = current;
      return () => window.clearTimeout(timer);
    }
    previousRound.current = current;
    track('round_start',{mode:session.mode,roundSize:current});
  }, [session]);

  useEffect(() => {
    if (!session || session.phase !== 'tournament') return;
    const nextIndex = session.tournament.currentMatchIndex * 2 + 2;
    session.tournament.currentRoundIds.slice(nextIndex, nextIndex + 2).forEach((id) => {
      const ring = ringById.get(id);
      if (ring) { const image = new Image(); image.src = ring.assets.packshot; }
    });
  }, [session]);

  if (!session) return <Navigate to="/" replace />;
  if (session.phase === 'result') return <Navigate to="/result" replace />;

  function pickDiagnostic(choice: DiagnosticChoice) {
    if (locked) return;
    const q=session?.diagnostic ? questions[session.diagnostic.index] : undefined;
    track('diagnostic_answer',{questionId:q?.id,selected:choice,latencyBucket:Math.min(5,Math.floor((Date.now()-questionStartedAt.current)/1000))});
    setLocked(true); setSelected(choice);
    window.setTimeout(() => { answer(choice); setSelected(undefined); setLocked(false); }, 190);
  }

  if (session.phase === 'diagnostic' && session.diagnostic) {
    const question = questions[session.diagnostic.index];
    if (!question) return null;
    const assetA = diagnosticAssetById.get(question.assetA);
    const assetB = diagnosticAssetById.get(question.assetB);
    if (!assetA || !assetB) return <Navigate to="/" replace />;
    return <MobileShell><div className="page has-sticky-header play-page">
      <ProgressHeader title="취향 탐색" current={session.diagnostic.index + 1} total={questions.length} onBack={session.diagnostic.index > 0 && !locked ? undoDiagnostic : () => nav('/')} />
      <section className="question-head"><p>{question.prompt}</p>{session.diagnostic.index === 0 && <span>{copy.diagnostic.tip}</span>}</section>
      <ComparisonGrid a={{src:assetA.src,attributes:assetA.attributes}} b={{src:assetB.src,attributes:assetB.attributes}} onA={() => pickDiagnostic('a')} onB={() => pickDiagnostic('b')} selected={selected === 'a' ? 'a' : selected === 'b' ? 'b' : undefined} disabled={locked} />
      <button className={`neutral-choice ${selected === 'neutral' ? 'selected' : ''}`} type="button" disabled={locked} onClick={() => pickDiagnostic('neutral')}>{selected === 'neutral' ? '✓ ' : ''}{copy.diagnostic.neutral}</button>
      <p className="comparison-note">지금 질문의 한 가지 차이만 보고 골라주세요.</p><Toast message={toast}/>
    </div></MobileShell>;
  }

  const [leftId, rightId] = currentPair(session.tournament);
  if (!leftId || !rightId) return <Navigate to="/" replace />;
  const left = ringById.get(leftId); const right = ringById.get(rightId);
  if (!left || !right) return <Navigate to="/" replace />;
  const roundMatches = totalMatchesForRound(session.tournament.roundSize);
  const pickTournament = (id:string, side:'a'|'b') => {
    if (locked) return;
    track('match_answer',{mode:session.mode,roundSize:session.tournament.roundSize,matchIndex:session.tournament.currentMatchIndex});
    setLocked(true); setSelected(side);
    window.setTimeout(() => { chooseWinner(id); setSelected(undefined); setLocked(false); }, 190);
  };

  return <MobileShell><div className="page has-sticky-header play-page">
    <ProgressHeader title={`${session.tournament.roundSize}강`} current={Math.min(session.tournament.currentMatchIndex + 1, roundMatches)} total={roundMatches} onBack={session.tournament.history.length ? undoMatch : () => nav('/')} />
    <section className="question-head tournament-head"><p>{copy.tournament.helper}</p></section>
    <ComparisonGrid a={{src:left.assets.packshot,attributes:left.attributes}} b={{src:right.assets.packshot,attributes:right.attributes}} onA={() => pickTournament(left.id,'a')} onB={() => pickTournament(right.id,'b')} selected={selected === 'a' ? 'a' : selected === 'b' ? 'b' : undefined} disabled={locked}/>
    <p className="comparison-note">제품명이나 가격 대신 전체 인상만 보고 골라보세요.</p>
    {transition && <div className="round-transition" role="status"><span>◇</span><strong>{transition}</strong></div>}
    <Toast message={toast}/>
  </div></MobileShell>;
}
