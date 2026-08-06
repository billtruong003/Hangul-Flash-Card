import { describe, expect, it } from 'vitest';
import { HANGUL_CHARACTERS } from '../data/hangul';
import { makeProgress } from '../test/fixtures';
import type { ProgressMap } from '../types';
import { countMastered, isMastered, recordAnswer, unassistedAccuracyOf } from './progress';

describe('unassistedAccuracyOf', () => {
  it('is 0 for missing or unanswered progress', () => {
    expect(unassistedAccuracyOf(undefined)).toBe(0);
    expect(unassistedAccuracyOf(makeProgress())).toBe(0);
  });

  it('is the unassisted share of all answers', () => {
    expect(
      unassistedAccuracyOf(makeProgress({ unassistedCorrectCount: 3, incorrectCount: 1 })),
    ).toBe(0.75);
  });

  it('counts assisted answers against accuracy', () => {
    expect(
      unassistedAccuracyOf(makeProgress({ unassistedCorrectCount: 3, assistedCorrectCount: 1 })),
    ).toBe(0.75);
  });
});

describe('isMastered', () => {
  const mastered = makeProgress({
    shownCount: 6,
    unassistedCorrectCount: 5,
    incorrectCount: 1,
    currentUnassistedCorrectStreak: 3,
  });

  it('accepts a character meeting all three thresholds', () => {
    expect(isMastered(mastered)).toBe(true);
  });

  it('rejects fewer than five unassisted correct answers', () => {
    expect(
      isMastered({ ...mastered, unassistedCorrectCount: 4, currentUnassistedCorrectStreak: 4 }),
    ).toBe(false);
  });

  it('rejects a current streak below three', () => {
    expect(isMastered({ ...mastered, currentUnassistedCorrectStreak: 2 })).toBe(false);
  });

  it('rejects accuracy below 80%', () => {
    expect(
      isMastered(
        makeProgress({
          shownCount: 10,
          unassistedCorrectCount: 7,
          incorrectCount: 3,
          currentUnassistedCorrectStreak: 3,
        }),
      ),
    ).toBe(false);
  });

  it('accepts accuracy exactly at 80%', () => {
    expect(
      isMastered(
        makeProgress({
          shownCount: 10,
          unassistedCorrectCount: 8,
          incorrectCount: 2,
          currentUnassistedCorrectStreak: 3,
        }),
      ),
    ).toBe(true);
  });

  it('never lets assisted answers push a character over the line', () => {
    expect(
      isMastered(
        makeProgress({
          shownCount: 20,
          unassistedCorrectCount: 4,
          assistedCorrectCount: 16,
          currentUnassistedCorrectStreak: 4,
        }),
      ),
    ).toBe(false);
  });

  it('drops out of mastery once assisted answers dilute the accuracy', () => {
    const justMastered = makeProgress({
      shownCount: 5,
      unassistedCorrectCount: 5,
      currentUnassistedCorrectStreak: 5,
    });
    expect(isMastered(justMastered)).toBe(true);
    expect(isMastered({ ...justMastered, shownCount: 7, assistedCorrectCount: 2 })).toBe(false);
  });

  it('rejects missing progress', () => {
    expect(isMastered(undefined)).toBe(false);
  });
});

describe('countMastered', () => {
  it('counts only mastered characters inside the given set', () => {
    const progress: ProgressMap = {
      'c-g': makeProgress({
        shownCount: 5,
        unassistedCorrectCount: 5,
        currentUnassistedCorrectStreak: 5,
      }),
      'c-n': makeProgress({
        shownCount: 2,
        unassistedCorrectCount: 2,
        currentUnassistedCorrectStreak: 2,
      }),
    };
    expect(countMastered(HANGUL_CHARACTERS, progress)).toBe(1);
    expect(countMastered([], progress)).toBe(0);
  });
});

describe('recordAnswer', () => {
  it('creates progress for a character seen for the first time', () => {
    expect(recordAnswer({}, 'c-g', 'correct-unassisted', 1000)['c-g']).toEqual({
      shownCount: 1,
      unassistedCorrectCount: 1,
      assistedCorrectCount: 0,
      incorrectCount: 0,
      currentUnassistedCorrectStreak: 1,
      lastShownAt: 1000,
      lastResult: 'correct-unassisted',
    });
  });

  it('records an assisted answer without touching mastery counters', () => {
    const start: ProgressMap = {
      'c-g': makeProgress({
        shownCount: 3,
        unassistedCorrectCount: 3,
        currentUnassistedCorrectStreak: 3,
      }),
    };
    expect(recordAnswer(start, 'c-g', 'correct-assisted', 2000)['c-g']).toEqual({
      shownCount: 4,
      unassistedCorrectCount: 3,
      assistedCorrectCount: 1,
      incorrectCount: 0,
      currentUnassistedCorrectStreak: 3,
      lastShownAt: 2000,
      lastResult: 'correct-assisted',
    });
  });

  it('resets the streak on a wrong answer but keeps history', () => {
    const start: ProgressMap = {
      'c-g': makeProgress({
        shownCount: 3,
        unassistedCorrectCount: 3,
        currentUnassistedCorrectStreak: 3,
      }),
    };
    expect(recordAnswer(start, 'c-g', 'incorrect', 2000)['c-g']).toEqual({
      shownCount: 4,
      unassistedCorrectCount: 3,
      assistedCorrectCount: 0,
      incorrectCount: 1,
      currentUnassistedCorrectStreak: 0,
      lastShownAt: 2000,
      lastResult: 'incorrect',
    });
  });

  it('does not mutate the previous map', () => {
    const start: ProgressMap = {
      'c-g': makeProgress({ shownCount: 1, unassistedCorrectCount: 1 }),
    };
    const snapshot = JSON.stringify(start);
    recordAnswer(start, 'c-g', 'correct-unassisted', 3000);
    expect(JSON.stringify(start)).toBe(snapshot);
  });
});
