import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { SENTENCES } from '../data/sentences';
import { trackListeningAnswer } from '../lib/analytics';
import { shuffle } from '../lib/quiz';
import { primeSpeechOnGesture, speak } from '../lib/speech';
import type { ListeningProgress, PersistedState, SentenceEntry, SentenceLevel } from '../types';

const OPTION_COUNT = 4;

function emptyListeningProgress(): ListeningProgress {
  return {
    heardCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    replayCount: 0,
    currentCorrectStreak: 0,
    lastHeardAt: null,
  };
}

/** Least-heard first, so a level does not keep replaying its first sentence. */
function pickNext(
  pool: SentenceEntry[],
  progress: Record<string, ListeningProgress>,
  avoid: string | null,
): SentenceEntry | null {
  const candidates = pool.filter((entry) => entry.id !== avoid);
  const usable = candidates.length > 0 ? candidates : pool;
  if (usable.length === 0) return null;

  const scoreOf = (entry: SentenceEntry) => progress[entry.id]?.correctCount ?? 0;
  const lowest = Math.min(...usable.map(scoreOf));
  const leastKnown = usable.filter((entry) => scoreOf(entry) === lowest);
  return leastKnown[Math.floor(Math.random() * leastKnown.length)];
}

/** The correct meaning plus three others from the same level. */
function buildOptions(correct: SentenceEntry, pool: SentenceEntry[]): SentenceEntry[] {
  const distractors = shuffle(pool.filter((entry) => entry.id !== correct.id)).slice(
    0,
    OPTION_COUNT - 1,
  );
  return shuffle([correct, ...distractors]);
}

type UseListeningArgs = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
  soundEnabled: boolean;
};

/**
 * Hear a Korean sentence, choose what it means, then take it apart.
 *
 * The answer is a Vietnamese meaning rather than the Korean text, so the task
 * cannot be solved by matching shapes on screen — the learner has to have
 * understood the audio. The Hangul only appears afterwards, in the breakdown.
 */
export function useListening({ state, setState, soundEnabled }: UseListeningArgs) {
  const [level, setLevel] = useState<SentenceLevel>(1);

  const pool = useMemo(() => SENTENCES.filter((entry) => entry.level === level), [level]);

  const [current, setCurrent] = useState<SentenceEntry | null>(() =>
    pickNext(
      SENTENCES.filter((entry) => entry.level === 1),
      state.listening,
      null,
    ),
  );
  const [options, setOptions] = useState<SentenceEntry[]>(() =>
    current
      ? buildOptions(
          current,
          SENTENCES.filter((entry) => entry.level === 1),
        )
      : [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replays, setReplays] = useState(0);

  const answered = selectedId !== null;
  const isCorrect = answered && selectedId === current?.id;

  const record = useCallback(
    (entry: SentenceEntry, correct: boolean, replayCount: number) => {
      setState((current) => {
        const previous = current.listening[entry.id] ?? emptyListeningProgress();
        return {
          ...current,
          listening: {
            ...current.listening,
            [entry.id]: {
              heardCount: previous.heardCount + 1,
              correctCount: previous.correctCount + (correct ? 1 : 0),
              incorrectCount: previous.incorrectCount + (correct ? 0 : 1),
              replayCount: previous.replayCount + replayCount,
              currentCorrectStreak: correct ? previous.currentCorrectStreak + 1 : 0,
              lastHeardAt: Date.now(),
            },
          },
        };
      });
    },
    [setState],
  );

  const play = useCallback(() => {
    if (!current) return;
    primeSpeechOnGesture();
    if (!answered) setReplays((count) => count + 1);
    if (soundEnabled) speak(current.ko);
  }, [answered, current, soundEnabled]);

  const playWord = useCallback(
    (word: string) => {
      primeSpeechOnGesture();
      if (soundEnabled) speak(word);
    },
    [soundEnabled],
  );

  const answer = useCallback(
    (id: string) => {
      if (!current || answered) return;
      setSelectedId(id);
      const correct = id === current.id;
      record(current, correct, replays);
      trackListeningAnswer({ level: current.level, correct, replayed: replays > 1 });
      if (correct && soundEnabled) speak(current.ko);
    },
    [answered, current, record, replays, soundEnabled],
  );

  const next = useCallback(() => {
    const entry = pickNext(pool, state.listening, current?.id ?? null);
    setCurrent(entry);
    setOptions(entry ? buildOptions(entry, pool) : []);
    setSelectedId(null);
    setReplays(0);
  }, [current, pool, state.listening]);

  const changeLevel = useCallback(
    (nextLevel: SentenceLevel) => {
      if (nextLevel === level) return;
      const nextPool = SENTENCES.filter((entry) => entry.level === nextLevel);
      const entry = pickNext(nextPool, state.listening, null);
      setLevel(nextLevel);
      setCurrent(entry);
      setOptions(entry ? buildOptions(entry, nextPool) : []);
      setSelectedId(null);
      setReplays(0);
    },
    [level, state.listening],
  );

  return {
    level,
    changeLevel,
    current,
    options,
    selectedId,
    answered,
    isCorrect,
    replays,
    play,
    playWord,
    answer,
    next,
    progress: current ? state.listening[current.id] : undefined,
  };
}
