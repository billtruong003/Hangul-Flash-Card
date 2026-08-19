import type { CharacterProgress, HangulCharacter, ProgressMap } from '../types';
import { isMastered, unassistedAccuracyOf } from './progress';

export type RandomFn = () => number;

export type SelectionMode = 'study' | 'review';

export const OPTION_COUNT = 4;

const WEIGHT_UNSEEN = 12;
const WEIGHT_MASTERED = 0.25;
const WEIGHT_RECENT_MISTAKE_BONUS = 3;
const WEIGHT_RECENT_ASSIST_BONUS = 1.5;

export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selection weight for one character. Always > 0 so nothing is ever unreachable.
 * Unseen characters dominate, then low unassisted accuracy, then a bonus for how
 * the character went last time: a wrong answer outranks a chart-assisted one,
 * which in turn outranks an answer the learner got right on their own. Only
 * unassisted mastery drops a character to the small floor weight.
 */
export function computeWeight(
  progress: CharacterProgress | undefined,
  mode: SelectionMode = 'study',
): number {
  if (mode === 'review') {
    if (!progress) return 1;
    return 1 + (1 - unassistedAccuracyOf(progress)) * 12 + Math.min(progress.incorrectCount, 5);
  }

  if (!progress || progress.shownCount === 0) return WEIGHT_UNSEEN;
  if (isMastered(progress)) return WEIGHT_MASTERED;

  const weight = 1 + (1 - unassistedAccuracyOf(progress)) * 6;
  if (progress.lastResult === 'incorrect') return weight + WEIGHT_RECENT_MISTAKE_BONUS;
  if (progress.lastResult === 'correct-assisted') return weight + WEIGHT_RECENT_ASSIST_BONUS;
  return weight;
}

function pickWeightedIndex(weights: number[], random: RandomFn): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return Math.floor(random() * weights.length);

  let threshold = random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    threshold -= weights[i];
    if (threshold < 0) return i;
  }
  return weights.length - 1;
}

/**
 * Adaptive pick. Never returns `lastShownId` while another candidate exists.
 */
export function pickNextCharacter(
  candidates: readonly HangulCharacter[],
  progress: ProgressMap,
  lastShownId: string | null,
  random: RandomFn = Math.random,
  mode: SelectionMode = 'study',
): HangulCharacter | null {
  if (candidates.length === 0) return null;

  const withoutRepeat = candidates.filter((character) => character.id !== lastShownId);
  const pool = withoutRepeat.length > 0 ? withoutRepeat : [...candidates];
  const weights = pool.map((character) => computeWeight(progress[character.id], mode));

  return pool[pickWeightedIndex(weights, random)];
}

/**
 * Builds exactly `optionCount` unique answers containing `correct`.
 * Distractors prefer declared confusables, then the same category, then the rest
 * of the pool. Pronunciation labels stay unique so no question has two right
 * answers — duplicates are only allowed if the pool is too small otherwise.
 */
export function buildAnswerOptions(
  correct: HangulCharacter,
  pool: readonly HangulCharacter[],
  random: RandomFn = Math.random,
  optionCount: number = OPTION_COUNT,
): HangulCharacter[] {
  const chosen: HangulCharacter[] = [correct];
  const usedIds = new Set([correct.id]);
  const usedLabels = new Set([correct.romaja]);

  const take = (candidate: HangulCharacter, allowDuplicateLabel = false): void => {
    if (chosen.length >= optionCount) return;
    if (usedIds.has(candidate.id)) return;
    if (!allowDuplicateLabel && usedLabels.has(candidate.romaja)) return;
    chosen.push(candidate);
    usedIds.add(candidate.id);
    usedLabels.add(candidate.romaja);
  };

  const byId = new Map(pool.map((character) => [character.id, character]));
  const confusables = shuffle(correct.confusableIds ?? [], random)
    .map((id) => byId.get(id))
    .filter((character): character is HangulCharacter => character !== undefined);

  for (const candidate of confusables) take(candidate);

  for (const candidate of shuffle(pool, random)) {
    if (candidate.category === correct.category) take(candidate);
  }

  for (const candidate of shuffle(pool, random)) take(candidate);

  if (chosen.length < optionCount) {
    for (const candidate of shuffle(pool, random)) take(candidate, true);
  }

  return shuffle(chosen, random);
}

/**
 * Picks the least-practised item, breaking ties at random, and never returns
 * `avoidKey` while another candidate exists. Scores each item once — the two
 * decks that used to do this inline scored every entry twice, via a
 * `Math.min(...map())` followed by a `filter`.
 */
export function pickLeastPractised<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  scoreOf: (item: T) => number,
  avoidKey: string | null,
  random: RandomFn = Math.random,
): T | null {
  if (items.length === 0) return null;

  const withoutRepeat = items.filter((item) => keyOf(item) !== avoidKey);
  const pool = withoutRepeat.length > 0 ? withoutRepeat : items;

  let lowest = Infinity;
  const tied: T[] = [];
  for (const item of pool) {
    const score = scoreOf(item);
    if (score < lowest) {
      lowest = score;
      tied.length = 0;
    }
    if (score === lowest) tied.push(item);
  }

  return tied[Math.floor(random() * tied.length)];
}

/** Characters the learner has gotten wrong at least once, worst accuracy first. */
export function getReviewCandidates(
  characters: readonly HangulCharacter[],
  progress: ProgressMap,
): HangulCharacter[] {
  return characters
    .filter((character) => (progress[character.id]?.incorrectCount ?? 0) > 0)
    .sort((a, b) => {
      const accuracyGap =
        unassistedAccuracyOf(progress[a.id]) - unassistedAccuracyOf(progress[b.id]);
      if (accuracyGap !== 0) return accuracyGap;
      return (progress[b.id]?.incorrectCount ?? 0) - (progress[a.id]?.incorrectCount ?? 0);
    });
}
