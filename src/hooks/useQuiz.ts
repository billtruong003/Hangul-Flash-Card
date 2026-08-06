import { useCallback, useEffect, useRef, useState } from 'react';
import { buildAnswerOptions, pickNextCharacter, type SelectionMode } from '../lib/quiz';
import type { AnswerResult, HangulCharacter, ProgressMap, Question, SessionStats } from '../types';

export const CORRECT_DELAY_MS = 700;
export const INCORRECT_DELAY_MS = 1350;

export type Feedback = {
  selectedId: string;
  correctId: string;
  result: AnswerResult;
};

type QuizSource = {
  /** Characters allowed to appear as the question prompt. */
  candidates: HangulCharacter[];
  /** Characters allowed to appear as answer options — always the full enabled set. */
  optionPool: HangulCharacter[];
  progress: ProgressMap;
  selectionMode: SelectionMode;
  /** A chart that is already open makes the next question assisted from the start. */
  chartOpen: boolean;
};

type UseQuizArgs = QuizSource & {
  onAnswered: (characterId: string, result: AnswerResult, sessionStreak: number) => void;
};

const EMPTY_SESSION: SessionStats = { correct: 0, assisted: 0, incorrect: 0, currentStreak: 0 };

function createQuestion(source: QuizSource, lastPromptId: string | null): Question | null {
  const prompt = pickNextCharacter(
    source.candidates,
    source.progress,
    lastPromptId,
    Math.random,
    source.selectionMode,
  );
  if (!prompt) return null;
  return {
    prompt,
    options: buildAnswerOptions(prompt, source.optionPool),
    assisted: source.chartOpen,
  };
}

function resultOf(question: Question, optionId: string): AnswerResult {
  if (optionId !== question.prompt.id) return 'incorrect';
  return question.assisted ? 'correct-assisted' : 'correct-unassisted';
}

export function useQuiz({
  candidates,
  optionPool,
  progress,
  selectionMode,
  chartOpen,
  onAnswered,
}: UseQuizArgs) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [session, setSession] = useState<SessionStats>(EMPTY_SESSION);

  const timerRef = useRef<number | null>(null);
  const answeringRef = useRef(false);
  const sourceRef = useRef<QuizSource>({
    candidates,
    optionPool,
    progress,
    selectionMode,
    chartOpen,
  });
  const onAnsweredRef = useRef(onAnswered);

  // Runs before the effects declared by the calling component, so a caller that
  // reacts to changed settings already sees the new source here.
  useEffect(() => {
    sourceRef.current = { candidates, optionPool, progress, selectionMode, chartOpen };
    onAnsweredRef.current = onAnswered;
  });

  const clearPendingAdvance = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingAdvance, [clearPendingAdvance]);

  /** Drops the current card and deals a new one from the current settings. */
  const restart = useCallback(() => {
    clearPendingAdvance();
    answeringRef.current = false;
    setFeedback(null);
    setQuestion(createQuestion(sourceRef.current, null));
  }, [clearPendingAdvance]);

  useEffect(() => {
    restart();
  }, [restart]);

  const advance = useCallback(() => {
    clearPendingAdvance();
    answeringRef.current = false;
    setFeedback(null);
    setQuestion(createQuestion(sourceRef.current, question?.prompt.id ?? null));
  }, [clearPendingAdvance, question]);

  /** Called whenever the learner consults the chart while a card is on screen. */
  const markAssisted = useCallback(() => {
    setQuestion((current) =>
      current && !current.assisted ? { ...current, assisted: true } : current,
    );
  }, []);

  const answer = useCallback(
    (optionId: string) => {
      if (!question || answeringRef.current) return;
      answeringRef.current = true;

      const result = resultOf(question, optionId);
      const sessionStreak =
        result === 'correct-unassisted'
          ? session.currentStreak + 1
          : result === 'incorrect'
            ? 0
            : session.currentStreak;

      setFeedback({ selectedId: optionId, correctId: question.prompt.id, result });
      setSession({
        correct: session.correct + (result === 'correct-unassisted' ? 1 : 0),
        assisted: session.assisted + (result === 'correct-assisted' ? 1 : 0),
        incorrect: session.incorrect + (result === 'incorrect' ? 1 : 0),
        currentStreak: sessionStreak,
      });
      onAnsweredRef.current(question.prompt.id, result, sessionStreak);

      timerRef.current = window.setTimeout(
        advance,
        result === 'incorrect' ? INCORRECT_DELAY_MS : CORRECT_DELAY_MS,
      );
    },
    [question, session, advance],
  );

  const resetSession = useCallback(() => {
    setSession(EMPTY_SESSION);
    restart();
  }, [restart]);

  return { question, feedback, session, answer, markAssisted, restart, resetSession };
}
