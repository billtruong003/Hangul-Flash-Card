import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { SYLLABLES } from '../data/syllables';
import { decompose, romanizeKorean } from '../lib/syllable';
import { gotoSection, readStoredState } from '../test/appHarness';

function openSyllables(): void {
  render(<App />);
  gotoSection('Ghép chữ');
}

function panel(): HTMLElement {
  return screen.getByRole('region', { name: 'Ghép âm tiết' });
}

/** The prompt is the romanization, which identifies the target unambiguously. */
function targetFromPrompt() {
  const romaja = panel().querySelector('[lang="ko-Latn"]')?.textContent ?? '';
  const entry = SYLLABLES.find((item) => romanizeKorean(item.syllable) === romaja);
  if (!entry) throw new Error(`Không nhận ra âm tiết đang hỏi: "${romaja}"`);
  return entry;
}

function pick(legend: string, character: string): void {
  fireEvent.click(
    within(panel()).getByRole('button', { name: new RegExp(`^${legend}: ${character},`) }),
  );
}

function buildTarget(): { syllable: string } {
  const entry = targetFromPrompt();
  const parts = decompose(entry.syllable);
  if (!parts) throw new Error(`Không phân rã được ${entry.syllable}`);

  pick('Phụ âm đầu', parts.initial.character);
  pick('Nguyên âm', parts.medial.character);
  if (parts.final) pick('Phụ âm cuối', parts.final.character);

  return entry;
}

describe('SyllableSection', () => {
  it('asks for a syllable by its sound and meaning, not by showing it', () => {
    openSyllables();
    const entry = targetFromPrompt();

    expect(within(panel()).getByText(entry.meaning)).toBeInTheDocument();
    // Showing the Hangul would make the whole exercise a copying task.
    expect(panel().textContent).not.toContain(entry.syllable);
  });

  it('previews the syllable as the letters are chosen', () => {
    openSyllables();
    expect(within(panel()).getByText('Chọn phụ âm đầu và nguyên âm')).toBeInTheDocument();

    const parts = decompose(targetFromPrompt().syllable)!;
    pick('Phụ âm đầu', parts.initial.character);
    pick('Nguyên âm', parts.medial.character);

    // Assembling ㄱ and ㅏ into 가 in front of the learner is the lesson.
    expect(panel().querySelector('[lang="ko"]')?.textContent).toBeTruthy();
  });

  it('accepts the right combination and records it', () => {
    openSyllables();
    const entry = buildTarget();

    fireEvent.click(within(panel()).getByRole('button', { name: 'Kiểm tra' }));

    expect(within(panel()).getByText('Chính xác')).toBeInTheDocument();
    expect(readStoredState().syllables[entry.syllable]).toMatchObject({
      builtCount: 1,
      correctCount: 1,
      incorrectCount: 0,
      currentCorrectStreak: 1,
    });
  });

  it('rejects a wrong combination without recording an attempt', () => {
    openSyllables();
    const entry = targetFromPrompt();
    const parts = decompose(entry.syllable)!;

    // Deliberately the wrong vowel.
    pick('Phụ âm đầu', parts.initial.character);
    pick('Nguyên âm', parts.medial.character === 'ㅏ' ? 'ㅜ' : 'ㅏ');
    fireEvent.click(within(panel()).getByRole('button', { name: 'Kiểm tra' }));

    expect(within(panel()).getByText(/Chưa đúng/)).toBeInTheDocument();
    expect(readStoredState().syllables[entry.syllable]).toBeUndefined();
  });

  it('counts a syllable as missed once it has been got wrong, even after a fix', () => {
    openSyllables();
    const entry = targetFromPrompt();
    const parts = decompose(entry.syllable)!;

    pick('Phụ âm đầu', parts.initial.character);
    pick('Nguyên âm', parts.medial.character === 'ㅏ' ? 'ㅜ' : 'ㅏ');
    fireEvent.click(within(panel()).getByRole('button', { name: 'Kiểm tra' }));

    pick('Nguyên âm', parts.medial.character);
    if (parts.final) pick('Phụ âm cuối', parts.final.character);
    fireEvent.click(within(panel()).getByRole('button', { name: 'Kiểm tra' }));

    expect(within(panel()).getByText('Đã ghép đúng')).toBeInTheDocument();
    expect(readStoredState().syllables[entry.syllable]).toMatchObject({
      builtCount: 1,
      correctCount: 0,
      incorrectCount: 1,
    });
  });

  it('explains the batchim rule once the answer is in', () => {
    openSyllables();

    // Walk to a syllable that closes on a final consonant.
    let entry = targetFromPrompt();
    for (let i = 0; i < SYLLABLES.length && !decompose(entry.syllable)?.final; i += 1) {
      fireEvent.click(within(panel()).getByRole('button', { name: 'Âm tiết khác' }));
      entry = targetFromPrompt();
    }

    const parts = decompose(entry.syllable)!;
    expect(parts.final).not.toBeNull();

    buildTarget();
    fireEvent.click(within(panel()).getByRole('button', { name: 'Kiểm tra' }));

    // The positional rule is the thing this surface exists to teach.
    expect(
      within(panel()).getByText(new RegExp(`cuối âm tiết đọc ${parts.final!.finalRomaja}`)),
    ).toBeInTheDocument();
  });

  it('fills in the answer when the learner asks for a hint, and marks it missed', () => {
    openSyllables();
    const entry = targetFromPrompt();

    fireEvent.click(within(panel()).getByRole('button', { name: 'Gợi ý' }));
    expect(panel().querySelector('[lang="ko"]')?.textContent).toBe(entry.syllable);

    fireEvent.click(within(panel()).getByRole('button', { name: 'Kiểm tra' }));
    expect(readStoredState().syllables[entry.syllable]).toMatchObject({ correctCount: 0 });
  });

  it('moves on to a different syllable', () => {
    openSyllables();
    const first = targetFromPrompt();

    fireEvent.click(within(panel()).getByRole('button', { name: 'Âm tiết khác' }));

    expect(targetFromPrompt().syllable).not.toBe(first.syllable);
  });

  it('leaves the letter quiz and stroke progress alone', () => {
    openSyllables();
    buildTarget();
    fireEvent.click(within(panel()).getByRole('button', { name: 'Kiểm tra' }));

    expect(readStoredState().progress).toEqual({});
    expect(readStoredState().strokes).toEqual({});
  });
});
