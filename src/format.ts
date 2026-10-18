import { TOTAL_LEVELS } from './state';

export function formatLevel(level: number): string {
  return `שלב ${level} מתוך ${TOTAL_LEVELS}`;
}

export function formatScore(score: number): string {
  return `ניקוד: ${score}`;
}
