/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { candidateById, candidates, diagnosticQuestions, MANIFEST_VERSION } from '../../data/wedding-band';
import type {
  DiagnosticChoice,
  WeddingBandResult,
  WeddingBandSessionV2,
} from '../../types/weddingBand';
import { createTournament, chooseTournamentWinner, undoTournamentChoice } from './bracketEngine';
import { selectPersonalizedCandidates } from './candidateSelector';
import { scoreDiagnostic } from './preferenceEngine';
import { randomSeed, seededShuffle } from './prng';
import { clearLegacySession, clearSession, hasLegacySession, loadSession, saveSession } from './storage';
import { track } from './analytics';

interface State {
  session?: WeddingBandSessionV2;
  legacyNotice: boolean;
  toast?: string;
}

interface ContextValue extends State {
  startQuick: () => void;
  startFull: () => void;
  answerDiagnostic: (choice: DiagnosticChoice) => void;
  undoDiagnostic: () => void;
  beginQuickTournament: () => void;
  chooseWinner: (id: string) => void;
  undoMatch: () => void;
  finish: (result: WeddingBandResult) => void;
  reset: () => void;
  dismissLegacy: (remove?: boolean) => void;
  showToast: (message: string) => void;
}

const WeddingBandSessionContext = createContext<ContextValue | null>(null);

function emptyTournament() {
  return { roundSize: 0, currentRoundIds: [], currentMatchIndex: 0, nextRoundIds: [], history: [], undoStack: [] };
}

function campaignFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source') ?? undefined;
  const medium = params.get('utm_medium') ?? undefined;
  const name = params.get('utm_campaign') ?? undefined;
  return source || medium || name ? { source, medium, name } : undefined;
}

function makeBaseSession(mode: 'quick' | 'full'): WeddingBandSessionV2 {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    manifestVersion: MANIFEST_VERSION,
    sessionId: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `rp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    seed: randomSeed(),
    mode,
    phase: mode === 'quick' ? 'diagnostic' : 'tournament',
    diagnostic: mode === 'quick' ? { index: 0, answers: [] } : undefined,
    tournament: emptyTournament(),
    startedAt: now,
    updatedAt: now,
    campaign: campaignFromLocation(),
  };
}

export function WeddingBandSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => ({ session: loadSession(), legacyNotice: hasLegacySession() }));

  useEffect(() => {
    if (state.session) saveSession(state.session);
  }, [state.session]);

  const showToast = useCallback((message: string) => {
    setState((current) => ({ ...current, toast: message }));
    window.setTimeout(() => setState((current) => (current.toast === message ? { ...current, toast: undefined } : current)), 2200);
  }, []);

  const startQuick = useCallback(() => {
    const session = makeBaseSession('quick');
    setState((current) => ({ ...current, session }));
    track('quick_start', { source: session.campaign?.source });
  }, []);

  const startFull = useCallback(() => {
    const session = makeBaseSession('full');
    session.tournament = createTournament(
      seededShuffle(candidates.map((item) => item.id), session.seed),
      session.seed,
      candidateById,
    );
    setState((current) => ({ ...current, session }));
    track('full_start', { source: session.campaign?.source });
  }, []);

  const answerDiagnostic = useCallback((choice: DiagnosticChoice) => {
    setState((current) => {
      const session = current.session;
      if (!session?.diagnostic || session.phase !== 'diagnostic') return current;
      const question = diagnosticQuestions[session.diagnostic.index];
      if (!question) return current;
      const answers = [...session.diagnostic.answers, { questionId: question.id, choice, answeredAt: new Date().toISOString() }];
      const index = session.diagnostic.index + 1;
      return {
        ...current,
        session: {
          ...session,
          phase: index >= diagnosticQuestions.length ? 'selecting' : 'diagnostic',
          diagnostic: { index, answers },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const undoDiagnostic = useCallback(() => {
    setState((current) => {
      const session = current.session;
      if (!session?.diagnostic || !session.diagnostic.answers.length) return current;
      return {
        ...current,
        session: {
          ...session,
          phase: 'diagnostic',
          diagnostic: {
            index: Math.max(0, session.diagnostic.index - 1),
            answers: session.diagnostic.answers.slice(0, -1),
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const beginQuickTournament = useCallback(() => {
    setState((current) => {
      const session = current.session;
      if (!session?.diagnostic || session.mode !== 'quick' || session.phase !== 'selecting') return current;
      const profile = scoreDiagnostic(session.diagnostic.answers);
      const selectedCandidates = selectPersonalizedCandidates(profile, candidates, session.seed);
      return {
        ...current,
        session: {
          ...session,
          phase: 'tournament',
          selectedCandidates,
          tournament: createTournament(selectedCandidates.map((item) => item.id), session.seed + 17, candidateById),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const chooseWinner = useCallback((id: string) => {
    setState((current) => {
      const session = current.session;
      if (!session || session.phase !== 'tournament') return current;
      return {
        ...current,
        session: {
          ...session,
          tournament: chooseTournamentWinner(session.tournament, id),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const undoMatch = useCallback(() => {
    setState((current) => {
      const session = current.session;
      if (!session || session.phase !== 'tournament' || !session.tournament.history.length) return current;
      return {
        ...current,
        session: {
          ...session,
          tournament: undoTournamentChoice(session.tournament),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const finish = useCallback((result: WeddingBandResult) => {
    setState((current) => {
      if (!current.session) return current;
      return {
        ...current,
        session: { ...current.session, phase: 'result', result, updatedAt: new Date().toISOString() },
      };
    });
    track('result_view', { mode: result.mode, family: result.winnerFamily });
  }, []);

  const reset = useCallback(() => {
    clearSession();
    setState((current) => ({ ...current, session: undefined }));
    track('restart');
  }, []);

  const dismissLegacy = useCallback((remove = false) => {
    if (remove) clearLegacySession();
    setState((current) => ({ ...current, legacyNotice: false }));
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      ...state,
      startQuick,
      startFull,
      answerDiagnostic,
      undoDiagnostic,
      beginQuickTournament,
      chooseWinner,
      undoMatch,
      finish,
      reset,
      dismissLegacy,
      showToast,
    }),
    [state, startQuick, startFull, answerDiagnostic, undoDiagnostic, beginQuickTournament, chooseWinner, undoMatch, finish, reset, dismissLegacy, showToast],
  );

  return <WeddingBandSessionContext.Provider value={value}>{children}</WeddingBandSessionContext.Provider>;
}

export function useWeddingBandSession() {
  const value = useContext(WeddingBandSessionContext);
  if (!value) throw new Error('useWeddingBandSession must be used inside WeddingBandSessionProvider');
  return value;
}
