import { useEffect } from 'react';
import { QuizActions } from '../components/QuizActions';
import { QuizCard } from '../components/QuizCard';
import { StatsPanel } from '../components/StatsPanel';
import { TabBar } from '../components/TabBar';
import { TABS } from '../data/tabs';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { useLettersQuiz } from '../hooks/useLettersQuiz';
import type { QuizMode } from '../types';

type LettersSectionProps = {
  letters: ReturnType<typeof useLettersQuiz>;
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  canSpeak: boolean;
  testMode: boolean;
  shortcutsDisabled: boolean;
  /** Lets the shell tell this surface the chart was consulted. */
  registerChartConsumer: (onConsult: () => void) => () => void;
};

export function LettersSection({
  letters,
  mode,
  onModeChange,
  canSpeak,
  testMode,
  shortcutsDisabled,
  registerChartConsumer,
}: LettersSectionProps) {
  const {
    quiz,
    markAssisted,
    reviewMode,
    toggleReviewMode,
    reviewCandidates,
    enabledCharacters,
    masteredCount,
    bestStreak,
    handleSelect,
    handleSpeakPrompt,
    restartSession,
  } = letters;

  const { question, feedback } = quiz;
  const hasNothingToReview = reviewMode && reviewCandidates.length === 0;

  // The chart lives in the shell because every surface can open it, but only
  // this one treats consulting it as assistance.
  useEffect(() => registerChartConsumer(markAssisted), [markAssisted, registerChartConsumer]);

  useKeyboardShortcuts(
    {
      onNumber: (index) => {
        const option = question?.options[index];
        if (!option) return false;
        handleSelect(option.id);
      },
      onArrow: () => {
        if (feedback) return;
        onModeChange(mode === 'char-to-sound' ? 'sound-to-char' : 'char-to-sound');
      },
      onReview: toggleReviewMode,
    },
    shortcutsDisabled,
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <TabBar
        tabs={TABS}
        activeId={mode}
        panelId="quiz-panel"
        label="Chế độ học"
        onChange={(id) => onModeChange(id as QuizMode)}
      />

      <StatsPanel
        correct={quiz.session.correct}
        assisted={quiz.session.assisted}
        incorrect={quiz.session.incorrect}
        currentStreak={quiz.session.currentStreak}
        bestStreak={bestStreak}
        masteredCount={masteredCount}
        studyingCount={enabledCharacters.length}
      />

      {testMode && (
        <p className="rounded-xl bg-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-700 sm:text-sm dark:bg-slate-800 dark:text-slate-200">
          Chế độ kiểm tra — bảng chữ Hangul đang bị khóa
        </p>
      )}

      {reviewMode && !hasNothingToReview && (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-center text-xs font-medium text-amber-900 sm:text-sm dark:bg-amber-950/50 dark:text-amber-200">
          Đang ôn {reviewCandidates.length} chữ từng trả lời sai
        </p>
      )}

      {hasNothingToReview ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold sm:text-lg">Chưa có chữ nào sai</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Bạn chưa trả lời sai chữ nào trong bộ đang học. Cứ học bình thường, những chữ trả lời
            sai sẽ tự xuất hiện ở đây.
          </p>
          <button
            type="button"
            onClick={toggleReviewMode}
            className="mt-4 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 dark:hover:bg-sky-500"
          >
            Quay lại học bình thường
          </button>
        </section>
      ) : question ? (
        <QuizCard
          question={question}
          feedback={feedback}
          mode={mode}
          canSpeak={canSpeak}
          onSelect={handleSelect}
          onSpeakPrompt={handleSpeakPrompt}
        />
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hãy bật ít nhất một nhóm chữ trong phần cài đặt để bắt đầu học.
          </p>
        </section>
      )}

      <QuizActions
        reviewMode={reviewMode}
        onRestartSession={restartSession}
        onToggleReview={toggleReviewMode}
      />
    </div>
  );
}
