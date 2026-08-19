import { useCallback, useState, type ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { ChartDrawer, ChartPanel } from './components/ChartSurface';
import { ConfirmDialog } from './components/ConfirmDialog';
import { GlobalActions } from './components/GlobalActions';
import { HangulChart } from './components/HangulChart';
import { SectionNav } from './components/SectionNav';
import { SettingsPanel } from './components/SettingsPanel';
import { SpeechNotice } from './components/SpeechNotice';
import { SECTIONS, SECTION_IDS } from './data/sections';
import { TABS } from './data/tabs';
import { useChart } from './hooks/useChart';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLettersQuiz } from './hooks/useLettersQuiz';
import { useMediaQuery } from './hooks/useMediaQuery';
import { usePersistedState } from './hooks/usePersistedState';
import { useSectionNav } from './hooks/useSectionNav';
import { useSpeech } from './hooks/useSpeech';
import { trackCategoryChanged, trackChartOpened, trackTestModeStarted } from './lib/analytics';
import { primeSpeechOnGesture, speak, type SpeakOptions } from './lib/speech';
import { LettersSection } from './sections/LettersSection';
import { ListeningSection } from './sections/ListeningSection';
import { SyllableSection } from './sections/SyllableSection';
import { WritingSection } from './sections/WritingSection';
import type { HangulCategory, LearningSection } from './types';

const DESKTOP_QUERY = '(min-width: 1024px)';

export default function App() {
  const { state, setState, resetAll } = usePersistedState();
  // Voice availability only settles asynchronously, so this cannot be hoisted
  // to a module constant the way it used to be.
  const speech = useSpeech();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { progress, settings } = state;
  const { enabledCategories, testMode } = settings;

  const { section, setSection, letterMode, setLetterMode } = useSectionNav({
    section: state.ui.section,
    setState,
  });

  const onChartOpened = useCallback(() => {
    // Always the letters sub-mode, which useSectionNav keeps alive regardless
    // of which section is on screen — so this payload stays meaningful now the
    // chart is reachable from everywhere.
    trackChartOpened({ mode: letterMode, mobile: !isDesktop });
  }, [isDesktop, letterMode]);

  const { chartOpen, toggleChart, closeChart } = useChart({
    locked: testMode,
    onOpened: onChartOpened,
  });

  const letters = useLettersQuiz({ state, setState, mode: letterMode, chartOpen });

  const handleSpeak = useCallback(
    (text: string, options?: SpeakOptions) => {
      primeSpeechOnGesture();
      if (settings.soundEnabled) speak(text, options);
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
    // Turning sound on is a real user gesture, which is the only moment iOS
    // Safari lets us unlock the speech queue for later, timer-driven calls.
    primeSpeechOnGesture();
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
    closeChart();
    if (!testMode) trackTestModeStarted();
  }, [closeChart, setState, testMode]);

  const resetLetters = letters.reset;
  const handleClearProgress = useCallback(() => {
    resetAll();
    setConfirmOpen(false);
    resetLetters();
  }, [resetAll, resetLetters]);

  const stepSection = useCallback(
    (direction: -1 | 1) => {
      const index = SECTION_IDS.indexOf(section);
      const next = SECTION_IDS[(index + direction + SECTION_IDS.length) % SECTION_IDS.length];
      setSection(next);
    },
    [section, setSection],
  );

  // Shift + arrows move between surfaces from anywhere. Plain arrows belong to
  // whichever section is on screen.
  useKeyboardShortcuts({ onSectionArrow: stepSection }, confirmOpen);

  const canSpeak = speech.hasKoreanVoice && settings.soundEnabled;
  const showDesktopChart = chartOpen && isDesktop;

  const hint =
    section === 'letters'
      ? (TABS.find((tab) => tab.id === letterMode)?.hint ?? '')
      : (SECTIONS.find((item) => item.id === section)?.hint ?? '');

  // Marking the asked character would hand the answer over in the reverse tab.
  const chart = (
    <HangulChart
      progress={progress}
      highlightedId={
        section === 'letters' && letterMode === 'char-to-sound'
          ? (letters.quiz.question?.prompt.id ?? null)
          : null
      }
      canSpeak={canSpeak}
      onSpeak={handleSpeak}
    />
  );

  const surfaces: Record<LearningSection, ReactNode> = {
    letters: (
      <LettersSection
        letters={letters}
        mode={letterMode}
        onModeChange={setLetterMode}
        canSpeak={canSpeak}
        testMode={testMode}
        shortcutsDisabled={confirmOpen}
      />
    ),
    writing: (
      <WritingSection state={state} setState={setState} canSpeak={canSpeak} onSpeak={handleSpeak} />
    ),
    syllables: (
      <SyllableSection
        state={state}
        setState={setState}
        canSpeak={canSpeak}
        onSpeak={handleSpeak}
      />
    ),
    listening: <ListeningSection state={state} setState={setState} canSpeak={canSpeak} />,
  };

  return (
    <AppShell
      hint={hint}
      wide={showDesktopChart}
      settingsOpen={settingsOpen}
      onToggleSettings={() => setSettingsOpen((current) => !current)}
      settings={
        <SettingsPanel
          enabledCategories={enabledCategories}
          testMode={testMode}
          onToggleCategory={toggleCategory}
          onToggleTestMode={toggleTestMode}
        />
      }
      nav={<SectionNav active={section} onChange={setSection} />}
      footer={
        <>
          <p className="hidden sm:block">
            Phím tắt: <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án · <kbd>←</kbd> <kbd>→</kbd> đổi tab ·{' '}
            <kbd>Shift</kbd>+<kbd>←</kbd> <kbd>→</kbd> đổi khu vực · <kbd>R</kbd> ôn chữ sai
          </p>
          <p className="mt-1">Tiến độ được lưu ngay trên trình duyệt của bạn.</p>
        </>
      }
    >
      <div
        className={
          showDesktopChart ? 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]' : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <GlobalActions
            chartOpen={chartOpen}
            chartLocked={testMode}
            soundEnabled={settings.soundEnabled}
            speechSupported={speech.supported}
            hasKoreanVoice={speech.hasKoreanVoice}
            onToggleChart={toggleChart}
            onToggleSound={toggleSound}
            onRequestClearProgress={() => setConfirmOpen(true)}
          />

          <SpeechNotice
            soundEnabled={settings.soundEnabled}
            speechSupported={speech.supported}
            hasKoreanVoice={speech.hasKoreanVoice}
          />

          {surfaces[section]}
        </div>

        {showDesktopChart && <ChartPanel onClose={closeChart}>{chart}</ChartPanel>}
      </div>

      {chartOpen && !isDesktop && <ChartDrawer onClose={closeChart}>{chart}</ChartDrawer>}

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa toàn bộ tiến độ?"
        description="Toàn bộ tiến độ đã lưu sẽ bị xóa khỏi trình duyệt: số lần đúng/sai của từng chữ, danh sách chữ đã thuộc, chuỗi cao nhất, kết quả luyện viết, ghép chữ, nghe hiểu và cài đặt bộ chữ. Thao tác này không thể hoàn tác."
        confirmLabel="Xóa tiến độ"
        cancelLabel="Giữ lại"
        onConfirm={handleClearProgress}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  );
}
