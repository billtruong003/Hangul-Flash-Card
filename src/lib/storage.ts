import { CATEGORY_ORDER, CHARACTERS_BY_ID, DEFAULT_ENABLED_CATEGORIES } from '../data/hangul';
import { SECTION_IDS } from '../data/sections';
import { SENTENCES_BY_ID } from '../data/sentences';
import { SYLLABLES_BY_ID } from '../data/syllables';
import type {
  AnswerResult,
  CharacterProgress,
  LearningSection,
  ListeningProgress,
  PersistedState,
  ProgressMap,
  StrokeProgress,
  SyllableProgress,
} from '../types';

export const STORAGE_KEY = 'hangul-flashcards';
/** Where version 1 lived. Read once, then folded into STORAGE_KEY. */
export const LEGACY_STORAGE_KEY = 'hangul-flashcards:v1';
export const STORAGE_VERSION = 3;

/** Every shape this module can read. Anything else is discarded wholesale. */
const SUPPORTED_VERSIONS: unknown[] = [1, 2, STORAGE_VERSION];

const ANSWER_RESULTS: AnswerResult[] = ['correct-unassisted', 'correct-assisted', 'incorrect'];

export function createDefaultState(): PersistedState {
  return {
    version: STORAGE_VERSION,
    progress: {},
    strokes: {},
    syllables: {},
    listening: {},
    settings: {
      enabledCategories: [...DEFAULT_ENABLED_CATEGORIES],
      soundEnabled: false,
      testMode: false,
    },
    bestStreak: 0,
    ui: { section: 'letters' },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toAnswerResult(value: unknown): AnswerResult | undefined {
  return ANSWER_RESULTS.find((result) => result === value);
}

function parseCharacterProgress(value: unknown): CharacterProgress | null {
  if (!isRecord(value)) return null;
  const lastResult = toAnswerResult(value.lastResult);
  return {
    shownCount: toCount(value.shownCount),
    unassistedCorrectCount: toCount(value.unassistedCorrectCount),
    assistedCorrectCount: toCount(value.assistedCorrectCount),
    incorrectCount: toCount(value.incorrectCount),
    currentUnassistedCorrectStreak: toCount(value.currentUnassistedCorrectStreak),
    lastShownAt: toTimestamp(value.lastShownAt),
    ...(lastResult ? { lastResult } : {}),
  };
}

/**
 * Version 1 knew nothing about the chart, so every recorded answer was made
 * without help: `correctCount` becomes `unassistedCorrectCount` and the old
 * streak carries over untouched. `lastResult` is inferred so migrated
 * characters keep their adaptive priority instead of falling back to neutral.
 */
function migrateCharacterProgressV1(value: unknown): CharacterProgress | null {
  if (!isRecord(value)) return null;
  const unassistedCorrectCount = toCount(value.correctCount);
  const incorrectCount = toCount(value.incorrectCount);
  const currentUnassistedCorrectStreak = toCount(value.currentCorrectStreak);
  const lastResult: AnswerResult | undefined =
    currentUnassistedCorrectStreak > 0
      ? 'correct-unassisted'
      : incorrectCount > 0
        ? 'incorrect'
        : undefined;

  return {
    shownCount: toCount(value.shownCount),
    unassistedCorrectCount,
    assistedCorrectCount: 0,
    incorrectCount,
    currentUnassistedCorrectStreak,
    lastShownAt: toTimestamp(value.lastShownAt),
    ...(lastResult ? { lastResult } : {}),
  };
}

/**
 * One walker for every id-keyed progress map. Drops ids the app no longer
 * recognises — which matters most for the sentence deck, since that content is
 * expected to change between releases and stale entries should just disappear.
 */
function parseKeyedMap<T>(
  value: unknown,
  isKnownId: (id: string) => boolean,
  parseEntry: (entry: unknown) => T | null,
): Record<string, T> {
  if (!isRecord(value)) return {};
  const result: Record<string, T> = {};
  for (const [id, entry] of Object.entries(value)) {
    if (!isKnownId(id)) continue;
    const parsed = parseEntry(entry);
    if (parsed) result[id] = parsed;
  }
  return result;
}

const isCharacterId = (id: string) => Boolean(CHARACTERS_BY_ID[id]);
const isSyllableId = (id: string) => Boolean(SYLLABLES_BY_ID[id]);
const isSentenceId = (id: string) => Boolean(SENTENCES_BY_ID[id]);

function parseProgress(
  value: unknown,
  parseEntry: (entry: unknown) => CharacterProgress | null,
): ProgressMap {
  return parseKeyedMap(value, isCharacterId, parseEntry);
}

/** Same "repair, never throw" contract as toCount, clamped to a 0–100 grade. */
function toScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseStrokeProgress(value: unknown): StrokeProgress | null {
  if (!isRecord(value)) return null;
  return {
    attemptCount: toCount(value.attemptCount),
    cleanCount: toCount(value.cleanCount),
    bestScore: toScore(value.bestScore),
    lastScore: toScore(value.lastScore),
    currentCleanStreak: toCount(value.currentCleanStreak),
    lastPracticedAt: toTimestamp(value.lastPracticedAt),
  };
}

function parseSyllableProgress(value: unknown): SyllableProgress | null {
  if (!isRecord(value)) return null;
  return {
    builtCount: toCount(value.builtCount),
    correctCount: toCount(value.correctCount),
    incorrectCount: toCount(value.incorrectCount),
    currentCorrectStreak: toCount(value.currentCorrectStreak),
    lastBuiltAt: toTimestamp(value.lastBuiltAt),
  };
}

function parseListeningProgress(value: unknown): ListeningProgress | null {
  if (!isRecord(value)) return null;
  return {
    heardCount: toCount(value.heardCount),
    correctCount: toCount(value.correctCount),
    incorrectCount: toCount(value.incorrectCount),
    replayCount: toCount(value.replayCount),
    currentCorrectStreak: toCount(value.currentCorrectStreak),
    lastHeardAt: toTimestamp(value.lastHeardAt),
  };
}

function parseSection(value: unknown): LearningSection {
  return SECTION_IDS.find((section) => section === value) ?? 'letters';
}

function parseEnabledCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_ENABLED_CATEGORIES];
  const categories = value.filter(
    (category): category is string =>
      typeof category === 'string' && (CATEGORY_ORDER as string[]).includes(category),
  );
  return categories.length > 0 ? Array.from(new Set(categories)) : [...DEFAULT_ENABLED_CATEGORIES];
}

/** Turns anything found in storage into a usable state, falling back per field. */
export function parsePersistedState(raw: unknown): PersistedState {
  if (!isRecord(raw)) return createDefaultState();
  if (!SUPPORTED_VERSIONS.includes(raw.version)) return createDefaultState();

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const ui = isRecord(raw.ui) ? raw.ui : {};

  return {
    version: STORAGE_VERSION,
    // Version 1 is the only shape whose character entries need reworking;
    // versions 2 and 3 store CharacterProgress identically, so one parser
    // covers both and a v2 blob keeps its quiz history untouched.
    progress:
      raw.version === 1
        ? parseProgress(raw.progress, migrateCharacterProgressV1)
        : parseProgress(raw.progress, parseCharacterProgress),
    // These three surfaces did not exist before version 3, which is why there
    // is no migration for them — anything older simply starts empty.
    strokes: parseKeyedMap(raw.strokes, isCharacterId, parseStrokeProgress),
    syllables: parseKeyedMap(raw.syllables, isSyllableId, parseSyllableProgress),
    listening: parseKeyedMap(raw.listening, isSentenceId, parseListeningProgress),
    settings: {
      enabledCategories: parseEnabledCategories(settings.enabledCategories),
      soundEnabled: settings.soundEnabled === true,
      testMode: settings.testMode === true,
    },
    bestStreak: toCount(raw.bestStreak),
    ui: { section: parseSection(ui.section) },
  };
}

export function loadState(): PersistedState {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultState();
    return parsePersistedState(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: PersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Private mode or a full quota — the app keeps working from memory.
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Nothing to recover from; in-memory state is reset by the caller anyway.
  }
}
