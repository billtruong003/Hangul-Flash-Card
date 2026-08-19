import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { trackSectionChanged } from '../lib/analytics';
import type { LearningSection, PersistedState, QuizMode } from '../types';

type UseSectionNavArgs = {
  section: LearningSection;
  setState: Dispatch<SetStateAction<PersistedState>>;
};

/**
 * Which surface is on screen, and which sub-mode the letters quiz is in.
 *
 * The letters sub-mode is kept here rather than inside the letters surface so
 * it survives a trip through another section — and, less obviously, so the app
 * shell can still report it. The `chart_opened` analytics event has always
 * carried the quiz direction, and the chart is now reachable from every
 * section; holding the sub-mode at this level keeps that payload meaningful
 * instead of forcing a nullable field into it.
 */
export function useSectionNav({ section, setState }: UseSectionNavArgs) {
  const [letterMode, setLetterMode] = useState<QuizMode>('char-to-sound');

  const setSection = useCallback(
    (next: LearningSection) => {
      if (next === section) return;
      trackSectionChanged(next);
      setState((current) => ({ ...current, ui: { ...current.ui, section: next } }));
    },
    [section, setState],
  );

  return { section, setSection, letterMode, setLetterMode };
}
