import { describe, expect, it } from 'vitest';
import { COLORS, createInitialState, TOTAL_LEVELS } from '../state';
import { formatLevel, formatScore } from '../format';

describe('createInitialState', () => {
  it('starts idle on the home screen with no progress', () => {
    const state = createInitialState();
    expect(state.screen).toBe('home');
    expect(state.phase).toBe('idle');
    expect(state.level).toBe(0);
    expect(state.sequence).toEqual([]);
    expect(state.nextInputIndex).toBe(0);
    expect(state.score).toBe(0);
    expect(state.muted).toBe(false);
  });

  it('returns a fresh object each time', () => {
    const a = createInitialState();
    const b = createInitialState();
    a.sequence.push('red');
    expect(b.sequence).toEqual([]);
  });

  it('has exactly four distinct colors', () => {
    expect(new Set(COLORS).size).toBe(4);
    expect(COLORS).toHaveLength(4);
  });

  it('has exactly 10 levels', () => {
    expect(TOTAL_LEVELS).toBe(10);
  });
});

describe('format', () => {
  it('formats level and score in Hebrew', () => {
    expect(formatLevel(3)).toBe('שלב 3 מתוך 10');
    expect(formatScore(2)).toBe('ניקוד: 2');
  });
});
