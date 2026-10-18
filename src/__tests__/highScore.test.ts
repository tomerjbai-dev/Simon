import { describe, expect, it } from 'vitest';
import { createHighScoreStore, HIGH_SCORE_KEY, MAX_SCORE, type StorageLike } from '../highScore';

function fakeStorage(initial?: string): StorageLike & { data: Map<string, string>; writes: number } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(HIGH_SCORE_KEY, initial);
  return {
    data,
    writes: 0,
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      this.writes++;
      data.set(key, value);
    },
  };
}

const throwing: StorageLike = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new Error('blocked');
  },
};

describe('high score reading', () => {
  it('is 0 when nothing is saved', () => {
    expect(createHighScoreStore(fakeStorage()).get()).toBe(0);
  });

  it('reads a valid saved score', () => {
    expect(createHighScoreStore(fakeStorage('21')).get()).toBe(21);
    expect(createHighScoreStore(fakeStorage('55')).get()).toBe(55);
  });

  it.each(['abc', '3.5', '-1', '56', '', ' 7', '1e1'])('treats corrupt value %j as 0', (raw) => {
    expect(createHighScoreStore(fakeStorage(raw)).get()).toBe(0);
  });

  it('max score is 55', () => {
    expect(MAX_SCORE).toBe(55);
  });
});

describe('high score recording', () => {
  it('saves a first record as an integer string under the versioned key', () => {
    const storage = fakeStorage();
    const store = createHighScoreStore(storage);
    expect(store.record(6)).toBe(6);
    expect(storage.data.get('simon.highScore.v1')).toBe('6');
    expect(store.get()).toBe(6);
  });

  it('replaces the record only with a higher score', () => {
    const storage = fakeStorage('10');
    const store = createHighScoreStore(storage);
    expect(store.record(15)).toBe(15);
    expect(storage.data.get(HIGH_SCORE_KEY)).toBe('15');
  });

  it('never overwrites with a lower or equal score', () => {
    const storage = fakeStorage('15');
    const store = createHighScoreStore(storage);
    expect(store.record(3)).toBe(15);
    expect(store.record(15)).toBe(15);
    expect(storage.writes).toBe(0);
    expect(storage.data.get(HIGH_SCORE_KEY)).toBe('15');
  });

  it('does not save a score of 0', () => {
    const storage = fakeStorage();
    createHighScoreStore(storage).record(0);
    expect(storage.writes).toBe(0);
  });

  it('overwrites a corrupt value with a real score', () => {
    const storage = fakeStorage('garbage');
    createHighScoreStore(storage).record(1);
    expect(storage.data.get(HIGH_SCORE_KEY)).toBe('1');
  });

  it('ignores invalid scores', () => {
    const storage = fakeStorage();
    const store = createHighScoreStore(storage);
    store.record(99);
    store.record(2.5);
    expect(storage.writes).toBe(0);
    expect(store.get()).toBe(0);
  });
});

describe('unavailable storage', () => {
  it('does not crash when storage throws, and keeps the record in memory', () => {
    const store = createHighScoreStore(throwing);
    expect(store.get()).toBe(0);
    expect(() => store.record(10)).not.toThrow();
    expect(store.get()).toBe(10);
  });

  it('works without any storage for the current page load', () => {
    const store = createHighScoreStore(null);
    expect(store.get()).toBe(0);
    store.record(28);
    expect(store.get()).toBe(28);
    store.record(5);
    expect(store.get()).toBe(28);
  });
});
