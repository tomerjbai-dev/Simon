import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playSequence } from '../playback';
import type { Color } from '../state';
import { flashDurationForLevel, GAP_BETWEEN_FLASHES, PRE_PLAYBACK_DELAY } from '../timing';

function recorder() {
  const events: string[] = [];
  return {
    events,
    hooks: {
      onFlashStart: (c: Color) => events.push(`start:${c}@${Date.now()}`),
      onFlashEnd: (c: Color) => events.push(`end:${c}@${Date.now()}`),
      onDone: () => events.push(`done@${Date.now()}`),
    },
  };
}

describe('playSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays each color in order with the given duration', () => {
    const { events, hooks } = recorder();
    playSequence(['green', 'blue'], 1000, hooks);
    vi.runAllTimers();

    const a = PRE_PLAYBACK_DELAY;
    const b = a + 1000 + GAP_BETWEEN_FLASHES;
    expect(events).toEqual([
      `start:green@${a}`,
      `end:green@${a + 1000}`,
      `start:blue@${b}`,
      `end:blue@${b + 1000}`,
      `done@${b + 1000}`,
    ]);
  });

  it('shows a repeated color as two separate flashes', () => {
    const { events, hooks } = recorder();
    playSequence(['red', 'red'], 500, hooks);
    vi.runAllTimers();

    expect(events.filter((e) => e.startsWith('start:red'))).toHaveLength(2);
    expect(events.filter((e) => e.startsWith('end:red'))).toHaveLength(2);
    const firstEnd = Number(events[1].split('@')[1]);
    const secondStart = Number(events[2].split('@')[1]);
    expect(secondStart - firstEnd).toBe(GAP_BETWEEN_FLASHES);
  });

  it('stops all callbacks after cancel', () => {
    const { events, hooks } = recorder();
    const cancel = playSequence(['green', 'red', 'blue'], 1000, hooks);
    vi.advanceTimersByTime(PRE_PLAYBACK_DELAY + 10);
    cancel();
    vi.runAllTimers();
    expect(events).toEqual([`start:green@${PRE_PLAYBACK_DELAY}`]);
  });
});

describe('flashDurationForLevel', () => {
  it('is 1 second at level 1 and 0.4 seconds at level 10', () => {
    expect(flashDurationForLevel(1)).toBe(1000);
    expect(flashDurationForLevel(10)).toBe(400);
  });
});
