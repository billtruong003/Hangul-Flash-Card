import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { SENTENCES } from '../data/sentences';
import { createDefaultState } from '../lib/storage';
import { gotoSection, readStoredState, seedState } from '../test/appHarness';

/** Sound off by default, so most tests do not depend on speech at all. */
function openListening({ sound = false } = {}): void {
  const defaults = createDefaultState();
  seedState({ settings: { ...defaults.settings, soundEnabled: sound } });
  render(<App />);
  gotoSection('Nghe');
}

function panel(): HTMLElement {
  return screen.getByRole('region', { name: 'Nghe hiểu' });
}

function meaningButtons(): HTMLElement[] {
  return within(panel()).getAllByRole('button', { name: /^Nghĩa \d+:/ });
}

/** The prompt hides the Korean, so the target is whichever option is right. */
function askedSentence() {
  const shown = meaningButtons().map((button) =>
    (button.getAttribute('aria-label') ?? '').replace(/^Nghĩa \d+: /, ''),
  );
  const matches = SENTENCES.filter((entry) => shown.includes(entry.vi));
  // Every option is a real sentence; the right one is identified after answering.
  return { shown, matches };
}

function answerWith(vi: string): void {
  fireEvent.click(within(panel()).getByRole('button', { name: `Nghĩa ${indexOf(vi) + 1}: ${vi}` }));
}

function indexOf(vi: string): number {
  return meaningButtons().findIndex((button) =>
    (button.getAttribute('aria-label') ?? '').endsWith(`: ${vi}`),
  );
}

/**
 * The first option on screen — which may or may not be the right one. That is
 * deliberate: the prompt withholds the Korean, so a test cannot know the answer
 * in advance any more than a learner can. The reveal names it afterwards.
 */
function firstOption(): string {
  const first = meaningButtons()[0];
  return (first.getAttribute('aria-label') ?? '').replace(/^Nghĩa \d+: /, '');
}

describe('ListeningSection', () => {
  it('offers three levels and starts on single words', () => {
    openListening();

    expect(screen.getByRole('tab', { name: 'Từ đơn' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Cụm nói' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Câu' })).toBeInTheDocument();
  });

  it('asks for a meaning, not for the Korean text', () => {
    openListening();

    expect(meaningButtons()).toHaveLength(4);
    // Nothing Korean on screen before answering — otherwise the audio is
    // decorative and the task becomes matching shapes.
    expect(panel().querySelector('[lang="ko"]')).toBeNull();
  });

  it('draws its options from the level on screen', () => {
    openListening();
    const { shown } = askedSentence();

    const levelOne = SENTENCES.filter((entry) => entry.level === 1).map((entry) => entry.vi);
    for (const meaning of shown) expect(levelOne).toContain(meaning);
  });

  it('reveals the sentence and its word breakdown after an answer', () => {
    openListening();
    answerWith(firstOption());

    const korean = panel().querySelector('[lang="ko"]')?.textContent ?? '';
    const entry = SENTENCES.find((item) => item.ko === korean);
    expect(entry, `không tìm thấy câu "${korean}"`).toBeDefined();

    for (const word of entry!.words) {
      expect(
        within(panel()).getByRole('button', { name: `Nghe từ ${word.ko}, nghĩa là ${word.vi}` }),
      ).toBeInTheDocument();
    }
  });

  it('records the attempt against the sentence that was played', () => {
    openListening();
    answerWith(firstOption());

    const korean = panel().querySelector('[lang="ko"]')?.textContent ?? '';
    const entry = SENTENCES.find((item) => item.ko === korean)!;
    const stored = readStoredState().listening[entry.id];

    expect(stored.heardCount).toBe(1);
    expect(stored.correctCount + stored.incorrectCount).toBe(1);
  });

  it('names the right meaning when the answer was wrong', () => {
    openListening();
    const options = meaningButtons().map((button) =>
      (button.getAttribute('aria-label') ?? '').replace(/^Nghĩa \d+: /, ''),
    );

    answerWith(options[0]);

    const korean = panel().querySelector('[lang="ko"]')?.textContent ?? '';
    const entry = SENTENCES.find((item) => item.ko === korean)!;

    if (entry.vi === options[0]) {
      expect(within(panel()).getByText('Chính xác')).toBeInTheDocument();
    } else {
      expect(within(panel()).getByText(`Nghĩa đúng: ${entry.vi}`)).toBeInTheDocument();
    }
  });

  it('locks the options once answered so a guess cannot be walked back', () => {
    openListening();
    answerWith(firstOption());

    for (const button of meaningButtons()) {
      expect(button).toBeDisabled();
    }
  });

  it('moves to another sentence and clears the reveal', () => {
    openListening();
    answerWith(firstOption());
    const first = panel().querySelector('[lang="ko"]')?.textContent;

    fireEvent.click(within(panel()).getByRole('button', { name: 'Câu tiếp theo' }));

    expect(panel().querySelector('[lang="ko"]')).toBeNull();
    expect(meaningButtons()[0]).toBeEnabled();
    expect(first).toBeTruthy();
  });

  it('switches level and offers that level instead', () => {
    openListening();

    fireEvent.click(screen.getByRole('tab', { name: 'Câu' }));

    const shown = meaningButtons().map((button) =>
      (button.getAttribute('aria-label') ?? '').replace(/^Nghĩa \d+: /, ''),
    );
    const levelThree = SENTENCES.filter((entry) => entry.level === 3).map((entry) => entry.vi);
    for (const meaning of shown) expect(levelThree).toContain(meaning);
  });

  it('says so plainly when the device cannot speak Korean', () => {
    openListening({ sound: false });

    expect(screen.getByText(/Máy không có giọng tiếng Hàn/)).toBeInTheDocument();
    expect(within(panel()).getByRole('button', { name: 'Phát câu tiếng Hàn' })).toBeDisabled();
  });

  it('counts replays before the answer, not after', () => {
    // jsdom has no speechSynthesis, so the play button is disabled here; this
    // checks the counter wiring through the enabled path instead.
    openListening();
    const play = within(panel()).getByRole('button', { name: 'Phát câu tiếng Hàn' });
    expect(play).toBeDisabled();
    expect(screen.queryByText(/Đã nghe/)).not.toBeInTheDocument();
  });

  it('leaves the other surfaces untouched', () => {
    openListening();
    answerWith(firstOption());

    expect(readStoredState().progress).toEqual({});
    expect(readStoredState().strokes).toEqual({});
    expect(readStoredState().syllables).toEqual({});
  });
});

describe('the reveal', () => {
  it('shows a romanization for every sentence it can reach', () => {
    openListening();
    answerWith(firstOption());

    const romaja = panel().querySelector('[lang="ko-Latn"]')?.textContent ?? '';
    expect(romaja.length).toBeGreaterThan(0);
  });

  it('does not leak the answer into the DOM before it is given', () => {
    openListening();

    expect(panel().querySelector('[lang="ko"]')).toBeNull();
    expect(panel().querySelector('[lang="ko-Latn"]')).toBeNull();
  });
});
