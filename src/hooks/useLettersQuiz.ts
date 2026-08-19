import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { CHARACTERS_BY_ID, charactersInCategories } from '../data/hangul';
import { trackCharacterMastered, trackQuizAnswer, trackReviewStarted } from '../lib/analytics';
import { countMastered, isMastered, recordAnswer } from '../lib/progress';
import { getReviewCandidates } from '../lib/quiz';
import { primeSpeechOnGesture, speak } from '../lib/speech';
import type { AnswerResult, PersistedState, QuizMode } from '../types';
import { useLearningTelemetry } from './useLearningTelemetry';
import { useQuiz } from './useQuiz';

type UseLettersQuizArgs = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
  mode: QuizMode;
  chartOpen: boolean;
};

/**
 * Everything the letters quiz needs, in one place: the character pool, the
 * adaptive question loop, long-term progress, review mode and telemetry.
 *
 * This exists so `LettersSection` stays a composition file. Without it the
 * wiring simply moves out of `App.tsx` and makes the section the new
 * three-hundred-line component.
 */
export function useLettersQuiz({ state, setState, mode, chartOpen }: UseLettersQuizArgs) {
  const { progress, settings, bestStreak } = state;
  const { enabledCategories, testMode } = settings;
  const [reviewMode, setReviewMode] = useState(false);

  const enabledKey = [...enabledCategories].sort().join(',');

  const enabledCharacters = useMemo(
    () => charactersInCategories(enabledCategories),
    [enabledCategories],
  );

  const reviewCandidates = useMemo(
    () => getReviewCandidates(enabledCharacters, progress),
    [enabledCharacters, progress],
  );

  const telemetry = useLearningTelemetry();

  const handleAnswered = useCallback(
    (characterId: string, result: AnswerResult, sessionStreak: number) => {
      const nextProgress = recordAnswer(progress, characterId, result, Date.now());
      setState((current) => ({
        ...current,
        progress: nextProgress,
        bestStreak: Math.max(current.bestStreak, sessionStreak),
      }));

      const { category } = CHARACTERS_BY_ID[characterId];
      telemetry.recordAnswer(result);
      trackQuizAnswer({ mode, category, result, reviewMode, testMode });
      if (!isMastered(progress[characterId]) && isMastered(nextProgress[characterId])) {
        trackCharacterMastered(category);
      }
    },
    [mode, progress, reviewMode, setState, telemetry, testMode],
  );

  const quiz = useQuiz({
    candidates: reviewMode ? reviewCandidates : enabledCharacters,
    optionPool: enabledCharacters,
    progress,
    selectionMode: reviewMode ? 'review' : 'study',
    chartOpen,
    onAnswered: handleAnswered,
  });

  const { restart, resetSession, answer, markAssisted, question, feedback } = quiz;

  // Consulting the chart taints the card already on screen. A card dealt while
  // the chart is open is assisted from birth (useQuiz reads `chartOpen`), so
  // this covers the other case: the chart opening over a live card.
  useEffect(() => {
    if (chartOpen) markAssisted();
  }, [chartOpen, markAssisted]);

  // A new learning set, a new direction or entering test mode means a fresh card.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    restart();
  }, [enabledKey, reviewMode, mode, testMode, restart]);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!question) return;
      primeSpeechOnGesture();
      answer(optionId);
      if (settings.soundEnabled && optionId === question.prompt.id) {
        speak(question.prompt.demoSyllable);
      }
    },
    [answer, question, settings.soundEnabled],
  );

  /**
   * On "Chữ → Âm" the sound *is* the answer, so listening before answering
   * counts as assistance — the same reasoning that makes opening the chart
   * count. On the reverse tab hearing it reveals nothing about which glyph
   * writes the sound, so it stays free.
   */
  const handleSpeakPrompt = useCallback(() => {
    if (!question) return;
    primeSpeechOnGesture();
    if (mode === 'char-to-sound' && !feedback) markAssisted();
    if (settings.soundEnabled) speak(question.prompt.demoSyllable);
  }, [feedback, markAssisted, mode, question, settings.soundEnabled]);

  const toggleReviewMode = useCallback(() => {
    if (!reviewMode) trackReviewStarted(reviewCandidates.length);
    setReviewMode((current) => !current);
  }, [reviewCandidates.length, reviewMode]);

  const restartSession = useCallback(() => {
    telemetry.completeSession();
    resetSession();
  }, [resetSession, telemetry]);

  /** Called when long-term progress is wiped, so the session counters follow. */
  const reset = useCallback(() => {
    setReviewMode(false);
    restartSession();
  }, [restartSession]);

  return {
    quiz,
    markAssisted,
    reviewMode,
    toggleReviewMode,
    reviewCandidates,
    enabledCharacters,
    masteredCount: countMastered(enabledCharacters, progress),
    bestStreak,
    handleSelect,
    handleSpeakPrompt,
    restartSession,
    reset,
  };
}
