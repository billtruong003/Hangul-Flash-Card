import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { SENTENCES } from '../data/sentences';
import { trackListeningAnswer } from '../lib/analytics';
import { OPTION_COUNT, pickLeastPractised, shuffle } from '../lib/quiz';
import { primeSpeechOnGesture, speak } from '../lib/speech';
import type {
  ListeningProgress,
  PersistedState,
  SentenceEntry,
  SentenceLevel,
  SentenceTopic,
} from '../types';

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
  return pickLeastPractised(
    pool,
    (entry) => entry.id,
    (entry) => progress[entry.id]?.correctCount ?? 0,
    avoid,
  );
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
/**
 * Level and topic are independent filters over the same deck, so `null` topic
 * means "every topic at this level" rather than a fourth pseudo-topic.
 */
function poolFor(level: SentenceLevel, topic: SentenceTopic | null): SentenceEntry[] {
  return SENTENCES.filter(
    (entry) => entry.level === level && (topic === null || entry.topic === topic),
  );
}

type Round = { entry: SentenceEntry; options: SentenceEntry[] };

export function useListening({ state, setState, soundEnabled }: UseListeningArgs) {
  const [level, setLevel] = useState<SentenceLevel>(1);
  const [topic, setTopic] = useState<SentenceTopic | null>(null);

  const pool = useMemo(() => poolFor(level, topic), [level, topic]);

  // The question and its options are one thing, so they are one piece of state.
  // Keeping them apart meant restoring the invariant by hand in three places.
  const startRound = useCallback(
    (
      from: SentenceEntry[],
      avoid: string | null,
      progress: PersistedState['listening'],
    ): Round | null => {
      const entry = pickNext(from, progress, avoid);
      return entry ? { entry, options: buildOptions(entry, from) } : null;
    },
    [],
  );

  const [round, setRound] = useState<Round | null>(() => {
    const initial = poolFor(1, null);
    const entry = pickNext(initial, state.listening, null);
    return entry ? { entry, options: buildOptions(entry, initial) } : null;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replays, setReplays] = useState(0);

  const current = round?.entry ?? null;
  const options = round?.options ?? [];

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

  const deal = useCallback(
    (from: SentenceEntry[], avoid: string | null) => {
      setRound(startRound(from, avoid, state.listening));
      setSelectedId(null);
      setReplays(0);
    },
    [startRound, state.listening],
  );

  const next = useCallback(() => deal(pool, current?.id ?? null), [current, deal, pool]);

  const changeLevel = useCallback(
    (nextLevel: SentenceLevel) => {
      if (nextLevel === level) return;
      setLevel(nextLevel);
      deal(poolFor(nextLevel, topic), null);
    },
    [deal, level, topic],
  );

  const changeTopic = useCallback(
    (nextTopic: SentenceTopic | null) => {
      if (nextTopic === topic) return;
      setTopic(nextTopic);
      deal(poolFor(level, nextTopic), null);
    },
    [deal, level, topic],
  );

  return {
    level,
    changeLevel,
    topic,
    changeTopic,
    poolSize: pool.length,
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
