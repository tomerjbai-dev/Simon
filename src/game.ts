import { generateSequence, type Rng } from './sequence';
import { TOTAL_LEVELS, type Color, type GameState } from './state';

export type PressResult = 'ignored' | 'correct' | 'stageComplete' | 'won' | 'wrong';

export function startGame(state: GameState, rng?: Rng): GameState {
  return {
    ...state,
    phase: 'presenting',
    level: 1,
    score: 0,
    sequence: generateSequence(1, rng),
    nextInputIndex: 0,
    runId: state.runId + 1,
  };
}

export function finishPresenting(state: GameState, runId: number): GameState {
  if (state.phase !== 'presenting' || state.runId !== runId) return state;
  return { ...state, phase: 'input', nextInputIndex: 0 };
}

export function pressColor(
  state: GameState,
  color: Color,
): { state: GameState; result: PressResult } {
  if (state.phase !== 'input') return { state, result: 'ignored' };

  if (color !== state.sequence[state.nextInputIndex]) {
    // Level stays at the level where the mistake happened; no points for it
    return { state: { ...state, phase: 'lost' }, result: 'wrong' };
  }

  const nextInputIndex = state.nextInputIndex + 1;
  if (nextInputIndex < state.sequence.length) {
    return { state: { ...state, nextInputIndex }, result: 'correct' };
  }

  const score = state.score + state.level;
  if (state.level >= TOTAL_LEVELS) {
    return { state: { ...state, nextInputIndex, phase: 'won', score }, result: 'won' };
  }
  return {
    state: { ...state, nextInputIndex, phase: 'stageSuccess', score },
    result: 'stageComplete',
  };
}

// Moves to the next level with a brand-new sequence; never goes past the last level.
// runId identifies the game, not the level, so it stays the same.
export function advanceLevel(state: GameState, rng?: Rng): GameState {
  if (state.phase !== 'stageSuccess' || state.level >= TOTAL_LEVELS) return state;
  const level = state.level + 1;
  return {
    ...state,
    phase: 'presenting',
    level,
    sequence: generateSequence(level, rng),
    nextInputIndex: 0,
  };
}

export function toggleMute(state: GameState): GameState {
  return { ...state, muted: !state.muted };
}
