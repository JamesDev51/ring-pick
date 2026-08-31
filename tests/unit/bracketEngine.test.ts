import { describe, expect, it } from 'vitest';
import { candidateById, candidates } from '../../src/data/wedding-band';
import { chooseTournamentWinner, createTournament, currentPair, tournamentWinner, undoTournamentChoice } from '../../src/features/wedding-band/bracketEngine';

describe('tournament engine', () => {
  it('finishes a 64 bracket after exactly 63 choices', () => {
    let state = createTournament(candidates.map((item) => item.id), 99, candidateById);
    for (let index = 0; index < 63; index += 1) {
      const [left] = currentPair(state);
      expect(left).toBeTruthy();
      state = chooseTournamentWinner(state, left!);
    }
    expect(state.history).toHaveLength(63);
    expect(tournamentWinner(state)).toBeTruthy();
  });

  it('undoes safely across round boundaries', () => {
    let state = createTournament(candidates.slice(0, 4).map((item) => item.id), 11, candidateById);
    for (let index = 0; index < 2; index += 1) state = chooseTournamentWinner(state, currentPair(state)[0]!);
    expect(state.roundSize).toBe(2);
    state = undoTournamentChoice(state);
    expect(state.roundSize).toBe(4);
    expect(state.currentMatchIndex).toBe(1);
    expect(state.history).toHaveLength(1);
  });
});
