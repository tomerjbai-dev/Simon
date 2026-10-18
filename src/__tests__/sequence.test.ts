import { describe, expect, it } from 'vitest';
import { generateSequence } from '../sequence';
import { COLORS } from '../state';

function rngFrom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('generateSequence', () => {
  it('returns a sequence of the requested length', () => {
    for (const length of [1, 5, 10]) {
      expect(generateSequence(length)).toHaveLength(length);
    }
  });

  it('uses only the four game colors', () => {
    const sequence = generateSequence(500);
    for (const color of sequence) expect(COLORS).toContain(color);
  });

  it('maps the random range to all four colors equally', () => {
    expect(generateSequence(4, rngFrom([0, 0.25, 0.5, 0.75]))).toEqual([
      'green',
      'red',
      'yellow',
      'blue',
    ]);
  });

  it('allows the same color to repeat', () => {
    expect(generateSequence(3, () => 0.1)).toEqual(['green', 'green', 'green']);
  });

  it('stays in range at the edges of the random range', () => {
    expect(generateSequence(2, rngFrom([0.9999, 1]))).toEqual(['blue', 'blue']);
  });
});
