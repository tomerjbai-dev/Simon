import type { Audio } from './audio';
import { advanceLevel, finishPresenting, pressColor, startGame, toggleMute } from './game';
import { playSequence } from './playback';
import { createInitialState, type Color, type GameState } from './state';
import {
  flashDurationForLevel,
  LOSS_REVEAL_DELAY,
  PRESS_FLASH,
  SUCCESS_FEEDBACK,
  WIN_REVEAL_DELAY,
} from './timing';
import { mountUi, type Ui } from './ui';

// Wires the pure game logic to timers, audio and the DOM.
// Only this module changes the game state.
export function createApp(root: HTMLElement, audio: Audio): void {
  let state: GameState = createInitialState();
  let cancelPlayback: (() => void) | null = null;
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  // Runs fn later only if no new game has started meanwhile
  function later(ms: number, fn: () => void): void {
    const runId = state.runId;
    const id = setTimeout(() => {
      timers.delete(id);
      if (runId === state.runId) fn();
    }, ms);
    timers.add(id);
  }

  function clearPending(): void {
    cancelPlayback?.();
    cancelPlayback = null;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    audio.stopAll();
  }

  function setState(next: GameState): void {
    state = next;
    ui.update(state);
  }

  function flash(color: Color, ms: number): void {
    ui.setActiveTile(color);
    if (!state.muted) audio.play(color, ms);
  }

  function onStart(): void {
    // Must run inside the click handler so Chrome allows audio
    audio.unlock();
    clearPending();
    ui.setActiveTile(null);
    ui.setSuccess(false);
    ui.showResult(false);
    setState(startGame(state));
    playLevel();
  }

  // Plays the current level's sequence, then opens input
  function playLevel(): void {
    const runId = state.runId;
    const flashMs = flashDurationForLevel(state.level);
    cancelPlayback = playSequence(state.sequence, flashMs, {
      onFlashStart: (color) => {
        if (runId === state.runId) flash(color, flashMs);
      },
      onFlashEnd: () => {
        if (runId === state.runId) ui.setActiveTile(null);
      },
      onDone: () => {
        cancelPlayback = null;
        setState(finishPresenting(state, runId));
      },
    });
  }

  function onTile(color: Color): void {
    const { state: next, result } = pressColor(state, color);
    if (result === 'ignored') return;

    if (pressTimer) clearTimeout(pressTimer);
    flash(color, PRESS_FLASH);
    pressTimer = setTimeout(() => {
      pressTimer = null;
      ui.setActiveTile(null);
    }, PRESS_FLASH);

    setState(next);

    if (result === 'stageComplete') {
      ui.setSuccess(true);
      later(SUCCESS_FEEDBACK, () => {
        ui.setSuccess(false);
        setState(advanceLevel(state));
        playLevel();
      });
    } else if (result === 'won') {
      ui.setSuccess(true);
      later(WIN_REVEAL_DELAY, () => {
        ui.setSuccess(false);
        ui.setActiveTile(null);
        ui.showResult(true);
      });
    } else if (result === 'wrong') {
      later(LOSS_REVEAL_DELAY, () => {
        ui.setActiveTile(null);
        ui.showResult(true);
      });
    }
  }

  function onToggleMute(): void {
    setState(toggleMute(state));
    if (state.muted) audio.stopAll();
  }

  const ui: Ui = mountUi(root, { onStart, onTile, onToggleMute });
  ui.update(state);
}
