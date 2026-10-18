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
  about: 'אודות',
  back: 'חזרה למשחק',
  highScore: 'שיא אישי',
  noHighScore: 'עדיין אין שיא',
} as const;

export const ABOUT_TEXT = {
  introTitle: 'מה זה סיימון?',
  intro:
    'סיימון הוא משחק זיכרון: המשחק מציג רצף של אורות וצלילים, ועליך לחזור עליו בדיוק באותו הסדר.',
  howToTitle: 'איך משחקים',
  howTo: [
    'לוחצים על "התחל".',
    'צופים ברצף הצבעים ומקשיבים לצלילים. בזמן ההצגה אי אפשר ללחוץ.',
    'לוחצים על הצבעים באותו הסדר. אין מגבלת זמן.',
    'בכל שלב מוצג רצף חדש, ארוך בצבע אחד מהקודם ומהיר יותר.',
    'טעות אחת מסיימת את המשחק. אחרי 10 שלבים — ניצחת!',
  ],
  scoringTitle: 'ניקוד',
  scoring: [
    'כל שלב שמושלם מזכה בנקודות כמספר השלב: שלב 1 — נקודה אחת, שלב 10 — 10 נקודות.',
    'הניקוד המרבי הוא 55.',
    'השיא האישי נשמר במכשיר הזה בלבד, ומתעדכן בסיום משחק כשמשיגים ניקוד גבוה יותר.',
    'יציאה באמצע משחק (מעבר לאודות, רענון או מעבר לאפליקציה אחרת) מבטלת את המשחק בלי לשמור את הניקוד.',
  ],
} as const;

export function formatLevel(level: number): string {
  return `שלב ${level} מתוך ${TOTAL_LEVELS}`;
}

export function formatScore(score: number): string {
  return `ניקוד: ${score}`;
}

// A score of 0 is never saved as a record, so 0 means "no record yet"
export function formatHighScore(highScore: number): string {
  return highScore > 0 ? String(highScore) : TEXT.noHighScore;
}
