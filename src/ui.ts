import { BOARD_LAYOUT } from './board';
import { formatLevel, formatScore } from './format';
import type { GameState } from './state';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderHeader(state: GameState): HTMLElement {
  if (state.phase === 'idle') {
    return el('h1', 'title', 'סיימון');
  }
  const bar = el('div', 'status-bar');
  bar.append(
    el('span', 'status-level', formatLevel(state.level)),
    el('span', 'status-divider'),
    el('span', 'status-score', formatScore(state.score)),
  );
  return bar;
}

function renderBoard(): HTMLElement {
  const board = el('div', 'board');
  // Keep the grid in visual order regardless of the page's RTL direction
  board.dir = 'ltr';
  for (const tile of BOARD_LAYOUT) {
    const button = el('button', `tile tile-${tile.color}`);
    button.type = 'button';
    button.dataset.color = tile.color;
    button.setAttribute('aria-label', tile.label);
    board.append(button);
  }
  return board;
}

export function render(root: HTMLElement, state: GameState): void {
  const screen = el('main', 'screen');

  // Reserved space for the icon buttons added in later milestones
  const topBar = el('div', 'top-bar');

  const header = el('div', 'header');
  header.append(renderHeader(state));

  const start = el('button', 'btn btn-primary', 'התחל');
  start.type = 'button';

  const actions = el('div', 'actions');
  actions.append(start);

  screen.append(topBar, header, renderBoard(), actions);
  root.replaceChildren(screen);
}
