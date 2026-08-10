import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionBar } from './components/ActionBar';
import { ChartDrawer, ChartPanel } from './components/ChartSurface';
import { ConfirmDialog } from './components/ConfirmDialog';
import { HangulChart } from './components/HangulChart';
import { QuizCard } from './components/QuizCard';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsPanel } from './components/StatsPanel';
import { TabBar } from './components/TabBar';
import { SettingsIcon } from './components/icons';
import { CHARACTERS_BY_ID, HANGUL_CHARACTERS } from './data/hangul';
import { TABS } from './data/tabs';
import { useLearningTelemetry } from './hooks/useLearningTelemetry';
import { useMediaQuery } from './hooks/useMediaQuery';
import { usePersistedState } from './hooks/usePersistedState';
import { useQuiz } from './hooks/useQuiz';
import {
  trackCategoryChanged,
  trackChartOpened,
  trackCharacterMastered,
  trackQuizAnswer,
  trackReviewStarted,
  trackTestModeStarted,
} from './lib/analytics';
import { countMastered, isMastered, recordAnswer } from './lib/progress';
import { getReviewCandidates } from './lib/quiz';
import { isSpeechSupported, speakHangul } from './lib/speech';
import type { AnswerResult, HangulCategory, QuizMode } from './types';

const speechSupported = isSpeechSupported();
const DESKTOP_QUERY = '(min-width: 1024px)';

export default function App() {
  const { state, setState, resetAll } = usePersistedState();
  const [mode, setMode] = useState<QuizMode>('char-to-sound');
  const [reviewMode, setReviewMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  const { progress, settings, bestStreak } = state;
  const { enabledCategories, testMode } = settings;
  const enabledKey = [...enabledCategories].sort().join(',');

  const enabledCharacters = useMemo(
    () => HANGUL_CHARACTERS.filter((character) => enabledCategories.includes(character.category)),
    [enabledCategories],
  );

  const reviewCandidates = useMemo(
    () => getReviewCandidates(enabledCharacters, progress),
    [enabledCharacters, progress],
  );

  const hasNothingToReview = reviewMode && reviewCandidates.length === 0;

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

  // A new learning set, a new direction or entering test mode means a fresh card.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    restart();
  }, [enabledKey, reviewMode, mode, testMode, restart]);

  const closeChart = useCallback(() => setChartOpen(false), []);

  const toggleChart = useCallback(() => {
    if (testMode) return;
    if (chartOpen) {
      setChartOpen(false);
      return;
    }
    // Consulting the chart taints the card that is already on screen.
    markAssisted();
    setChartOpen(true);
    trackChartOpened({ mode, mobile: !isDesktop });
  }, [chartOpen, isDesktop, markAssisted, mode, testMode]);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!question) return;
      answer(optionId);
      if (settings.soundEnabled && optionId === question.prompt.id) {
        speakHangul(question.prompt.character);
      }
    },
    [answer, question, settings.soundEnabled],
  );

  const handleSpeak = useCallback(
    (text: string) => {
      if (settings.soundEnabled) speakHangul(text);
    },
    [settings.soundEnabled],
  );

  const toggleCategory = useCallback(
    (category: HangulCategory) => {
      const next = enabledCategories.includes(category)
        ? enabledCategories.filter((item) => item !== category)
        : [...enabledCategories, category];
      if (next.length === 0) return;

      setState((current) => ({
        ...current,
        settings: { ...current.settings, enabledCategories: next },
      }));
      trackCategoryChanged(next.length);
    },
    [enabledCategories, setState],
  );

  const toggleSound = useCallback(() => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, soundEnabled: !current.settings.soundEnabled },
    }));
  }, [setState]);

  const toggleTestMode = useCallback(() => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, testMode: !current.settings.testMode },
    }));
    setChartOpen(false);
    if (!testMode) trackTestModeStarted();
  }, [setState, testMode]);

  const toggleReviewMode = useCallback(() => {
    if (!reviewMode) trackReviewStarted(reviewCandidates.length);
    setReviewMode(!reviewMode);
  }, [reviewCandidates.length, reviewMode]);

  const handleRestartSession = useCallback(() => {
    telemetry.completeSession();
    resetSession();
  }, [resetSession, telemetry]);

  const handleClearProgress = useCallback(() => {
    resetAll();
    setReviewMode(false);
    setConfirmOpen(false);
    handleRestartSession();
  }, [handleRestartSession, resetAll]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (confirmOpen || event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.isContentEditable) return;

      if (event.key >= '1' && event.key <= '4') {
        const option = question?.options[Number(event.key) - 1];
        if (option) {
          event.preventDefault();
          handleSelect(option.id);
        }
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (feedback) return;
        event.preventDefault();
        setMode((current) => (current === 'char-to-sound' ? 'sound-to-char' : 'char-to-sound'));
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        toggleReviewMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmOpen, feedback, handleSelect, question, toggleReviewMode]);

  const masteredCount = countMastered(enabledCharacters, progress);
  const activeTab = TABS.find((tab) => tab.id === mode);
  const showDesktopChart = chartOpen && isDesktop;

  // Marking the asked character would hand the answer over in the reverse tab.
  const chart = (
    <HangulChart
      progress={progress}
      highlightedId={mode === 'char-to-sound' ? (question?.prompt.id ?? null) : null}
      canSpeak={speechSupported && settings.soundEnabled}
      onConsult={markAssisted}
      onSpeak={handleSpeak}
    />
  );

  return (
    <div
      className={[
        'mx-auto flex min-h-dvh w-full flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-6',
        showDesktopChart ? 'max-w-5xl' : 'max-w-xl',
      ].join(' ')}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
            Hangul Flashcards
          </h1>
          <p className="truncate text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            {activeTab?.hint}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen((current) => !current)}
          aria-expanded={settingsOpen}
          aria-controls="settings-panel"
          aria-label={settingsOpen ? 'Đóng bảng cài đặt' : 'Mở bảng cài đặt bộ chữ'}
          className={[
            'shrink-0 rounded-xl border p-2.5 transition-colors',
            settingsOpen
              ? 'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-600'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
          ].join(' ')}
        >
          <SettingsIcon />
        </button>
      </header>

      {settingsOpen && (
        <div id="settings-panel" className="animate-fade-up">
          <SettingsPanel
            enabledCategories={enabledCategories}
            testMode={testMode}
            onToggleCategory={toggleCategory}
            onToggleTestMode={toggleTestMode}
          />
        </div>
      )}

      <div
        className={
          showDesktopChart ? 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]' : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <TabBar activeMode={mode} onChange={setMode} />

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
                Bạn chưa trả lời sai chữ nào trong bộ đang học. Cứ học bình thường, những chữ trả
                lời sai sẽ tự xuất hiện ở đây.
              </p>
              <button
                type="button"
                onClick={() => setReviewMode(false)}
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
              canSpeak={speechSupported && settings.soundEnabled}
              onSelect={handleSelect}
              onSpeak={handleSpeak}
            />
          ) : (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Hãy bật ít nhất một nhóm chữ trong phần cài đặt để bắt đầu học.
              </p>
            </section>
          )}

          <ActionBar
            chartOpen={chartOpen}
            chartLocked={testMode}
            reviewMode={reviewMode}
            soundEnabled={settings.soundEnabled}
            speechSupported={speechSupported}
            onToggleChart={toggleChart}
            onRestartSession={handleRestartSession}
            onToggleReview={toggleReviewMode}
            onToggleSound={toggleSound}
            onRequestClearProgress={() => setConfirmOpen(true)}
          />
        </div>

        {showDesktopChart && <ChartPanel onClose={closeChart}>{chart}</ChartPanel>}
      </div>

      <footer className="mt-auto pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        <p className="hidden sm:block">
          Phím tắt: <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án · <kbd>←</kbd> <kbd>→</kbd> đổi tab ·{' '}
          <kbd>R</kbd> ôn chữ sai
        </p>
        <p className="mt-1">Tiến độ được lưu ngay trên trình duyệt của bạn.</p>
      </footer>

      {chartOpen && !isDesktop && <ChartDrawer onClose={closeChart}>{chart}</ChartDrawer>}

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa toàn bộ tiến độ?"
        description="Toàn bộ tiến độ đã lưu sẽ bị xóa khỏi trình duyệt: số lần đúng/sai của từng chữ, danh sách chữ đã thuộc, chuỗi cao nhất và cài đặt bộ chữ. Thao tác này không thể hoàn tác."
        confirmLabel="Xóa tiến độ"
        cancelLabel="Giữ lại"
        onConfirm={handleClearProgress}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
