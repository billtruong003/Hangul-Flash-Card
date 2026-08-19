export type HangulCategory =
  'basic-consonant' | 'basic-vowel' | 'tense-consonant' | 'compound-vowel';

export type HangulCharacter = {
  id: string;
  character: string;
  romaja: string;
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

export type PersistedState = {
  version: 2;
  progress: ProgressMap;
  settings: {
    enabledCategories: string[];
    soundEnabled: boolean;
    /** "Chế độ kiểm tra": locks the reference chart away for the whole session. */
    testMode: boolean;
  };
  bestStreak: number;
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
