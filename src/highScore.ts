import { TOTAL_LEVELS } from './state';

export const HIGH_SCORE_KEY = 'simon.highScore.v1';

// 1 + 2 + ... + 10
export const MAX_SCORE = (TOTAL_LEVELS * (TOTAL_LEVELS + 1)) / 2;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export type HighScoreStore = {
  get: () => number;
  // Saves score only if it beats the current best; returns the best score
  record: (score: number) => number;
};

function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_SCORE;
}

function parseScore(raw: string | null): number {
  if (raw === null || !/^\d+$/.test(raw)) return 0;
  const value = Number(raw);
  return isValidScore(value) ? value : 0;
}

// Even reading window.localStorage can throw (e.g. blocked site data)
export function getLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// Storage failures never break the game. The in-memory copy keeps the best
// score visible for the current page load when storage is unavailable.
export function createHighScoreStore(storage: StorageLike | null): HighScoreStore {
  let memory = 0;

  function readStored(): number {
    if (!storage) return 0;
    try {
      return parseScore(storage.getItem(HIGH_SCORE_KEY));
    } catch {
      return 0;
    }
  }

  function get(): number {
    return Math.max(readStored(), memory);
  }

  return {
    get,

    record(score) {
      const best = get();
      if (!isValidScore(score) || score <= best) return best;
      memory = score;
      try {
        storage?.setItem(HIGH_SCORE_KEY, String(score));
      } catch {
        // Ignore: the in-memory copy still shows it until reload
      }
      return score;
    },
  };
}
