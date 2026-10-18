export type Color = 'blue' | 'red' | 'yellow' | 'green';
export type Phase = 'idle' | 'presenting' | 'input' | 'stageSuccess' | 'lost' | 'won';
export type Screen = 'home' | 'about';

export type GameState = {
  screen: Screen;
  phase: Phase;
  level: number; // 1..10 during a game, 0 when idle
  sequence: Color[]; // length === level
  nextInputIndex: number; // 0..sequence.length
  score: number; // 0..55
  muted: boolean;
  runId: number; // guards against stale timers/callbacks
};

export const TOTAL_LEVELS = 10;

export function createInitialState(): GameState {
  return {
    screen: 'home',
    phase: 'idle',
    level: 0,
    sequence: [],
    nextInputIndex: 0,
    score: 0,
    muted: false,
    runId: 0,
  };
}
