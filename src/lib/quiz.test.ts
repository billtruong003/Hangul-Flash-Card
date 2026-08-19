import { describe, expect, it } from 'vitest';
import { CHARACTERS_BY_ID, HANGUL_CHARACTERS } from '../data/hangul';
import type { ProgressMap } from '../types';
import {
  OPTION_COUNT,
  buildAnswerOptions,
  computeWeight,
  getReviewCandidates,
  pickNextCharacter,
  shuffle,
} from './quiz';
import { makeCharacter, makeProgress, seededRandom } from '../test/fixtures';

const random = seededRandom(20260807);

describe('shuffle', () => {
  it('keeps every element exactly once', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = shuffle(input, seededRandom(7));
    expect([...shuffled].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c'];
    shuffle(input, seededRandom(11));
    expect(input).toEqual(['a', 'b', 'c']);
  });
});

describe('buildAnswerOptions', () => {
  it('always includes the correct answer', () => {
    for (const correct of HANGUL_CHARACTERS) {
      const options = buildAnswerOptions(correct, HANGUL_CHARACTERS, random);
      expect(options.map((option) => option.id)).toContain(correct.id);
    }
  });

  it('returns exactly four options with no duplicate ids', () => {
    for (const correct of HANGUL_CHARACTERS) {
      const options = buildAnswerOptions(correct, HANGUL_CHARACTERS, random);
      expect(options).toHaveLength(OPTION_COUNT);
      expect(new Set(options.map((option) => option.id)).size).toBe(OPTION_COUNT);
    }
  });

  it('never shows two options with the same romaja label', () => {
    for (const correct of HANGUL_CHARACTERS) {
      const options = buildAnswerOptions(correct, HANGUL_CHARACTERS, random);
      const labels = options.map((option) => option.romaja);
      expect(new Set(labels).size).toBe(OPTION_COUNT);
    }
  });

  it('lets ㅙ and ㅞ sit side by side now that they romanize differently', () => {
    // Under the old Vietnamese-approximated labels both of these read "we", so
    // one had to be filtered out or the question had two right answers. Revised
    // Romanization separates them into wae and we, which turns a former conflict
    // into the most useful distractor pair there is: they sound nearly identical
    // and can only be told apart by spelling.
    const wae = CHARACTERS_BY_ID['v-wae'];
    expect(wae.romaja).not.toBe(CHARACTERS_BY_ID['v-we'].romaja);

    const seenTogether = Array.from({ length: 200 }, (_, i) =>
      buildAnswerOptions(wae, HANGUL_CHARACTERS, seededRandom(i + 1)).map((option) => option.id),
    );
    for (const ids of seenTogether) expect(ids).toContain('v-wae');
    expect(seenTogether.some((ids) => ids.includes('v-we'))).toBe(true);
  });

  it('prefers declared confusables as distractors', () => {
    const correct = CHARACTERS_BY_ID['c-n'];
    const options = buildAnswerOptions(correct, HANGUL_CHARACTERS, seededRandom(3));
    const distractorIds = options.map((o) => o.id).filter((id) => id !== correct.id);
    expect(distractorIds.sort()).toEqual([...(correct.confusableIds ?? [])].sort());
  });

  it('prefers the same category when confusables are unavailable', () => {
    const correct = makeCharacter('x1', { category: 'basic-vowel', romaja: 'p1' });
    const sameCategory = [
      makeCharacter('x2', { category: 'basic-vowel', romaja: 'p2' }),
      makeCharacter('x3', { category: 'basic-vowel', romaja: 'p3' }),
      makeCharacter('x4', { category: 'basic-vowel', romaja: 'p4' }),
    ];
    const otherCategory = Array.from({ length: 6 }, (_, i) =>
      makeCharacter(`y${i}`, { category: 'tense-consonant', romaja: `q${i}` }),
    );

    const options = buildAnswerOptions(
      correct,
      [correct, ...otherCategory, ...sameCategory],
      seededRandom(42),
    );
    expect(options.every((option) => option.category === 'basic-vowel')).toBe(true);
  });

  it('falls back to other categories when the pool is small', () => {
    const correct = makeCharacter('x1', { category: 'basic-vowel', romaja: 'p1' });
    const pool = [
      correct,
      makeCharacter('x2', { category: 'basic-vowel', romaja: 'p2' }),
      makeCharacter('y1', { category: 'tense-consonant', romaja: 'q1' }),
      makeCharacter('y2', { category: 'tense-consonant', romaja: 'q2' }),
    ];
    const options = buildAnswerOptions(correct, pool, seededRandom(5));
    expect(options).toHaveLength(OPTION_COUNT);
    expect(new Set(options.map((o) => o.id)).size).toBe(OPTION_COUNT);
  });

  it('allows duplicate labels only when the pool leaves no alternative', () => {
    const correct = makeCharacter('x1', { romaja: 'same' });
    const pool = [
      correct,
      makeCharacter('x2', { romaja: 'same' }),
      makeCharacter('x3', { romaja: 'same' }),
      makeCharacter('x4', { romaja: 'same' }),
    ];
    const options = buildAnswerOptions(correct, pool, seededRandom(9));
    expect(options).toHaveLength(OPTION_COUNT);
    expect(new Set(options.map((o) => o.id)).size).toBe(OPTION_COUNT);
  });

  it('returns what it can when the pool is smaller than four', () => {
    const correct = makeCharacter('x1', { romaja: 'p1' });
    const options = buildAnswerOptions(
      correct,
      [correct, makeCharacter('x2', { romaja: 'p2' })],
      seededRandom(1),
    );
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.id)).toContain('x1');
  });

  it('shuffles the correct answer across positions', () => {
    const correct = CHARACTERS_BY_ID['c-n'];
    const positions = new Set<number>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const options = buildAnswerOptions(correct, HANGUL_CHARACTERS, seededRandom(seed));
      positions.add(options.findIndex((option) => option.id === correct.id));
    }
    expect(positions.size).toBe(OPTION_COUNT);
  });
});

describe('computeWeight (adaptive weighting)', () => {
  const perfect = makeProgress({
    shownCount: 4,
    unassistedCorrectCount: 4,
    currentUnassistedCorrectStreak: 4,
    lastResult: 'correct-unassisted',
  });
  const struggling = makeProgress({
    shownCount: 6,
    unassistedCorrectCount: 2,
    incorrectCount: 4,
    currentUnassistedCorrectStreak: 1,
    lastResult: 'correct-unassisted',
  });
  const mastered = makeProgress({
    shownCount: 6,
    unassistedCorrectCount: 6,
    currentUnassistedCorrectStreak: 6,
    lastResult: 'correct-unassisted',
  });

  it('gives unseen characters the highest weight', () => {
    expect(computeWeight(undefined)).toBeGreaterThan(computeWeight(perfect));
    expect(computeWeight(undefined)).toBeGreaterThan(computeWeight(struggling));
    expect(computeWeight(makeProgress())).toBe(computeWeight(undefined));
  });

  it('weights low accuracy above high accuracy', () => {
    expect(computeWeight(struggling)).toBeGreaterThan(computeWeight(perfect));
  });

  it('boosts characters whose last answer was wrong', () => {
    const justMissed = makeProgress({
      shownCount: 6,
      unassistedCorrectCount: 2,
      incorrectCount: 4,
      currentUnassistedCorrectStreak: 0,
      lastResult: 'incorrect',
    });
    expect(computeWeight(justMissed)).toBeGreaterThan(computeWeight(struggling));
  });

  it('drops mastered characters to a small but non-zero weight', () => {
    const weight = computeWeight(mastered);
    expect(weight).toBeGreaterThan(0);
    expect(weight).toBeLessThan(computeWeight(perfect));
    expect(weight).toBeLessThan(computeWeight(struggling));
  });

  it('ranks recently incorrect above recently assisted above unassisted correct', () => {
    const recentlyIncorrect = makeProgress({
      shownCount: 6,
      unassistedCorrectCount: 3,
      incorrectCount: 3,
      currentUnassistedCorrectStreak: 0,
      lastResult: 'incorrect',
    });
    const recentlyAssisted = makeProgress({
      shownCount: 6,
      unassistedCorrectCount: 3,
      assistedCorrectCount: 3,
      currentUnassistedCorrectStreak: 3,
      lastResult: 'correct-assisted',
    });

    expect(computeWeight(recentlyIncorrect)).toBeGreaterThan(computeWeight(recentlyAssisted));
    expect(computeWeight(recentlyAssisted)).toBeGreaterThan(computeWeight(perfect));
    expect(computeWeight(perfect)).toBeGreaterThan(computeWeight(mastered));
    expect(computeWeight(mastered)).toBeGreaterThan(0);
  });

  it('lets an assisted answer shed less weight than an unassisted one', () => {
    const helpedOnce = makeProgress({
      shownCount: 4,
      unassistedCorrectCount: 3,
      assistedCorrectCount: 1,
      currentUnassistedCorrectStreak: 3,
      lastResult: 'correct-assisted',
    });
    const solvedAlone = makeProgress({
      shownCount: 4,
      unassistedCorrectCount: 4,
      currentUnassistedCorrectStreak: 4,
      lastResult: 'correct-unassisted',
    });
    expect(computeWeight(helpedOnce)).toBeGreaterThan(computeWeight(solvedAlone));
  });

  it('ignores mastery in review mode and ranks by accuracy', () => {
    const badInReview = makeProgress({
      shownCount: 10,
      unassistedCorrectCount: 2,
      incorrectCount: 8,
      currentUnassistedCorrectStreak: 0,
      lastResult: 'incorrect',
    });
    const okInReview = makeProgress({
      shownCount: 10,
      unassistedCorrectCount: 9,
      incorrectCount: 1,
      currentUnassistedCorrectStreak: 4,
      lastResult: 'correct-unassisted',
    });
    expect(computeWeight(badInReview, 'review')).toBeGreaterThan(
      computeWeight(okInReview, 'review'),
    );
    expect(computeWeight(mastered, 'review')).toBeGreaterThan(computeWeight(mastered, 'study'));
  });

  it('stays deterministic for the same progress', () => {
    expect(computeWeight(struggling)).toBe(computeWeight(struggling));
    expect(computeWeight(mastered, 'review')).toBe(computeWeight(mastered, 'review'));
  });
});

describe('pickNextCharacter', () => {
  const candidates = HANGUL_CHARACTERS.slice(0, 8);

  it('returns null for an empty candidate list', () => {
    expect(pickNextCharacter([], {}, null, random)).toBeNull();
  });

  it('never repeats the previous character when others are available', () => {
    let previousId: string | null = null;
    for (let i = 0; i < 500; i += 1) {
      const next = pickNextCharacter(candidates, {}, previousId, random);
      expect(next).not.toBeNull();
      expect(next?.id).not.toBe(previousId);
      previousId = next?.id ?? null;
    }
  });

  it('repeats the only character when it is the sole candidate', () => {
    const only = [candidates[0]];
    expect(pickNextCharacter(only, {}, only[0].id, random)?.id).toBe(only[0].id);
  });

  it('shows unseen characters before mastered ones', () => {
    const progress: ProgressMap = {
      [candidates[0].id]: makeProgress({
        shownCount: 20,
        unassistedCorrectCount: 20,
        currentUnassistedCorrectStreak: 20,
        lastResult: 'correct-unassisted',
      }),
    };
    let masteredPicks = 0;
    for (let i = 0; i < 400; i += 1) {
      if (pickNextCharacter(candidates, progress, null, random)?.id === candidates[0].id) {
        masteredPicks += 1;
      }
    }
    // Uniform selection would land near 50 out of 400.
    expect(masteredPicks).toBeLessThan(20);
  });

  it('favours the weakest character in a two-character set', () => {
    const [weak, strong] = candidates;
    const progress: ProgressMap = {
      [weak.id]: makeProgress({
        shownCount: 8,
        unassistedCorrectCount: 1,
        incorrectCount: 7,
        currentUnassistedCorrectStreak: 0,
        lastResult: 'incorrect',
      }),
      [strong.id]: makeProgress({
        shownCount: 8,
        unassistedCorrectCount: 8,
        currentUnassistedCorrectStreak: 8,
        lastResult: 'correct-unassisted',
      }),
    };
    let weakPicks = 0;
    for (let i = 0; i < 400; i += 1) {
      if (pickNextCharacter([weak, strong], progress, null, random)?.id === weak.id) {
        weakPicks += 1;
      }
    }
    expect(weakPicks).toBeGreaterThan(340);
  });
});

describe('getReviewCandidates', () => {
  it('keeps only characters answered incorrectly at least once', () => {
    const progress: ProgressMap = {
      'c-g': makeProgress({
        shownCount: 3,
        unassistedCorrectCount: 3,
        currentUnassistedCorrectStreak: 3,
      }),
      'c-n': makeProgress({ shownCount: 3, unassistedCorrectCount: 2, incorrectCount: 1 }),
      'c-d': makeProgress({ shownCount: 4, unassistedCorrectCount: 1, incorrectCount: 3 }),
    };
    const ids = getReviewCandidates(HANGUL_CHARACTERS, progress).map((c) => c.id);
    expect(ids).toEqual(['c-d', 'c-n']);
  });

  it('sorts by lowest accuracy first', () => {
    const progress: ProgressMap = {
      'c-g': makeProgress({ shownCount: 10, unassistedCorrectCount: 8, incorrectCount: 2 }),
      'c-n': makeProgress({ shownCount: 10, unassistedCorrectCount: 5, incorrectCount: 5 }),
      'c-d': makeProgress({ shownCount: 10, unassistedCorrectCount: 1, incorrectCount: 9 }),
    };
    expect(getReviewCandidates(HANGUL_CHARACTERS, progress).map((c) => c.id)).toEqual([
      'c-d',
      'c-n',
      'c-g',
    ]);
  });

  it('returns an empty list when nothing has been missed', () => {
    expect(getReviewCandidates(HANGUL_CHARACTERS, {})).toEqual([]);
  });
});
