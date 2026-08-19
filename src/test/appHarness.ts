import { fireEvent, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { HANGUL_CHARACTERS } from '../data/hangul';
import { STORAGE_KEY, createDefaultState } from '../lib/storage';
import type { CharacterProgress, PersistedState } from '../types';

export function answerButtons(): HTMLElement[] {
  return screen.queryAllByRole('button', { name: /^Đáp án/ });
}

/** True on the "Âm → Chữ" tab, where the prompt is a romaja, not a glyph. */
function isReverseTab(): boolean {
  return document.querySelector('#quiz-panel [lang="ko"]') === null;
}

function findByGlyph(glyph: string) {
  const character = HANGUL_CHARACTERS.find((item) => item.character === glyph);
  if (!character) throw new Error(`Không nhận ra chữ đang hiển thị: "${glyph}"`);
  return character;
}

export function promptCharacter() {
  if (!isReverseTab()) {
    return findByGlyph(document.querySelector('#quiz-panel [lang="ko"]')?.textContent ?? '');
  }

  // The reverse tab shows a romaja, so the asked character is whichever
  // option carries it — answer generation guarantees only one option can match.
  const romaja = document.querySelector('#quiz-panel [lang="vi"]')?.textContent ?? '';
  const asked = answerButtons()
    .map((button) => (button.getAttribute('aria-label') ?? '').replace(/^Đáp án \d+: chữ /, ''))
    .map(findByGlyph)
    .find((character) => character.romaja === romaja);

  if (!asked) throw new Error(`Không nhận ra âm đang hiển thị: "${romaja}"`);
  return asked;
}

export function buttonsSplitByCorrectness() {
  const asked = promptCharacter();
  const suffix = isReverseTab() ? `chữ ${asked.character}` : `đọc là ${asked.romaja}`;
  const buttons = answerButtons();
  const correct = buttons.find((button) => button.getAttribute('aria-label')?.endsWith(suffix));
  if (!correct) throw new Error('Không tìm thấy đáp án đúng trong danh sách lựa chọn');
  return { correct, wrong: buttons.filter((button) => button !== correct) };
}

export function answerCorrectly(): void {
  fireEvent.click(buttonsSplitByCorrectness().correct);
}

export function answerIncorrectly(): void {
  fireEvent.click(buttonsSplitByCorrectness().wrong[0]);
}

export function statValue(label: string): string {
  const stats = screen.getByRole('region', { name: 'Thống kê phiên học' });
  const labelElement = within(stats).getByText(label);
  return labelElement.parentElement?.firstElementChild?.textContent ?? '';
}

export function readStoredState(): PersistedState {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
}

export function chartToggle(): HTMLElement {
  return screen.getByRole('button', { name: /^(Hiện|Ẩn) bảng Hangul$/ });
}

export function openChart(): HTMLElement {
  const toggle = chartToggle();
  toggle.focus();
  fireEvent.click(toggle);
  return toggle;
}

export function openSettings(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Mở bảng cài đặt bộ chữ' }));
}

export function seedState(overrides: Partial<PersistedState>): void {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...createDefaultState(), ...overrides }),
  );
}

export function progressEntry(overrides: Partial<CharacterProgress> = {}): CharacterProgress {
  return {
    shownCount: 0,
    unassistedCorrectCount: 0,
    assistedCorrectCount: 0,
    incorrectCount: 0,
    currentUnassistedCorrectStreak: 0,
    lastShownAt: null,
    ...overrides,
  };
}

/**
 * Gives every basic consonant the same clean history and enables only that
 * category, so whichever character the adaptive picker chooses behaves alike.
 * Four unassisted correct answers is one short of mastery; five is mastered.
 */
export function seedConsonantProgress(unassistedCorrectCount: number): void {
  seedState({
    progress: Object.fromEntries(
      HANGUL_CHARACTERS.filter((character) => character.category === 'basic-consonant').map(
        (character) => [
          character.id,
          progressEntry({
            shownCount: unassistedCorrectCount,
            unassistedCorrectCount,
            currentUnassistedCorrectStreak: unassistedCorrectCount,
            lastResult: 'correct-unassisted',
          }),
        ],
      ),
    ),
    settings: { enabledCategories: ['basic-consonant'], soundEnabled: false, testMode: false },
  });
}

export function seedNearlyMasteredConsonants(): void {
  seedConsonantProgress(4);
}

/** jsdom has no matchMedia, so the mobile drawer is the default in these tests. */
export function stubDesktopViewport(): void {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: true,
    media,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}
