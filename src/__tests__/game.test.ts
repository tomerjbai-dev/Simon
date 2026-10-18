import { describe, expect, it } from 'vitest';
import {
  abandonGame,
  advanceLevel,
  closeAbout,
  finishPresenting,
  isGameActive,
  openAbout,
  pressColor,
  startGame,
  toggleMute,
} from '../game';
import { createHighScoreStore, HIGH_SCORE_KEY } from '../highScore';
import { COLORS, createInitialState, type Color, type GameState } from '../state';

function rngFrom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

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

  it('wins on the last correct press of level 10 and adds 10 points', () => {
    const sequence: Color[] = [
      'red',
      'red',
      'blue',
      'green',
      'yellow',
      'red',
      'blue',
      'blue',
      'green',
      'red',
    ];
    let state: GameState = { ...inputState(sequence), score: 45 };
    let result = '';
    for (const color of sequence) ({ state, result } = pressColor(state, color));
    expect(result).toBe('won');
    expect(state.phase).toBe('won');
    expect(state.score).toBe(55);
    expect(pressColor(state, 'red').result).toBe('ignored');
  });

  it('ignores presses after losing', () => {
    const { state } = pressColor(inputState(['red', 'blue']), 'green');
    expect(pressColor(state, 'red').result).toBe('ignored');
  });
});

describe('advanceLevel', () => {
  function successAt(level: number, score: number): GameState {
    const sequence = Array<Color>(level).fill('red');
    return {
      ...inputState(sequence),
      phase: 'stageSuccess',
      nextInputIndex: level,
      score,
    };
  }

  it('moves to the next level with a sequence of that length', () => {
    const next = advanceLevel(successAt(3, 6));
    expect(next.phase).toBe('presenting');
    expect(next.level).toBe(4);
    expect(next.sequence).toHaveLength(4);
    expect(next.nextInputIndex).toBe(0);
    expect(next.score).toBe(6);
  });

  it('draws a brand-new sequence instead of extending the previous one', () => {
    // Previous sequence is all red; the new one comes only from the random source
    const next = advanceLevel(successAt(2, 3), rngFrom([0, 0.75, 0.5]));
    expect(next.sequence).toEqual(['green', 'blue', 'yellow']);
  });

  it('allows repeats and uses only the four colors', () => {
    expect(advanceLevel(successAt(4, 10), () => 0.6).sequence).toEqual([
      'yellow',
      'yellow',
      'yellow',
      'yellow',
      'yellow',
    ]);
    for (const color of advanceLevel(successAt(9, 45)).sequence) {
      expect(COLORS).toContain(color);
    }
  });

  it('keeps the game run id', () => {
    const state = successAt(5, 15);
    expect(advanceLevel(state).runId).toBe(state.runId);
  });

  it.each(['idle', 'presenting', 'input', 'lost', 'won'] as const)(
    'does nothing while %s',
    (phase) => {
      const state = { ...successAt(3, 6), phase };
      expect(advanceLevel(state)).toBe(state);
    },
  );

  it('never goes past level 10', () => {
    const state = successAt(10, 55);
    expect(advanceLevel(state)).toBe(state);
  });
});

describe('full game', () => {
  // Plays a game, answering correctly until the given level (if any) where it presses wrong
  function play(failAtLevel?: number): {
    state: GameState;
    levelsSeen: number[];
  } {
    let state = startGame(createInitialState());
    const levelsSeen: number[] = [];
    while (state.phase === 'presenting') {
      levelsSeen.push(state.level);
      expect(state.sequence).toHaveLength(state.level);
      state = finishPresenting(state, state.runId);
      for (const color of state.sequence) {
        const press = state.level === failAtLevel ? COLORS.find((c) => c !== color)! : color;
        state = pressColor(state, press).state;
        if (state.phase === 'lost') break;
      }
      state = advanceLevel(state);
    }
    return { state, levelsSeen };
  }

  it('has exactly 10 levels and ends with a win worth 55 points', () => {
    const { state, levelsSeen } = play();
    expect(levelsSeen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(state.phase).toBe('won');
    expect(state.score).toBe(55);
  });

  it('keeps only the points of completed levels after a mistake', () => {
    const { state } = play(4);
    expect(state.phase).toBe('lost');
    expect(state.level).toBe(4);
    expect(state.score).toBe(1 + 2 + 3);
  });

  it('can start a new game after winning', () => {
    const { state } = play();
    const next = startGame(state);
    expect(next.phase).toBe('presenting');
    expect(next.level).toBe(1);
    expect(next.score).toBe(0);
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

describe('abandonGame', () => {
  const active: GameState = {
    ...createInitialState(),
    phase: 'input',
    level: 4,
    sequence: ['red', 'red', 'blue', 'green'],
    nextInputIndex: 2,
    score: 6,
    muted: true,
    runId: 3,
  };

  it.each(['presenting', 'input', 'stageSuccess', 'lost', 'won'] as const)(
    'returns to the start state from %s',
    (phase) => {
      const state = abandonGame({ ...active, phase });
      expect(state.phase).toBe('idle');
      expect(state.level).toBe(0);
      expect(state.score).toBe(0);
      expect(state.sequence).toEqual([]);
      expect(state.nextInputIndex).toBe(0);
      expect(state.runId).toBe(4);
      expect(state.muted).toBe(true);
    },
  );

  it('leaves an idle state unchanged', () => {
    const idle = createInitialState();
    expect(abandonGame(idle)).toBe(idle);
  });

  it('invalidates callbacks of the cancelled game', () => {
    const presenting = { ...active, phase: 'presenting' as const };
    const cancelled = abandonGame(presenting);
    expect(finishPresenting(cancelled, presenting.runId)).toBe(cancelled);
    expect(advanceLevel(cancelled)).toBe(cancelled);
    expect(pressColor(cancelled, 'red').result).toBe('ignored');
  });
});

describe('isGameActive', () => {
  it('is true only while a game is in progress', () => {
    const base = createInitialState();
    expect(isGameActive(base)).toBe(false);
    expect(isGameActive({ ...base, phase: 'presenting' })).toBe(true);
    expect(isGameActive({ ...base, phase: 'input' })).toBe(true);
    expect(isGameActive({ ...base, phase: 'stageSuccess' })).toBe(true);
    expect(isGameActive({ ...base, phase: 'lost' })).toBe(false);
    expect(isGameActive({ ...base, phase: 'won' })).toBe(false);
  });
});

describe('about navigation', () => {
  it('opening about mid-game cancels the game', () => {
    const playing = inputState(['green', 'blue']);
    const state = openAbout({ ...playing, score: 3 });
    expect(state.screen).toBe('about');
    expect(state.phase).toBe('idle');
    expect(state.score).toBe(0);
    expect(state.runId).toBe(playing.runId + 1);
  });

  it('returning from about shows the start state', () => {
    const state = closeAbout(openAbout(inputState(['red'])));
    expect(state.screen).toBe('home');
    expect(state.phase).toBe('idle');
    expect(state.level).toBe(0);
  });

  it('leaving mid-game never changes the high score', () => {
    const data = new Map<string, string>([[HIGH_SCORE_KEY, '10']]);
    const store = createHighScoreStore({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => void data.set(key, value),
    });
    // A game worth more than the record is cancelled before it ends
    const playing = { ...inputState(Array<Color>(10).fill('red')), score: 45 };
    abandonGame(playing);
    openAbout(playing);
    expect(store.get()).toBe(10);
    expect(data.get(HIGH_SCORE_KEY)).toBe('10');
  });
});
