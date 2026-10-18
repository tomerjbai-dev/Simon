import { describe, expect, it } from 'vitest';
import { finishPresenting, pressColor, startGame, toggleMute } from '../game';
import { createInitialState, type Color, type GameState } from '../state';

function inputState(sequence: Color[]): GameState {
  return { ...createInitialState(), phase: 'input', level: sequence.length, sequence, runId: 1 };
}

describe('startGame', () => {
  it('starts level 1 with score 0 and a one-color sequence', () => {
    const state = startGame(createInitialState(), () => 0.3);
    expect(state.phase).toBe('presenting');
    expect(state.level).toBe(1);
    expect(state.score).toBe(0);
    expect(state.sequence).toEqual(['red']);
    expect(state.nextInputIndex).toBe(0);
    expect(state.runId).toBe(1);
  });

  it('keeps the mute setting', () => {
    const state = startGame({ ...createInitialState(), muted: true });
    expect(state.muted).toBe(true);
  });

  it('resets a finished game and invalidates old callbacks', () => {
    const lost: GameState = { ...inputState(['red']), phase: 'lost', score: 7, level: 4 };
    const next = startGame(lost);
    expect(next.level).toBe(1);
    expect(next.score).toBe(0);
    expect(next.runId).toBe(lost.runId + 1);
    // A playback callback from the previous game must not open input
    expect(finishPresenting(next, lost.runId)).toBe(next);
  });
});

describe('finishPresenting', () => {
  it('opens input for the current run', () => {
    const state = startGame(createInitialState());
    expect(finishPresenting(state, state.runId).phase).toBe('input');
  });

  it('ignores a stale run id', () => {
    const state = startGame(createInitialState());
    expect(finishPresenting(state, state.runId - 1)).toBe(state);
  });

  it('does nothing outside of presenting', () => {
    const state = inputState(['red']);
    expect(finishPresenting(state, state.runId)).toBe(state);
  });
});

describe('pressColor', () => {
  it.each(['idle', 'presenting', 'stageSuccess', 'lost', 'won'] as const)(
    'ignores presses while %s',
    (phase) => {
      const state = { ...inputState(['red']), phase };
      const { state: next, result } = pressColor(state, 'red');
      expect(result).toBe('ignored');
      expect(next).toBe(state);
    },
  );

  it('completes level 1 on the correct color and awards 1 point', () => {
    const { state, result } = pressColor(inputState(['blue']), 'blue');
    expect(result).toBe('stageComplete');
    expect(state.phase).toBe('stageSuccess');
    expect(state.score).toBe(1);
  });

  it('ends the game on the first wrong color without points', () => {
    const { state, result } = pressColor(inputState(['blue']), 'green');
    expect(result).toBe('wrong');
    expect(state.phase).toBe('lost');
    expect(state.level).toBe(1);
    expect(state.score).toBe(0);
  });

  it('requires a separate press for each repeated color', () => {
    const first = pressColor(inputState(['red', 'red']), 'red');
    expect(first.result).toBe('correct');
    expect(first.state.phase).toBe('input');
    expect(first.state.nextInputIndex).toBe(1);

    const second = pressColor(first.state, 'red');
    expect(second.result).toBe('stageComplete');
    expect(second.state.score).toBe(2);
  });

  it('checks presses in order', () => {
    const first = pressColor(inputState(['red', 'blue']), 'red');
    const second = pressColor(first.state, 'green');
    expect(second.result).toBe('wrong');
    expect(second.state.phase).toBe('lost');
  });

  it('ignores presses after losing', () => {
    const { state } = pressColor(inputState(['red', 'blue']), 'green');
    expect(pressColor(state, 'red').result).toBe('ignored');
  });
});

describe('toggleMute', () => {
  it('only flips the mute flag', () => {
    const state = inputState(['red']);
    const muted = toggleMute(state);
    expect(muted).toEqual({ ...state, muted: true });
    expect(toggleMute(muted).muted).toBe(false);
  });
});
