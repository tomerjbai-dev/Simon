import { BOARD_LAYOUT } from './board';
import { formatLevel, formatScore, TEXT } from './format';
import { ICON_SOUND_OFF, ICON_SOUND_ON } from './icons';
import type { Color, GameState } from './state';

export type UiHandlers = {
  onStart: () => void;
  onTile: (color: Color) => void;
  onToggleMute: () => void;
};

export type Ui = {
  update: (state: GameState) => void;
  setActiveTile: (color: Color | null) => void;
  setSuccess: (on: boolean) => void;
  showResult: (show: boolean) => void;
};

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

function button(className: string, text?: string): HTMLButtonElement {
  const node = el('button', className, text);
  node.type = 'button';
  return node;
}

// The DOM is built once; update() only toggles text, classes and visibility,
// so tiles are never recreated in the middle of a flash or a press.
export function mountUi(root: HTMLElement, handlers: UiHandlers): Ui {
  const screen = el('main', 'screen');

  // Physical layout: mute on the left, the right slot is reserved for "about"
  const topBar = el('div', 'top-bar');
  topBar.dir = 'ltr';
  const mute = button('icon-btn');
  mute.addEventListener('click', handlers.onToggleMute);
  topBar.append(mute, el('span', 'top-bar-slot'));

  const stage = el('div', 'stage');

  const header = el('div', 'header');
  const title = el('h1', 'title', TEXT.title);
  const statusBar = el('div', 'status-bar');
  const levelText = el('span', 'status-level');
  const scoreText = el('span', 'status-score');
  statusBar.append(levelText, el('span', 'status-divider'), scoreText);
  header.append(title, statusBar);

  const board = el('div', 'board');
  // Keep the grid in visual order regardless of the page's RTL direction
  board.dir = 'ltr';
  const tiles = new Map<Color, HTMLButtonElement>();
  for (const tile of BOARD_LAYOUT) {
    const node = button(`tile tile-${tile.color}`);
    node.dataset.color = tile.color;
    node.setAttribute('aria-label', tile.label);
    node.addEventListener('click', () => handlers.onTile(tile.color));
    tiles.set(tile.color, node);
    board.append(node);
  }

  const card = el('section', 'card result-card');
  const reachedValue = el('div', 'result-value');
  const scoreValue = el('div', 'result-value');
  card.append(
    el('h2', 'result-title text-h2', TEXT.gameOver),
    el('div', 'result-label text-body-l', TEXT.reachedLevel),
    reachedValue,
    el('div', 'result-label text-body-l', TEXT.yourScore),
    scoreValue,
  );

  const actions = el('div', 'actions');
  const primary = button('btn btn-primary');
  primary.addEventListener('click', handlers.onStart);
  actions.append(primary);

  stage.append(header, board, card, actions);
  screen.append(topBar, stage);
  root.replaceChildren(screen);

  let resultShown = false;
  let successOn = false;
  let current: GameState | null = null;

  function applyLayout(state: GameState): void {
    const showCard = state.phase === 'lost' && resultShown;
    title.hidden = state.phase !== 'idle';
    statusBar.hidden = state.phase === 'idle';
    header.hidden = showCard;
    board.hidden = showCard;
    card.hidden = !showCard;

    // The button keeps its space while hidden, so the board never shifts
    const hideButton =
      state.phase === 'presenting' ||
      state.phase === 'input' ||
      successOn ||
      (state.phase === 'lost' && !resultShown);
    actions.classList.toggle('is-reserved', hideButton);
    primary.disabled = hideButton;
  }

  return {
    update(state) {
      current = state;
      if (state.phase !== 'lost') resultShown = false;

      mute.innerHTML = state.muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
      mute.setAttribute('aria-label', state.muted ? TEXT.unmute : TEXT.mute);
      mute.setAttribute('aria-pressed', String(state.muted));

      levelText.textContent = formatLevel(state.level);
      scoreText.textContent = formatScore(state.score);
      reachedValue.textContent = String(state.level);
      scoreValue.textContent = String(state.score);

      const inputOpen = state.phase === 'idle' || state.phase === 'input';
      board.classList.toggle('is-locked', !inputOpen);
      for (const node of tiles.values()) node.disabled = !inputOpen;

      primary.textContent = state.phase === 'idle' ? TEXT.start : TEXT.newGame;

      applyLayout(state);
    },

    setActiveTile(color) {
      for (const [c, node] of tiles) node.classList.toggle('is-active', c === color);
    },

    setSuccess(on) {
      successOn = on;
      board.classList.toggle('is-success', on);
      if (current) applyLayout(current);
    },

    showResult(show) {
      resultShown = show;
      if (current) applyLayout(current);
    },
  };
}
