import { COLORS, type Color } from './state';

export type Rng = () => number; // returns a value in [0, 1)

// Each position is picked independently with equal probability; repeats are allowed.
export function generateSequence(length: number, rng: Rng = Math.random): Color[] {
  const sequence: Color[] = [];
  for (let i = 0; i < length; i++) {
    const index = Math.min(COLORS.length - 1, Math.max(0, Math.floor(rng() * COLORS.length)));
    sequence.push(COLORS[index]);
  }
  return sequence;
}
