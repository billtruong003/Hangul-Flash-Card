import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { charactersInCategories } from '../data/hangul';
import { STROKES } from '../data/strokes';
import { trackStrokeAttempt } from '../lib/analytics';
import { matchStroke, scoreAttempt, type Point, type StrokeFeedback } from '../lib/stroke';
import type { HangulCharacter, PersistedState, StrokeProgress } from '../types';

const DEMO_STEP_MS = 420;

function emptyStrokeProgress(): StrokeProgress {
  return {
    attemptCount: 0,
    cleanCount: 0,
    bestScore: 0,
    lastScore: 0,
    currentCleanStreak: 0,
    lastPracticedAt: null,
  };
}

type UseStrokePracticeArgs = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
};

/**
 * Drives one letter at a time: which stroke is due, whether the last attempt
 * landed, and what to record when the letter is finished.
 *
 * Letters come from the categories already enabled in settings, so this surface
 * does not introduce a second, separately-configured study set.
 */
export function useStrokePractice({ state, setState }: UseStrokePracticeArgs) {
  const { enabledCategories } = state.settings;

  const letters = useMemo(() => charactersInCategories(enabledCategories), [enabledCategories]);

  const [index, setIndex] = useState(0);
  const letter: HangulCharacter | undefined = letters[Math.min(index, letters.length - 1)];
  // Memoised so the empty-array fallback does not produce a new reference on
  // every render and invalidate everything that depends on it.
  const strokes = useMemo(() => (letter ? (STROKES[letter.id] ?? []) : []), [letter]);

  const [completed, setCompleted] = useState(0);
  const [feedback, setFeedback] = useState<StrokeFeedback>('idle');
  const [showHint, setShowHint] = useState(true);
  const [demoStroke, setDemoStroke] = useState<number | null>(null);
  /** Attempts spent on each stroke of the letter currently on screen. */
  const attemptsRef = useRef<number[]>([]);
  const [finishedScore, setFinishedScore] = useState<number | null>(null);

  const reset = useCallback(() => {
    setCompleted(0);
    setFeedback('idle');
    setDemoStroke(null);
    setFinishedScore(null);
    attemptsRef.current = [];
  }, []);

  // A different letter — or a different study set — starts from a clean slate.
  useEffect(() => {
    reset();
  }, [letter?.id, reset]);

  useEffect(() => {
    setIndex(0);
  }, [enabledCategories]);

  // Demo animation: reveal one stroke at a time, then hand the pad back.
  useEffect(() => {
    if (demoStroke === null) return;
    if (demoStroke >= strokes.length) {
      const done = window.setTimeout(() => setDemoStroke(null), DEMO_STEP_MS);
      return () => window.clearTimeout(done);
    }
    const next = window.setTimeout(() => setDemoStroke(demoStroke + 1), DEMO_STEP_MS);
    return () => window.clearTimeout(next);
  }, [demoStroke, strokes.length]);

  const recordFinished = useCallback(
    (score: number, clean: boolean) => {
      if (!letter) return;
      setState((current) => {
        const previous = current.strokes[letter.id] ?? emptyStrokeProgress();
        return {
          ...current,
          strokes: {
            ...current.strokes,
            [letter.id]: {
              attemptCount: previous.attemptCount + 1,
              cleanCount: previous.cleanCount + (clean ? 1 : 0),
              bestScore: Math.max(previous.bestScore, score),
              lastScore: score,
              currentCleanStreak: clean ? previous.currentCleanStreak + 1 : 0,
              lastPracticedAt: Date.now(),
            },
          },
        };
      });
      trackStrokeAttempt({ category: letter.category, clean });
    },
    [letter, setState],
  );

  const handleStrokeDrawn = useCallback(
    (points: Point[]) => {
      if (!letter || completed >= strokes.length) return;

      attemptsRef.current[completed] = (attemptsRef.current[completed] ?? 0) + 1;
      const result = matchStroke(points, strokes, completed, { hintVisible: showHint });

      if (!result.isMatch) {
        setFeedback(result.isBackwards ? 'backwards' : 'wrong');
        return;
      }

      setFeedback('idle');
      const next = completed + 1;
      setCompleted(next);

      if (next === strokes.length) {
        const perStroke = strokes.map((_, i) => ({ attempts: attemptsRef.current[i] ?? 1 }));
        const score = scoreAttempt(perStroke);
        setFinishedScore(score);
        recordFinished(
          score,
          perStroke.every((stroke) => stroke.attempts === 1),
        );
      }
    },
    [completed, letter, recordFinished, showHint, strokes],
  );

  const next = useCallback(() => {
    if (letters.length === 0) return;
    setIndex((current) => (current + 1) % letters.length);
  }, [letters.length]);

  const progress = letter ? state.strokes[letter.id] : undefined;

  return {
    letter,
    letters,
    strokes,
    completed,
    feedback,
    showHint,
    demoStroke,
    finishedScore,
    progress,
    toggleHint: () => setShowHint((current) => !current),
    playDemo: () => {
      reset();
      setDemoStroke(0);
    },
    retry: reset,
    next,
    handleStrokeDrawn,
  };
}
