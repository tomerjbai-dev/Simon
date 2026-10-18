import type { Color } from './state';

export const TONE_FREQUENCIES: Record<Color, number> = {
  green: 415,
  red: 310,
  yellow: 252,
  blue: 209,
};

const ATTACK = 0.01;
const RELEASE = 0.06;
const VOLUME = 0.3;

export type Audio = {
  unlock: () => void;
  play: (color: Color, durationMs: number) => void;
  stopAll: () => void;
};

// Audio failures must never break the game, so every call is guarded.
export function createAudio(): Audio {
  let ctx: AudioContext | null = null;
  const active = new Set<OscillatorNode>();

  return {
    unlock() {
      try {
        ctx ??= new AudioContext();
        if (ctx.state !== 'running') void ctx.resume().catch(() => {});
      } catch {
        ctx = null;
      }
    },

    play(color, durationMs) {
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const end = now + Math.max(durationMs / 1000, ATTACK + RELEASE);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = TONE_FREQUENCIES[color];
        // Short envelope avoids audible clicks at start and end
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(VOLUME, now + ATTACK);
        gain.gain.setValueAtTime(VOLUME, end - RELEASE);
        gain.gain.linearRampToValueAtTime(0, end);
        osc.connect(gain).connect(ctx.destination);
        osc.onended = () => {
          active.delete(osc);
          gain.disconnect();
        };
        active.add(osc);
        osc.start(now);
        osc.stop(end);
      } catch {
        // Ignore: visual feedback continues without sound
      }
    },

    stopAll() {
      for (const osc of active) {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      }
      active.clear();
    },
  };
}
