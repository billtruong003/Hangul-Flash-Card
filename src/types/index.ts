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
