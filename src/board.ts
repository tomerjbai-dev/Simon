import type { Color } from './state';

export type TileSpec = { color: Color; label: string };

// Fixed visual order, row by row, left to right. Must not flip with RTL.
export const BOARD_LAYOUT: readonly TileSpec[] = [
  { color: 'green', label: 'ירוק' },
  { color: 'red', label: 'אדום' },
  { color: 'yellow', label: 'צהוב' },
  { color: 'blue', label: 'כחול' },
];
