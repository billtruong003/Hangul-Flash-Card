import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { SYLLABLES } from '../data/syllables';
import { trackSyllableBuilt } from '../lib/analytics';
import { primeSpeechOnGesture, speak } from '../lib/speech';
import { compose, decompose } from '../lib/syllable';
import type { PersistedState, SyllableEntry, SyllableProgress } from '../types';

function emptySyllableProgress(): SyllableProgress {
  return {
    builtCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    currentCorrectStreak: 0,
    lastBuiltAt: null,
  };
}

/** Least-practised first, so the deck does not keep asking what is already known. */
function pickNext(
  entries: SyllableEntry[],
  progress: Record<string, SyllableProgress>,
  avoid: string | null,
): SyllableEntry | null {
  const pool = entries.filter((entry) => entry.syllable !== avoid);
  if (pool.length === 0) return entries[0] ?? null;

  const scoreOf = (entry: SyllableEntry) => {
    const seen = progress[entry.syllable];
    if (!seen) return 0;
    return seen.correctCount + 1 - Math.min(seen.incorrectCount, 3) * 0.5;
  };

  const lowest = Math.min(...pool.map(scoreOf));
  const candidates = pool.filter((entry) => scoreOf(entry) === lowest);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

type UseSyllableBuilderArgs = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
  soundEnabled: boolean;
};

/**
 * The bridge between knowing the letters and reading real Korean: the learner
 * is given a syllable's sound and meaning, and has to assemble the letters that
 * write it. Producing 감 from "gam" exercises the initial/final rule directly,
 * which recognising ㄱ on a flashcard never does.
 */
export function useSyllableBuilder({ state, setState, soundEnabled }: UseSyllableBuilderArgs) {
  const [target, setTarget] = useState<SyllableEntry | null>(
    () => pickNext(SYLLABLES, state.syllables, null) ?? null,
  );
  const [initialId, setInitialId] = useState<string | null>(null);
  const [medialId, setMedialId] = useState<string | null>(null);
  const [finalId, setFinalId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [missedThisRound, setMissedThisRound] = useState(false);

  /** What the current selections spell, or null while still incomplete. */
  const preview = useMemo(
    () => (initialId && medialId ? compose(initialId, medialId, finalId) : null),
    [finalId, initialId, medialId],
  );

  const answer = useMemo(() => (target ? decompose(target.syllable) : null), [target]);

  const record = useCallback(
    (syllable: string, correct: boolean) => {
      setState((current) => {
        const previous = current.syllables[syllable] ?? emptySyllableProgress();
        return {
          ...current,
          syllables: {
            ...current.syllables,
            [syllable]: {
              builtCount: previous.builtCount + 1,
              correctCount: previous.correctCount + (correct ? 1 : 0),
              incorrectCount: previous.incorrectCount + (correct ? 0 : 1),
              currentCorrectStreak: correct ? previous.currentCorrectStreak + 1 : 0,
              lastBuiltAt: Date.now(),
            },
          },
        };
      });
    },
    [setState],
  );

  const clear = useCallback(() => {
    setInitialId(null);
    setMedialId(null);
    setFinalId(null);
  }, []);

  const check = useCallback(() => {
    if (!target || !preview || solved) return;
    primeSpeechOnGesture();

    if (preview !== target.syllable) {
      setMissedThisRound(true);
      return;
    }

    setSolved(true);
    // Only the first attempt counts as correct; the deck should keep offering
    // a syllable the learner had to fumble through.
    record(target.syllable, !missedThisRound);
    trackSyllableBuilt({
      hasBatchim: answer?.final !== null,
      correct: !missedThisRound,
    });
    if (soundEnabled) speak(target.syllable);
  }, [answer, missedThisRound, preview, record, soundEnabled, solved, target]);

  const next = useCallback(() => {
    setTarget((current) => pickNext(SYLLABLES, state.syllables, current?.syllable ?? null));
    clear();
    setSolved(false);
    setMissedThisRound(false);
  }, [clear, state.syllables]);

  const reveal = useCallback(() => {
    if (!answer || !target) return;
    setInitialId(answer.initial.id);
    setMedialId(answer.medial.id);
    setFinalId(answer.final?.id ?? null);
    setMissedThisRound(true);
  }, [answer, target]);

  return {
    target,
    answer,
    preview,
    initialId,
    medialId,
    finalId,
    solved,
    missedThisRound,
    setInitialId,
    setMedialId,
    setFinalId,
    check,
    clear,
    next,
    reveal,
    progress: target ? state.syllables[target.syllable] : undefined,
  };
}
