import type { Color } from './state';
import { GAP_BETWEEN_FLASHES, PRE_PLAYBACK_DELAY } from './timing';

export type PlaybackHooks = {
  onFlashStart: (color: Color) => void;
  onFlashEnd: (color: Color) => void;
  onDone: () => void;
};

// Schedules the whole sequence up front; the returned function cancels every pending step.
export function playSequence(
  sequence: readonly Color[],
  flashMs: number,
  hooks: PlaybackHooks,
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let at = PRE_PLAYBACK_DELAY;

  sequence.forEach((color, i) => {
    timers.push(setTimeout(() => hooks.onFlashStart(color), at));
    at += flashMs;
    timers.push(setTimeout(() => hooks.onFlashEnd(color), at));
    if (i < sequence.length - 1) at += GAP_BETWEEN_FLASHES;
  });
  timers.push(setTimeout(() => hooks.onDone(), at));

  return () => {
    for (const t of timers) clearTimeout(t);
    timers.length = 0;
  };
}
