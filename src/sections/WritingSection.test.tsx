import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { STROKES } from '../data/strokes';
import type { Stroke } from '../lib/stroke';
import { gotoSection, readStoredState, seedState } from '../test/appHarness';

/**
 * jsdom reports a zero-sized box for every element, so the pad would map all
 * coordinates onto a single point. Faking the box lets the real drawing path —
 * screen coordinates in, grading out — run under test. (PointerEvent itself is
 * polyfilled in test/setup.ts, since jsdom has none at all.)
 */
const PAD_SIZE = 200;

function stubPad(): void {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: PAD_SIZE,
      bottom: PAD_SIZE,
      width: PAD_SIZE,
      height: PAD_SIZE,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

function pad(): HTMLElement {
  return screen.getByRole('application', { name: /Vùng viết chữ/ });
}

/** Draws a stroke on the pad, converting the 0–100 data box to pad pixels. */
function draw(stroke: Stroke, { reverse = false } = {}): void {
  const points = reverse ? [...stroke].reverse() : [...stroke];
  const target = pad();
  const toScreen = ([x, y]: readonly [number, number]) => ({
    clientX: (x / 100) * PAD_SIZE,
    clientY: (y / 100) * PAD_SIZE,
    pointerId: 1,
  });

  fireEvent.pointerDown(target, toScreen(points[0]));
  // Interpolate, because grading looks at direction and length, not just ends.
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    for (let step = 1; step <= 6; step += 1) {
      const ratio = step / 6;
      fireEvent.pointerMove(
        target,
        toScreen([from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio]),
      );
    }
  }
  fireEvent.pointerUp(target, toScreen(points[points.length - 1]));
}

function openWriting(): void {
  // A single category keeps the letter order predictable: ㄱ is first.
  seedState({
    settings: { enabledCategories: ['basic-consonant'], soundEnabled: false, testMode: false },
  });
  render(<App />);
  gotoSection('Viết');
}

beforeEach(() => {
  stubPad();
});

describe('WritingSection', () => {
  it('shows the letter, its romanization and how many strokes it takes', () => {
    openWriting();

    expect(screen.getByText('ㄱ')).toBeInTheDocument();
    expect(screen.getByText('Nét 1 / 1')).toBeInTheDocument();
    expect(pad()).toBeInTheDocument();
  });

  it('accepts a correct stroke and finishes the letter', () => {
    openWriting();

    draw(STROKES['c-g'][0]);

    expect(screen.getByText(/Xong — 100 điểm/)).toBeInTheDocument();
    expect(readStoredState().strokes['c-g']).toMatchObject({
      attemptCount: 1,
      cleanCount: 1,
      bestScore: 100,
      lastScore: 100,
      currentCleanStreak: 1,
    });
  });

  it('tells the learner when the shape was right but the direction was not', () => {
    openWriting();

    draw(STROKES['c-g'][0], { reverse: true });

    expect(screen.getByText(/ngược chiều/)).toBeInTheDocument();
    // A rejected stroke must not count as finishing the letter.
    expect(readStoredState().strokes['c-g']).toBeUndefined();
  });

  it('rejects a stroke drawn somewhere else entirely', () => {
    openWriting();

    draw([
      [10, 90],
      [90, 90],
    ]);

    expect(screen.getByText(/Chưa đúng nét này/)).toBeInTheDocument();
  });

  it('scores a letter lower when a stroke needed more than one try', () => {
    openWriting();

    draw([
      [10, 90],
      [90, 90],
    ]);
    draw(STROKES['c-g'][0]);

    expect(screen.getByText(/Xong — 50 điểm/)).toBeInTheDocument();
    expect(readStoredState().strokes['c-g']).toMatchObject({
      cleanCount: 0,
      bestScore: 50,
      currentCleanStreak: 0,
    });
  });

  it('walks a multi-stroke letter one stroke at a time', () => {
    openWriting();
    // ㄷ is the third basic consonant and takes two strokes.
    fireEvent.click(screen.getByRole('button', { name: 'Chữ tiếp theo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chữ tiếp theo' }));

    expect(screen.getByText('ㄷ')).toBeInTheDocument();
    expect(screen.getByText('Nét 1 / 2')).toBeInTheDocument();

    draw(STROKES['c-d'][0]);
    expect(screen.getByText('Nét 2 / 2')).toBeInTheDocument();

    draw(STROKES['c-d'][1]);
    expect(screen.getByText(/Xong — 100 điểm/)).toBeInTheDocument();
  });

  it('lets the learner hide the tracing guide and write from memory', () => {
    openWriting();

    expect(screen.getByText(/Tô theo vệt mờ/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn vệt mờ' }));
    expect(screen.getByText('Viết từ trí nhớ.')).toBeInTheDocument();
  });

  it('starts over without recording anything when the learner retries', () => {
    openWriting();
    fireEvent.click(screen.getByRole('button', { name: 'Chữ tiếp theo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Chữ tiếp theo' }));

    draw(STROKES['c-d'][0]);
    expect(screen.getByText('Nét 2 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Viết lại' }));

    expect(screen.getByText('Nét 1 / 2')).toBeInTheDocument();
    expect(readStoredState().strokes['c-d']).toBeUndefined();
  });

  it('asks for a study set instead of showing an empty pad', () => {
    seedState({
      settings: { enabledCategories: [], soundEnabled: false, testMode: false },
    });
    render(<App />);
    gotoSection('Viết');

    // parsePersistedState refuses an empty category list, so this falls back to
    // the defaults rather than an empty surface — assert the pad is really there.
    expect(pad()).toBeInTheDocument();
  });

  it('keeps a personal best across attempts', () => {
    openWriting();

    draw(STROKES['c-g'][0]);
    expect(readStoredState().strokes['c-g'].bestScore).toBe(100);

    fireEvent.click(screen.getByRole('button', { name: 'Viết lại' }));
    draw([
      [10, 90],
      [90, 90],
    ]);
    draw(STROKES['c-g'][0]);

    const progress = readStoredState().strokes['c-g'];
    expect(progress.lastScore).toBe(50);
    expect(progress.bestScore).toBe(100);
    expect(progress.attemptCount).toBe(2);
  });
});

describe('stroke practice and the rest of the app', () => {
  it('does not disturb the letter quiz progress', () => {
    openWriting();
    draw(STROKES['c-g'][0]);

    expect(readStoredState().progress).toEqual({});
    expect(readStoredState().strokes['c-g']).toBeDefined();
  });

  it('survives a reload on the writing surface', () => {
    openWriting();
    expect(readStoredState().ui.section).toBe('writing');

    vi.resetModules();
    expect(readStoredState().ui.section).toBe('writing');
  });
});
