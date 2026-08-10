import { useCallback, useRef } from 'react';
import { trackSessionCompleted, trackSessionStarted } from '../lib/analytics';
import type { AnswerResult } from '../types';

type SessionTotals = { answers: number; correct: number; assisted: number };

const EMPTY_TOTALS: SessionTotals = { answers: 0, correct: 0, assisted: 0 };

/**
 * In-memory counters behind the session analytics events. Deliberately kept out
 * of LocalStorage and out of the quiz state: this is telemetry bookkeeping, not
 * learner progress, and it should disappear on reload.
 */
export function useLearningTelemetry() {
  const totals = useRef<SessionTotals>({ ...EMPTY_TOTALS });
  const started = useRef(false);

  const recordAnswer = useCallback((result: AnswerResult) => {
    if (!started.current) {
      started.current = true;
      trackSessionStarted();
    }
    totals.current.answers += 1;
    if (result === 'correct-unassisted') totals.current.correct += 1;
    if (result === 'correct-assisted') totals.current.assisted += 1;
  }, []);

  /** No-op until at least one question has been answered. */
  const completeSession = useCallback(() => {
    if (!started.current) return;
    trackSessionCompleted(totals.current);
    started.current = false;
    totals.current = { ...EMPTY_TOTALS };
  }, []);

  return { recordAnswer, completeSession };
}
