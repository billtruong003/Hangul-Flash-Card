import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { HANGUL_CHARACTERS } from './data/hangul';
import { CORRECT_DELAY_MS, INCORRECT_DELAY_MS } from './hooks/useQuiz';
import { LEGACY_STORAGE_KEY, STORAGE_KEY, createDefaultState } from './lib/storage';
import type { CharacterProgress, PersistedState } from './types';

function answerButtons(): HTMLElement[] {
  return screen.queryAllByRole('button', { name: /^Đáp án/ });
}

function promptCharacter() {
  const promptText = document.querySelector('#quiz-panel [lang="ko"]')?.textContent ?? '';
  const character = HANGUL_CHARACTERS.find((item) => item.character === promptText);
  if (!character) throw new Error(`Không nhận ra chữ đang hiển thị: "${promptText}"`);
  return character;
}

function buttonsSplitByCorrectness() {
  const { pronunciation } = promptCharacter();
  const buttons = answerButtons();
  const correct = buttons.find((button) =>
    button.getAttribute('aria-label')?.endsWith(`đọc là ${pronunciation}`),
  );
  if (!correct) throw new Error('Không tìm thấy đáp án đúng trong danh sách lựa chọn');
  return { correct, wrong: buttons.filter((button) => button !== correct) };
}

function statValue(label: string): string {
  const stats = screen.getByRole('region', { name: 'Thống kê phiên học' });
  const labelElement = within(stats).getByText(label);
  return labelElement.parentElement?.firstElementChild?.textContent ?? '';
}

function readStoredState(): PersistedState {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
}

function chartToggle(): HTMLElement {
  return screen.getByRole('button', { name: /^(Hiện|Ẩn) bảng Hangul$/ });
}

function openChart() {
  const toggle = chartToggle();
  toggle.focus();
  fireEvent.click(toggle);
  return toggle;
}

function seedState(overrides: Partial<PersistedState>) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...createDefaultState(), ...overrides }),
  );
}

function progressEntry(overrides: Partial<CharacterProgress> = {}): CharacterProgress {
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

/** Every basic consonant one unassisted correct answer away from mastery. */
function seedNearlyMasteredConsonants() {
  seedState({
    progress: Object.fromEntries(
      HANGUL_CHARACTERS.filter((character) => character.category === 'basic-consonant').map(
        (character) => [
          character.id,
          progressEntry({
            shownCount: 4,
            unassistedCorrectCount: 4,
            currentUnassistedCorrectStreak: 4,
            lastResult: 'correct-unassisted',
          }),
        ],
      ),
    ),
    settings: { enabledCategories: ['basic-consonant'], soundEnabled: false, testMode: false },
  });
}

/** jsdom has no matchMedia, so the mobile drawer is the default in these tests. */
function stubDesktopViewport() {
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

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders both tabs, a prompt and four answer options', () => {
    render(<App />);

    expect(screen.getByRole('tab', { name: 'Chữ → Âm' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Âm → Chữ' })).toHaveAttribute('aria-selected', 'false');
    expect(answerButtons()).toHaveLength(4);
    expect(promptCharacter()).toBeDefined();
  });

  it('only offers characters from the enabled categories by default', () => {
    render(<App />);
    expect(screen.getByText('Đã thuộc 0 / 24 chữ')).toBeInTheDocument();
    expect(['basic-consonant', 'basic-vowel']).toContain(promptCharacter().category);
  });

  it('counts a correct answer, locks the card and moves on by itself', () => {
    vi.useFakeTimers();
    render(<App />);

    const first = promptCharacter();
    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(statValue('Đúng')).toBe('1');
    expect(statValue('Chuỗi hiện tại')).toBe('1');
    expect(answerButtons().every((button) => (button as HTMLButtonElement).disabled)).toBe(true);

    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));

    expect(screen.queryByText('Chính xác')).not.toBeInTheDocument();
    expect(promptCharacter().id).not.toBe(first.id);
  });

  it('reveals the right answer and resets the streak after a mistake', () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(buttonsSplitByCorrectness().correct);
    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));
    expect(statValue('Chuỗi hiện tại')).toBe('1');

    const { correct, wrong } = buttonsSplitByCorrectness();
    fireEvent.click(wrong[0]);

    expect(screen.getByText('Chưa đúng')).toBeInTheDocument();
    expect(statValue('Sai')).toBe('1');
    expect(statValue('Chuỗi hiện tại')).toBe('0');
    expect(statValue('Chuỗi cao nhất')).toBe('1');
    expect(within(correct).getByText(promptCharacter().pronunciation)).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(INCORRECT_DELAY_MS + 50));
    expect(screen.queryByText('Chưa đúng')).not.toBeInTheDocument();
  });

  it('answers with the number keys and switches tabs with the arrow keys', () => {
    vi.useFakeTimers();
    render(<App />);

    const index = answerButtons().indexOf(buttonsSplitByCorrectness().correct);
    fireEvent.keyDown(window, { key: String(index + 1) });
    expect(statValue('Đúng')).toBe('1');

    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Âm → Chữ' })).toHaveAttribute('aria-selected', 'true');
    expect(document.querySelector('#quiz-panel [lang="ko"]')).toBeNull();
  });

  it('stores per-character progress in LocalStorage', () => {
    render(<App />);

    const character = promptCharacter();
    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(readStoredState().progress[character.id]).toMatchObject({
      shownCount: 1,
      unassistedCorrectCount: 1,
      assistedCorrectCount: 0,
      incorrectCount: 0,
      currentUnassistedCorrectStreak: 1,
      lastResult: 'correct-unassisted',
    });
    expect(readStoredState().bestStreak).toBe(1);
  });

  it('shows a friendly empty state when there is nothing to review', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Bật chế độ ôn chữ sai' }));

    expect(screen.getByText('Chưa có chữ nào sai')).toBeInTheDocument();
    expect(answerButtons()).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Quay lại học bình thường' }));
    expect(answerButtons()).toHaveLength(4);
  });

  it('reviews only the characters answered incorrectly', () => {
    vi.useFakeTimers();
    render(<App />);

    const missed = promptCharacter();
    fireEvent.click(buttonsSplitByCorrectness().wrong[0]);
    act(() => void vi.advanceTimersByTime(INCORRECT_DELAY_MS + 50));

    fireEvent.keyDown(window, { key: 'r' });

    expect(screen.getByText('Đang ôn 1 chữ từng trả lời sai')).toBeInTheDocument();
    expect(promptCharacter().id).toBe(missed.id);
  });

  it('keeps long-term progress when the session is restarted', () => {
    render(<App />);

    fireEvent.click(buttonsSplitByCorrectness().correct);
    fireEvent.click(
      screen.getByRole('button', { name: 'Bắt đầu lại phiên học, giữ nguyên tiến độ dài hạn' }),
    );

    expect(statValue('Đúng')).toBe('0');
    expect(statValue('Chuỗi cao nhất')).toBe('1');
    expect(Object.keys(readStoredState().progress)).toHaveLength(1);
  });

  it('wipes everything only after the confirmation dialog is accepted', () => {
    render(<App />);
    fireEvent.click(buttonsSplitByCorrectness().correct);

    fireEvent.click(screen.getByRole('button', { name: 'Xóa toàn bộ tiến độ' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('Xóa toàn bộ tiến độ?');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Giữ lại' }));
    expect(Object.keys(readStoredState().progress)).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Xóa toàn bộ tiến độ' }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xóa tiến độ' }),
    );

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(readStoredState().progress).toEqual({});
    expect(readStoredState().bestStreak).toBe(0);
  });

  it('ignores keyboard shortcuts while the dialog is open', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Xóa toàn bộ tiến độ' }));

    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(statValue('Đúng')).toBe('0');
    expect(screen.getByRole('tab', { name: 'Chữ → Âm' })).toHaveAttribute('aria-selected', 'true');
  });

  it('regenerates the card and the study set when a category is toggled', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở bảng cài đặt bộ chữ' }));

    fireEvent.click(screen.getByRole('checkbox', { name: /Nguyên âm cơ bản/ }));

    expect(screen.getByText('Đã thuộc 0 / 14 chữ')).toBeInTheDocument();
    expect(promptCharacter().category).toBe('basic-consonant');
    expect(readStoredState().settings.enabledCategories).toEqual(['basic-consonant']);
  });

  it('never lets the last remaining category be switched off', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở bảng cài đặt bộ chữ' }));

    fireEvent.click(screen.getByRole('checkbox', { name: /Nguyên âm cơ bản/ }));
    expect(screen.getByRole('checkbox', { name: /Phụ âm cơ bản/ })).toBeDisabled();
    expect(readStoredState().settings.enabledCategories).toEqual(['basic-consonant']);
  });

  it('recovers from a corrupted LocalStorage payload', () => {
    window.localStorage.setItem(STORAGE_KEY, '{ this is not json');
    render(<App />);

    expect(answerButtons()).toHaveLength(4);
    expect(screen.getByText('Đã thuộc 0 / 24 chữ')).toBeInTheDocument();
  });

  it('picks up progress written by the previous storage version', () => {
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        progress: {
          'c-g': {
            shownCount: 6,
            correctCount: 6,
            incorrectCount: 0,
            currentCorrectStreak: 6,
            lastShownAt: 1700000000000,
          },
        },
        settings: { enabledCategories: ['basic-consonant'], soundEnabled: false },
        bestStreak: 5,
      }),
    );

    render(<App />);

    expect(screen.getByText('Đã thuộc 1 / 14 chữ')).toBeInTheDocument();
    expect(statValue('Chuỗi cao nhất')).toBe('5');
    expect(readStoredState().progress['c-g']).toMatchObject({
      unassistedCorrectCount: 6,
      assistedCorrectCount: 0,
      currentUnassistedCorrectStreak: 6,
    });
  });
});

describe('Hangul reference chart', () => {
  it('stays hidden until the toggle is pressed', () => {
    render(<App />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(chartToggle()).toHaveAccessibleName('Hiện bảng Hangul');

    openChart();

    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveAccessibleName('Bảng chữ Hangul');
    expect(chartToggle()).toHaveAccessibleName('Ẩn bảng Hangul');
    expect(within(drawer).getAllByRole('button', { name: /đọc là/ })).toHaveLength(40);
  });

  it('closes on Escape and hands focus back to the toggle', () => {
    render(<App />);
    const toggle = openChart();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(toggle);
  });

  it('sits beside the quiz as a plain panel on desktop, not a modal', () => {
    stubDesktopViewport();
    render(<App />);
    openChart();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const panel = screen.getByRole('complementary', { name: 'Bảng chữ Hangul' });
    expect(within(panel).getAllByRole('button', { name: /đọc là/ })).toHaveLength(40);
    expect(answerButtons()).toHaveLength(4);

    fireEvent.click(within(panel).getByRole('button', { name: 'Đóng bảng Hangul' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('keeps the quiz answerable while the chart is on screen', () => {
    render(<App />);
    openChart();

    expect(answerButtons()).toHaveLength(4);
    expect(answerButtons().every((button) => !(button as HTMLButtonElement).disabled)).toBe(true);
  });

  it('does not submit an answer when a reference character is tapped', () => {
    render(<App />);
    openChart();

    const drawer = screen.getByRole('dialog');
    fireEvent.click(within(drawer).getByRole('button', { name: /^ㄴ, đọc là n/ }));

    expect(screen.queryByText('Chính xác')).not.toBeInTheDocument();
    expect(screen.queryByText('Chưa đúng')).not.toBeInTheDocument();
    expect(statValue('Đúng')).toBe('0');
    expect(statValue('Sai')).toBe('0');
    expect(readStoredState().progress).toEqual({});
  });

  it('marks the asked character in Chữ → Âm but not in Âm → Chữ', () => {
    render(<App />);
    const asked = promptCharacter();
    openChart();

    const drawer = screen.getByRole('dialog');
    expect(
      within(drawer).getByRole('button', {
        name: new RegExp(`^${asked.character},.*đang được hỏi`),
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Âm → Chữ' }));

    expect(
      within(screen.getByRole('dialog')).queryByRole('button', { name: /đang được hỏi/ }),
    ).not.toBeInTheDocument();
  });
});

describe('assisted answers', () => {
  it('marks the current question assisted as soon as the chart opens', () => {
    render(<App />);
    openChart();
    fireEvent.keyDown(window, { key: 'Escape' });

    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(screen.getByText('Đúng — có trợ giúp')).toBeInTheDocument();
    expect(statValue('Có trợ giúp')).toBe('1');
    expect(statValue('Đúng')).toBe('0');
    expect(statValue('Sai')).toBe('0');
  });

  it('marks the next generated question assisted while the chart stays open', () => {
    vi.useFakeTimers();
    render(<App />);
    openChart();

    fireEvent.click(buttonsSplitByCorrectness().correct);
    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));
    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(screen.getByText('Đúng — có trợ giúp')).toBeInTheDocument();
    expect(statValue('Có trợ giúp')).toBe('2');
    expect(statValue('Đúng')).toBe('0');
  });

  it('goes back to unassisted for questions generated after the chart is closed', () => {
    vi.useFakeTimers();
    render(<App />);
    openChart();

    fireEvent.click(buttonsSplitByCorrectness().correct);
    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));

    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(statValue('Đúng')).toBe('1');
    expect(statValue('Có trợ giúp')).toBe('1');
  });

  it('leaves the quiz streak untouched instead of breaking it', () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(buttonsSplitByCorrectness().correct);
    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));
    expect(statValue('Chuỗi hiện tại')).toBe('1');

    openChart();
    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(statValue('Chuỗi hiện tại')).toBe('1');
    expect(statValue('Chuỗi cao nhất')).toBe('1');
    expect(statValue('Sai')).toBe('0');
  });

  it('records the answer without feeding the mastery counters', () => {
    render(<App />);
    const character = promptCharacter();
    openChart();

    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(readStoredState().progress[character.id]).toMatchObject({
      shownCount: 1,
      unassistedCorrectCount: 0,
      assistedCorrectCount: 1,
      incorrectCount: 0,
      currentUnassistedCorrectStreak: 0,
      lastResult: 'correct-assisted',
    });
  });

  it('does not master a character that was one assisted answer away', () => {
    seedNearlyMasteredConsonants();
    render(<App />);
    expect(screen.getByText('Đã thuộc 0 / 14 chữ')).toBeInTheDocument();

    openChart();
    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(screen.getByText('Đã thuộc 0 / 14 chữ')).toBeInTheDocument();
  });

  it('masters that same character on an unassisted answer', () => {
    seedNearlyMasteredConsonants();
    render(<App />);
    expect(screen.getByText('Đã thuộc 0 / 14 chữ')).toBeInTheDocument();

    fireEvent.click(buttonsSplitByCorrectness().correct);

    expect(screen.getByText('Đã thuộc 1 / 14 chữ')).toBeInTheDocument();
  });

  it('still treats a wrong answer as wrong even after consulting the chart', () => {
    render(<App />);
    const character = promptCharacter();
    openChart();

    fireEvent.click(buttonsSplitByCorrectness().wrong[0]);

    expect(screen.getByText('Chưa đúng')).toBeInTheDocument();
    expect(statValue('Sai')).toBe('1');
    expect(statValue('Có trợ giúp')).toBe('0');
    expect(readStoredState().progress[character.id]).toMatchObject({
      incorrectCount: 1,
      assistedCorrectCount: 0,
      currentUnassistedCorrectStreak: 0,
      lastResult: 'incorrect',
    });
  });

  it('never persists the state of the question on screen', () => {
    render(<App />);
    openChart();

    expect(Object.keys(readStoredState()).sort()).toEqual([
      'bestStreak',
      'progress',
      'settings',
      'version',
    ]);
    expect(readStoredState().progress).toEqual({});
  });
});

describe('Chế độ kiểm tra', () => {
  function enableTestMode() {
    fireEvent.click(screen.getByRole('button', { name: 'Mở bảng cài đặt bộ chữ' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Ẩn bảng trong chế độ kiểm tra/ }));
  }

  it('is off by default', () => {
    render(<App />);
    expect(createDefaultState().settings.testMode).toBe(false);
    expect(chartToggle()).toBeEnabled();
    expect(screen.queryByText(/Chế độ kiểm tra/)).not.toBeInTheDocument();
  });

  it('locks the chart away and labels the session', () => {
    render(<App />);
    enableTestMode();

    expect(chartToggle()).toBeDisabled();
    expect(screen.getByText('Chế độ kiểm tra — bảng chữ Hangul đang bị khóa')).toBeInTheDocument();

    fireEvent.click(chartToggle());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readStoredState().settings.testMode).toBe(true);
  });

  it('closes an already open chart and makes answers unassisted again', () => {
    render(<App />);
    openChart();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    enableTestMode();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(buttonsSplitByCorrectness().correct);
    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(statValue('Đúng')).toBe('1');
  });
});
