export type HangulCategory =
  'basic-consonant' | 'basic-vowel' | 'tense-consonant' | 'compound-vowel';

export type HangulCharacter = {
  id: string;
  /** The compatibility jamo (U+3131–U+3163). For display only — never for speech. */
  character: string;
  /** Revised Romanization. The primary label, and unique across all 40 letters. */
  romaja: string;
  /**
   * A real Hangul syllable that demonstrates the letter's sound, e.g. 'ㄱ' → '가'.
   * Speech synthesis reads a bare jamo as the letter's *name* ("기역") or skips it
   * entirely, so every spoken form in the app goes through this field instead.
   */
  demoSyllable: string;
  /** Romanization at the start of a syllable. `null` means silent (ㅇ). Vowels omit it. */
  initialRomaja?: string | null;
  /** Romanization as a final consonant (batchim). `null` means it cannot be one. */
  finalRomaja?: string | null;
  category: HangulCategory;
  explanation?: string;
  confusableIds?: string[];
};

/** "Assisted" means the learner consulted the reference chart before answering. */
export type AnswerResult = 'correct-unassisted' | 'correct-assisted' | 'incorrect';

export type CharacterProgress = {
  shownCount: number;
  unassistedCorrectCount: number;
  assistedCorrectCount: number;
  incorrectCount: number;
  currentUnassistedCorrectStreak: number;
  lastShownAt: number | null;
  lastResult?: AnswerResult;
};

export type ProgressMap = Record<string, CharacterProgress>;

/** The four learning surfaces. Only one is mounted at a time. */
export type LearningSection = 'letters' | 'writing' | 'syllables' | 'listening';

/** Handwriting practice, keyed by the same jamo ids as `HangulCharacter`. */
export type StrokeProgress = {
  attemptCount: number;
  /** Attempts where every stroke passed on the first try. */
  cleanCount: number;
  /** Best score 0–100 ever reached. */
  bestScore: number;
  lastScore: number;
  currentCleanStreak: number;
  lastPracticedAt: number | null;
};

export type StrokeProgressMap = Record<string, StrokeProgress>;

/** Syllable building, keyed by ids from `data/syllables.ts`. */
export type SyllableProgress = {
  builtCount: number;
  correctCount: number;
  incorrectCount: number;
  currentCorrectStreak: number;
  lastBuiltAt: number | null;
};

export type SyllableProgressMap = Record<string, SyllableProgress>;

/** Sentence listening, keyed by ids from `data/sentences.ts`. */
export type ListeningProgress = {
  heardCount: number;
  correctCount: number;
  incorrectCount: number;
  /** Replays asked for before answering, summed over every attempt. */
  replayCount: number;
  currentCorrectStreak: number;
  lastHeardAt: number | null;
};

export type ListeningProgressMap = Record<string, ListeningProgress>;

/**
 * Version 3 is purely additive over version 2: `progress`, `settings` and
 * `bestStreak` are byte-identical inside a v3 blob. The new surfaces sit
 * alongside as sibling maps rather than nesting `progress` one level deeper,
 * which keeps every existing reader working and means there is no v2 data to
 * migrate — only new keys to default.
 */
export type PersistedState = {
  version: 3;
  /** The multiple-choice quiz. Untouched by v3. */
  progress: ProgressMap;
  strokes: StrokeProgressMap;
  syllables: SyllableProgressMap;
  listening: ListeningProgressMap;
  settings: {
    enabledCategories: string[];
    soundEnabled: boolean;
    /** "Chế độ kiểm tra": locks the reference chart away for the whole session. */
    testMode: boolean;
  };
  bestStreak: number;
  /** Where the learner was. Deliberately not under `settings`, which is intent. */
  ui: { section: LearningSection };
};

/**
 * A syllable the learner assembles from jamo. Only the syllable and its meaning
 * are stored: the 초성/중성/종성 breakdown and the romanization are derived from
 * the syllable itself, so they cannot drift out of sync with it.
 *
 * The syllable doubles as the id — unique, stable and self-describing.
 */
export type SyllableEntry = {
  syllable: string;
  meaning: string;
};

export type SentenceWord = {
  ko: string;
  vi: string;
};

/** Levels run word → phrase → sentence, which is also the unlock order. */
export type SentenceLevel = 1 | 2 | 3;

export type SentenceEntry = {
  /** Stable and ASCII, because the Korean text itself may be reworded later. */
  id: string;
  ko: string;
  vi: string;
  /** The sentence split for tap-to-hear. Joined with spaces it must equal `ko`. */
  words: SentenceWord[];
  level: SentenceLevel;
};

/** `char-to-sound` shows the Hangul glyph; `sound-to-char` shows the romaja. */
export type QuizMode = 'char-to-sound' | 'sound-to-char';

export type Question = {
  prompt: HangulCharacter;
  options: HangulCharacter[];
  /** Transient — never persisted. True once the chart has been consulted. */
  assisted: boolean;
};

export type SessionStats = {
  correct: number;
  assisted: number;
  incorrect: number;
  currentStreak: number;
};
