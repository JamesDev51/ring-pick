import type { TournamentMatch, TournamentSnapshot, TournamentState, WeddingBandCandidate } from '../../types/weddingBand';
import { attributeDistance } from './preferenceEngine';
import { seededShuffle } from './prng';

export function totalMatchesForRound(roundSize: number) {
  return Math.max(1, roundSize / 2);
}

export function buildFirstRound(ids: string[], seed: number, lookup: Map<string, WeddingBandCandidate>) {
  const shuffled = seededShuffle(ids, seed);
  const remaining = [...shuffled];
  const paired: string[] = [];
  while (remaining.length) {
    const left = remaining.shift()!;
    const leftCandidate = lookup.get(left);
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let index = 0; index < remaining.length; index += 1) {
      const rightCandidate = lookup.get(remaining[index]);
      if (!leftCandidate || !rightCandidate) continue;
      const differentFamily = leftCandidate.family !== rightCandidate.family ? 1 : 0;
      const score = differentFamily * 2 + attributeDistance(leftCandidate.attributes, rightCandidate.attributes);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    const right = remaining.splice(bestIndex, 1)[0];
    paired.push(left, right);
  }
  return paired;
}

export function createTournament(ids: string[], seed: number, lookup: Map<string, WeddingBandCandidate>): TournamentState {
  return {
    roundSize: ids.length,
    currentRoundIds: buildFirstRound(ids, seed, lookup),
    currentMatchIndex: 0,
    nextRoundIds: [],
    history: [],
    undoStack: [],
  };
}

export function currentPair(state: TournamentState): [string | undefined, string | undefined] {
  const index = state.currentMatchIndex * 2;
  return [state.currentRoundIds[index], state.currentRoundIds[index + 1]];
}

export function chooseTournamentWinner(state: TournamentState, winnerId: string): TournamentState {
  const [leftId, rightId] = currentPair(state);
  if (!leftId || !rightId || (winnerId !== leftId && winnerId !== rightId)) return state;
  const snapshot: TournamentSnapshot = {
    roundSize: state.roundSize,
    currentRoundIds: [...state.currentRoundIds],
    currentMatchIndex: state.currentMatchIndex,
    nextRoundIds: [...state.nextRoundIds],
  };
  const match: TournamentMatch = {
    roundSize: state.roundSize,
    matchIndex: state.currentMatchIndex,
    leftId,
    rightId,
    winnerId,
    loserId: winnerId === leftId ? rightId : leftId,
    answeredAt: new Date().toISOString(),
  };
  const nextRoundIds = [...state.nextRoundIds, winnerId];
  const lastMatch = state.currentMatchIndex + 1 >= totalMatchesForRound(state.roundSize);
  if (!lastMatch) {
    return {
      ...state,
      currentMatchIndex: state.currentMatchIndex + 1,
      nextRoundIds,
      history: [...state.history, match],
      undoStack: [...state.undoStack, snapshot],
    };
  }
  if (nextRoundIds.length === 1) {
    return {
      ...state,
      currentMatchIndex: state.currentMatchIndex + 1,
      nextRoundIds,
      history: [...state.history, match],
      undoStack: [...state.undoStack, snapshot],
    };
  }
  return {
    roundSize: nextRoundIds.length,
    currentRoundIds: nextRoundIds,
    currentMatchIndex: 0,
    nextRoundIds: [],
    history: [...state.history, match],
    undoStack: [...state.undoStack, snapshot],
  };
}

export function undoTournamentChoice(state: TournamentState): TournamentState {
  const snapshot = state.undoStack.at(-1);
  if (!snapshot) return state;
  return {
    ...snapshot,
    history: state.history.slice(0, -1),
    undoStack: state.undoStack.slice(0, -1),
  };
}

export function tournamentWinner(state: TournamentState) {
  if (state.roundSize !== 2 || state.history.at(-1)?.roundSize !== 2) return undefined;
  return state.history.at(-1)?.winnerId;
}
