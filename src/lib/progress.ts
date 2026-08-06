import type { AnswerResult, CharacterProgress, HangulCharacter, ProgressMap } from '../types';

export const MASTERY_MIN_CORRECT = 5;
export const MASTERY_MIN_STREAK = 3;
export const MASTERY_MIN_ACCURACY = 0.8;

export function createEmptyProgress(): CharacterProgress {
  return {
    shownCount: 0,
    unassistedCorrectCount: 0,
    assistedCorrectCount: 0,
    incorrectCount: 0,
    currentUnassistedCorrectStreak: 0,
    lastShownAt: null,
  };
}

export function answeredCount(progress: CharacterProgress): number {
  return progress.unassistedCorrectCount + progress.assistedCorrectCount + progress.incorrectCount;
}

/**
 * Share of *all* answers the learner got right without opening the chart.
 * Assisted answers stay in the denominator on purpose: looking a character up
 * is evidence it is not known yet, so it should hold mastery back.
 */
export function unassistedAccuracyOf(progress: CharacterProgress | undefined): number {
  if (!progress) return 0;
  const answered = answeredCount(progress);
  return answered === 0 ? 0 : progress.unassistedCorrectCount / answered;
}

export function isMastered(progress: CharacterProgress | undefined): boolean {
  if (!progress) return false;
  return (
    progress.unassistedCorrectCount >= MASTERY_MIN_CORRECT &&
    progress.currentUnassistedCorrectStreak >= MASTERY_MIN_STREAK &&
    unassistedAccuracyOf(progress) >= MASTERY_MIN_ACCURACY
  );
}

export function countMastered(characters: HangulCharacter[], progress: ProgressMap): number {
  return characters.filter((character) => isMastered(progress[character.id])).length;
}

/**
 * An assisted correct answer is neutral for the mastery streak: it neither
 * extends it nor breaks it. Only a wrong answer resets it.
 */
function nextStreak(previous: CharacterProgress, result: AnswerResult): number {
  if (result === 'correct-unassisted') return previous.currentUnassistedCorrectStreak + 1;
  if (result === 'incorrect') return 0;
  return previous.currentUnassistedCorrectStreak;
}

export function recordAnswer(
  progress: ProgressMap,
  characterId: string,
  result: AnswerResult,
  answeredAt: number,
): ProgressMap {
  const previous = progress[characterId] ?? createEmptyProgress();
  return {
    ...progress,
    [characterId]: {
      shownCount: previous.shownCount + 1,
      unassistedCorrectCount:
        previous.unassistedCorrectCount + (result === 'correct-unassisted' ? 1 : 0),
      assistedCorrectCount: previous.assistedCorrectCount + (result === 'correct-assisted' ? 1 : 0),
      incorrectCount: previous.incorrectCount + (result === 'incorrect' ? 1 : 0),
      currentUnassistedCorrectStreak: nextStreak(previous, result),
      lastShownAt: answeredAt,
      lastResult: result,
    },
  };
}
