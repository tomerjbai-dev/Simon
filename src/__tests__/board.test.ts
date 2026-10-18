import { describe, expect, it } from 'vitest';
import { BOARD_LAYOUT } from '../board';

describe('BOARD_LAYOUT', () => {
  it('has four distinct colors in fixed visual order', () => {
    expect(BOARD_LAYOUT.map((t) => t.color)).toEqual(['green', 'red', 'yellow', 'blue']);
  });

  it('gives every tile a Hebrew label', () => {
    expect(BOARD_LAYOUT.map((t) => t.label)).toEqual(['ירוק', 'אדום', 'צהוב', 'כחול']);
  });
});
