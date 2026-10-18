import { TOTAL_LEVELS } from './state';

export const TEXT = {
  title: 'סיימון',
  start: 'התחל',
  newGame: 'משחק חדש',
  gameOver: 'המשחק נגמר',
  won: 'ניצחת!',
  reachedLevel: 'הגעת לשלב',
  yourScore: 'הניקוד שלך',
  mute: 'השתק צלילים',
  unmute: 'הפעל צלילים',
} as const;

export function formatLevel(level: number): string {
  return `שלב ${level} מתוך ${TOTAL_LEVELS}`;
}

export function formatScore(score: number): string {
  return `ניקוד: ${score}`;
}
