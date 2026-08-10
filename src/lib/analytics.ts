import { track } from '@vercel/analytics';
import type { AnswerResult, HangulCategory, QuizMode } from '../types';

/**
 * The only place that knows Vercel Analytics exists. Everything else in the app
 * calls the semantic `track*` functions below, so the provider can be swapped
 * without touching quiz logic.
 *
 * Nothing here is allowed to carry learner identity: no ids, no LocalStorage
 * contents, no per-character history, no free-form text. Every numeric payload
 * is bucketed before it leaves this module.
 */

export type AnalyticsEventName =
  | 'quiz_answer'
  | 'character_mastered'
  | 'chart_opened'
  | 'review_started'
  | 'test_mode_started'
  | 'learning_session_started'
  | 'learning_session_completed'
  | 'learning_categories_changed';

export type AnalyticsProperties = Record<string, string | number | boolean>;

export type AnalyticsTransport = (
  name: AnalyticsEventName,
  properties?: AnalyticsProperties,
) => void;

export type AnalyticsDirection = 'character-to-sound' | 'sound-to-character';

export type AnswersBucket = '1-9' | '10-24' | '25-49' | '50+';
export type AccuracyBucket = '<50' | '50-69' | '70-84' | '85+';
export type AssistedBucket = '0' | '1-4' | '5+';
export type MistakeBucket = '1-5' | '6-10' | '11+';

const DIRECTION_BY_MODE: Record<QuizMode, AnalyticsDirection> = {
  'char-to-sound': 'character-to-sound',
  'sound-to-char': 'sound-to-character',
};

const vercelTransport: AnalyticsTransport = (name, properties) => track(name, properties);

// Unit tests opt in explicitly via setAnalyticsTransport, so no test has to know
// that Vercel Analytics exists.
const isTestEnvironment = import.meta.env.MODE === 'test';

let transport: AnalyticsTransport | null = isTestEnvironment ? null : vercelTransport;

export function setAnalyticsTransport(next: AnalyticsTransport | null): void {
  transport = next;
}

export function resetAnalyticsTransport(): void {
  transport = isTestEnvironment ? null : vercelTransport;
}

/** Analytics is never load-bearing: a failing transport must not reach the UI. */
function emit(name: AnalyticsEventName, properties?: AnalyticsProperties): void {
  if (!transport) return;
  try {
    transport(name, properties);
  } catch {
    // Swallowed on purpose — a broken beacon must never break a quiz answer.
  }
}

// ── Bucketing ────────────────────────────────────────────────────────────────
// Exact counts would make a session fingerprintable, so they are widened here
// before any event is emitted. Pure and directly unit-tested.

export function bucketAnswers(count: number): AnswersBucket {
  if (count >= 50) return '50+';
  if (count >= 25) return '25-49';
  if (count >= 10) return '10-24';
  return '1-9';
}

export function bucketAccuracy(percent: number): AccuracyBucket {
  if (percent >= 85) return '85+';
  if (percent >= 70) return '70-84';
  if (percent >= 50) return '50-69';
  return '<50';
}

export function bucketAssisted(count: number): AssistedBucket {
  if (count >= 5) return '5+';
  if (count >= 1) return '1-4';
  return '0';
}

export function bucketMistakes(count: number): MistakeBucket {
  if (count >= 11) return '11+';
  if (count >= 6) return '6-10';
  return '1-5';
}

// ── Semantic events ──────────────────────────────────────────────────────────

export function trackQuizAnswer(payload: {
  mode: QuizMode;
  category: HangulCategory;
  result: AnswerResult;
  reviewMode: boolean;
  testMode: boolean;
}): void {
  emit('quiz_answer', {
    direction: DIRECTION_BY_MODE[payload.mode],
    category: payload.category,
    result: payload.result,
    reviewMode: payload.reviewMode,
    testMode: payload.testMode,
  });
}

/** Fired only on the not-mastered → mastered transition, never on every answer. */
export function trackCharacterMastered(category: HangulCategory): void {
  emit('character_mastered', { category });
}

export function trackChartOpened(payload: { mode: QuizMode; mobile: boolean }): void {
  emit('chart_opened', {
    direction: DIRECTION_BY_MODE[payload.mode],
    mobile: payload.mobile,
  });
}

export function trackReviewStarted(mistakeCount: number): void {
  emit('review_started', { mistakeBucket: bucketMistakes(mistakeCount) });
}

export function trackTestModeStarted(): void {
  emit('test_mode_started');
}

export function trackSessionStarted(): void {
  emit('learning_session_started');
}

export function trackSessionCompleted(totals: {
  answers: number;
  correct: number;
  assisted: number;
}): void {
  // "Accuracy" mirrors the app's own definition: unassisted correct answers over
  // every answer given, so chart lookups count against it.
  const percent = totals.answers === 0 ? 0 : (totals.correct / totals.answers) * 100;
  emit('learning_session_completed', {
    answers: bucketAnswers(totals.answers),
    accuracy: bucketAccuracy(percent),
    assisted: bucketAssisted(totals.assisted),
  });
}

export function trackCategoryChanged(enabledCount: number): void {
  emit('learning_categories_changed', { enabledCount });
}
