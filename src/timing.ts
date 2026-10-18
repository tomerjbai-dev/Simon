import { TOTAL_LEVELS } from './state';

export const PRE_PLAYBACK_DELAY = 600;
export const GAP_BETWEEN_FLASHES = 250;
export const PRESS_FLASH = 250;
export const SUCCESS_FEEDBACK = 700;
export const LOSS_REVEAL_DELAY = 300;
export const WIN_REVEAL_DELAY = 700;

const FIRST_LEVEL_FLASH = 1000;
const LAST_LEVEL_FLASH = 400;

// Linear interpolation: 1000ms at level 1 down to 400ms at level 10
export function flashDurationForLevel(level: number): number {
  const step = (FIRST_LEVEL_FLASH - LAST_LEVEL_FLASH) / (TOTAL_LEVELS - 1);
  return Math.round(FIRST_LEVEL_FLASH - (level - 1) * step);
}
